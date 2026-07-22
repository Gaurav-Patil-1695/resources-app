const { getElasticsearchClient } = require('../../config/elasticsearch');

const SEARCH_INDEX = process.env.ES_SEARCH_INDEX || 'catalog';

/**
 * Perform a full-text search with faceted filter aggregations.
 *
 * @param {Object} params
 * @param {string} params.query      - The search query string
 * @param {Object} params.filters    - Key/value map of facet filters
 * @param {number} params.page       - 1-based page number
 * @param {number} params.size       - Number of results per page
 * @returns {Promise<Object>}
 */
async function search({ query, filters, page, size }) {
  const client = getElasticsearchClient();

  const from = (page - 1) * size;

  // Build must clauses
  const mustClauses = [];
  if (query && query.trim() !== '') {
    mustClauses.push({
      multi_match: {
        query: query.trim(),
        fields: ['title^3', 'description^2', 'tags', 'category'],
        fuzziness: 'AUTO',
      },
    });
  } else {
    mustClauses.push({ match_all: {} });
  }

  // Build filter clauses from facets
  const filterClauses = Object.entries(filters || {}).map(([field, value]) => {
    if (Array.isArray(value)) {
      return { terms: { [field]: value } };
    }
    return { term: { [field]: value } };
  });

  // Aggregations for facets
  const aggregations = {
    category: {
      terms: { field: 'category.keyword', size: 20 },
    },
    tags: {
      terms: { field: 'tags.keyword', size: 30 },
    },
    status: {
      terms: { field: 'status.keyword', size: 10 },
    },
  };

  const esQuery = {
    index: SEARCH_INDEX,
    from,
    size,
    body: {
      query: {
        bool: {
          must: mustClauses,
          filter: filterClauses,
        },
      },
      aggregations,
      highlight: {
        fields: {
          title: {},
          description: {},
        },
      },
    },
  };

  const response = await client.search(esQuery);

  const hits = response.body || response;
  const hitsData = hits.hits || {};
  const total = hitsData.total ? (typeof hitsData.total === 'object' ? hitsData.total.value : hitsData.total) : 0;
  const items = (hitsData.hits || []).map((hit) => ({
    id: hit._id,
    score: hit._score,
    highlight: hit.highlight || {},
    ...hit._source,
  }));

  const facets = {};
  const aggs = hits.aggregations || {};
  for (const [key, agg] of Object.entries(aggs)) {
    facets[key] = (agg.buckets || []).map((bucket) => ({
      value: bucket.key,
      count: bucket.doc_count,
    }));
  }

  return {
    total,
    page,
    size,
    totalPages: Math.ceil(total / size),
    items,
    facets,
  };
}

/**
 * Provide autocomplete suggestions for a partial query.
 *
 * @param {Object} params
 * @param {string} params.query  - The partial query string
 * @param {number} params.size   - Number of suggestions to return
 * @returns {Promise<Object>}
 */
async function suggest({ query, size }) {
  const client = getElasticsearchClient();

  const esQuery = {
    index: SEARCH_INDEX,
    body: {
      suggest: {
        title_suggest: {
          prefix: query.trim(),
          completion: {
            field: 'title.suggest',
            size,
            skip_duplicates: true,
            fuzzy: {
              fuzziness: 'AUTO',
            },
          },
        },
      },
      _source: ['title', 'category', 'id'],
    },
  };

  const response = await client.search(esQuery);
  const responseBody = response.body || response;
  const suggestions = responseBody.suggest || {};
  const titleSuggestions = suggestions.title_suggest || [];

  const options = titleSuggestions.length > 0 ? titleSuggestions[0].options || [] : [];

  const results = options.map((option) => ({
    id: option._id,
    text: option.text,
    score: option._score,
    ...option._source,
  }));

  return {
    query,
    suggestions: results,
  };
}

module.exports = {
  search,
  suggest,
};
