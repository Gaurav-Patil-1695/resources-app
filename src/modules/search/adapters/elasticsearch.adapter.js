'use strict';

const { Client } = require('@elastic/elasticsearch');

/**
 * Elasticsearch adapter — client wrapper, index mapping helpers, query builders.
 */

let clientInstance = null;

/**
 * Returns a singleton Elasticsearch client.
 * Configuration is read from environment variables:
 *   ES_NODE        – Elasticsearch node URL (default: http://localhost:9200)
 *   ES_USERNAME    – optional HTTP basic-auth username
 *   ES_PASSWORD    – optional HTTP basic-auth password
 *   ES_TLS_CA      – optional path to a PEM CA certificate
 *
 * @returns {Client}
 */
function getClient() {
  if (clientInstance) {
    return clientInstance;
  }

  const node = process.env.ES_NODE || 'http://localhost:9200';

  const clientOptions = { node };

  if (process.env.ES_USERNAME && process.env.ES_PASSWORD) {
    clientOptions.auth = {
      username: process.env.ES_USERNAME,
      password: process.env.ES_PASSWORD,
    };
  }

  if (process.env.ES_TLS_CA) {
    const fs = require('fs');
    clientOptions.tls = {
      ca: fs.readFileSync(process.env.ES_TLS_CA),
      rejectUnauthorized: true,
    };
  }

  clientInstance = new Client(clientOptions);
  return clientInstance;
}

// ---------------------------------------------------------------------------
// Index mapping helpers
// ---------------------------------------------------------------------------

/**
 * Standard keyword-text field pair used for exact filtering + full-text search.
 *
 * @param {object} [options]
 * @param {string} [options.analyzer='standard']
 * @returns {object}
 */
function textKeywordField({ analyzer = 'standard' } = {}) {
  return {
    type: 'text',
    analyzer,
    fields: {
      keyword: {
        type: 'keyword',
        ignore_above: 256,
      },
    },
  };
}

/**
 * Standard date field mapping.
 *
 * @param {string} [format='strict_date_optional_time||epoch_millis']
 * @returns {object}
 */
function dateField(format = 'strict_date_optional_time||epoch_millis') {
  return { type: 'date', format };
}

/**
 * Standard integer field mapping.
 *
 * @returns {object}
 */
function integerField() {
  return { type: 'integer' };
}

/**
 * Standard long field mapping.
 *
 * @returns {object}
 */
function longField() {
  return { type: 'long' };
}

/**
 * Standard float field mapping.
 *
 * @returns {object}
 */
function floatField() {
  return { type: 'float' };
}

/**
 * Standard boolean field mapping.
 *
 * @returns {object}
 */
function booleanField() {
  return { type: 'boolean' };
}

/**
 * Keyword-only field (no full-text analysis).
 *
 * @returns {object}
 */
function keywordField() {
  return { type: 'keyword' };
}

/**
 * Builds a complete index settings + mappings body.
 *
 * @param {object} properties  – field property definitions
 * @param {object} [settings]  – optional index settings overrides
 * @returns {object}
 */
function buildIndexBody(properties, settings = {}) {
  return {
    settings: {
      number_of_shards: 1,
      number_of_replicas: 1,
      ...settings,
    },
    mappings: {
      properties,
    },
  };
}

/**
 * Creates an index if it does not already exist.
 *
 * @param {string} indexName
 * @param {object} properties  – Elasticsearch field mappings
 * @param {object} [settings]  – optional index-level settings
 * @returns {Promise<object>}  Elasticsearch API response
 */
async function ensureIndex(indexName, properties, settings = {}) {
  const client = getClient();

  const exists = await client.indices.exists({ index: indexName });
  if (exists) {
    return { acknowledged: true, index: indexName, created: false };
  }

  const body = buildIndexBody(properties, settings);
  const response = await client.indices.create({ index: indexName, body });
  return { ...response, created: true };
}

/**
 * Deletes an index.
 *
 * @param {string} indexName
 * @returns {Promise<object>}
 */
async function deleteIndex(indexName) {
  const client = getClient();
  return client.indices.delete({ index: indexName });
}

/**
 * Updates the mappings of an existing index.
 *
 * @param {string} indexName
 * @param {object} properties
 * @returns {Promise<object>}
 */
async function putMapping(indexName, properties) {
  const client = getClient();
  return client.indices.putMapping({
    index: indexName,
    body: { properties },
  });
}

// ---------------------------------------------------------------------------
// Query builders
// ---------------------------------------------------------------------------

/**
 * Builds a `match_all` query.
 *
 * @returns {object}
 */
function matchAllQuery() {
  return { match_all: {} };
}

/**
 * Builds a `match` query.
 *
 * @param {string} field
 * @param {string|number|boolean} value
 * @param {object} [options]  – additional match parameters (operator, fuzziness, …)
 * @returns {object}
 */
function matchQuery(field, value, options = {}) {
  return {
    match: {
      [field]: { query: value, ...options },
    },
  };
}

/**
 * Builds a `multi_match` query.
 *
 * @param {string[]} fields
 * @param {string}   query
 * @param {object}  [options]  – additional multi_match parameters (type, fuzziness, …)
 * @returns {object}
 */
function multiMatchQuery(fields, query, options = {}) {
  return {
    multi_match: {
      query,
      fields,
      ...options,
    },
  };
}

/**
 * Builds a `term` query (exact match on a keyword / numeric field).
 *
 * @param {string} field
 * @param {string|number|boolean} value
 * @returns {object}
 */
function termQuery(field, value) {
  return { term: { [field]: { value } } };
}

/**
 * Builds a `terms` query (multi-value exact match).
 *
 * @param {string}   field
 * @param {Array}    values
 * @returns {object}
 */
function termsQuery(field, values) {
  return { terms: { [field]: values } };
}

/**
 * Builds a `range` query.
 *
 * @param {string} field
 * @param {object} options – { gte, gt, lte, lt, format, … }
 * @returns {object}
 */
function rangeQuery(field, options = {}) {
  return { range: { [field]: options } };
}

/**
 * Builds a `bool` query.
 *
 * @param {object} clauses
 * @param {object[]} [clauses.must]
 * @param {object[]} [clauses.filter]
 * @param {object[]} [clauses.should]
 * @param {object[]} [clauses.must_not]
 * @param {number}   [clauses.minimum_should_match]
 * @returns {object}
 */
function boolQuery({
  must = [],
  filter = [],
  should = [],
  must_not = [],
  minimum_should_match,
} = {}) {
  const bool = {};

  if (must.length) bool.must = must;
  if (filter.length) bool.filter = filter;
  if (should.length) bool.should = should;
  if (must_not.length) bool.must_not = must_not;
  if (minimum_should_match !== undefined) {
    bool.minimum_should_match = minimum_should_match;
  }

  return { bool };
}

/**
 * Builds a `nested` query.
 *
 * @param {string} path
 * @param {object} query
 * @param {string} [scoreMode='none']
 * @returns {object}
 */
function nestedQuery(path, query, scoreMode = 'none') {
  return { nested: { path, query, score_mode: scoreMode } };
}

/**
 * Builds a `exists` query.
 *
 * @param {string} field
 * @returns {object}
 */
function existsQuery(field) {
  return { exists: { field } };
}

/**
 * Builds a `wildcard` query.
 *
 * @param {string} field
 * @param {string} value  – pattern with * and ? wildcards
 * @returns {object}
 */
function wildcardQuery(field, value) {
  return { wildcard: { [field]: { value } } };
}

/**
 * Builds a `prefix` query.
 *
 * @param {string} field
 * @param {string} value
 * @returns {object}
 */
function prefixQuery(field, value) {
  return { prefix: { [field]: { value } } };
}

// ---------------------------------------------------------------------------
// Sort / pagination helpers
// ---------------------------------------------------------------------------

/**
 * Builds a sort clause entry.
 *
 * @param {string} field
 * @param {'asc'|'desc'} [order='asc']
 * @param {object} [options]  – additional sort params (missing, mode, …)
 * @returns {object}
 */
function sortClause(field, order = 'asc', options = {}) {
  return { [field]: { order, ...options } };
}

/**
 * Converts page-based pagination to from/size parameters.
 *
 * @param {number} page      – 1-based page number
 * @param {number} pageSize  – number of results per page
 * @returns {{ from: number, size: number }}
 */
function paginationParams(page, pageSize) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeSize = Math.max(1, parseInt(pageSize, 10) || 10);
  return {
    from: (safePage - 1) * safeSize,
    size: safeSize,
  };
}

// ---------------------------------------------------------------------------
// Aggregation builders
// ---------------------------------------------------------------------------

/**
 * Builds a `terms` aggregation.
 *
 * @param {string} field
 * @param {number} [size=10]
 * @returns {object}
 */
function termsAggregation(field, size = 10) {
  return { terms: { field, size } };
}

/**
 * Builds a `date_histogram` aggregation.
 *
 * @param {string} field
 * @param {string} calendarInterval – e.g. 'month', 'day', 'year'
 * @returns {object}
 */
function dateHistogramAggregation(field, calendarInterval) {
  return { date_histogram: { field, calendar_interval: calendarInterval } };
}

/**
 * Builds a `range` aggregation.
 *
 * @param {string}   field
 * @param {Array<{from?: number|string, to?: number|string, key?: string}>} ranges
 * @returns {object}
 */
function rangeAggregation(field, ranges) {
  return { range: { field, ranges } };
}

// ---------------------------------------------------------------------------
// High-level search execution
// ---------------------------------------------------------------------------

/**
 * Executes a search request against an index.
 *
 * @param {string} indexName
 * @param {object} params
 * @param {object}   [params.query]       – Elasticsearch query DSL
 * @param {object[]} [params.sort]        – array of sort clause objects
 * @param {number}   [params.from]        – offset
 * @param {number}   [params.size]        – page size
 * @param {string[]} [params.sourceFields]– _source fields to return (all if omitted)
 * @param {object}   [params.aggs]        – aggregations map
 * @param {boolean}  [params.trackTotal]  – track total hits (default true)
 * @returns {Promise<{
 *   total: number,
 *   hits: object[],
 *   aggregations: object|undefined
 * }>}
 */
async function search(indexName, params = {}) {
  const client = getClient();

  const {
    query = matchAllQuery(),
    sort = [],
    from = 0,
    size = 10,
    sourceFields,
    aggs,
    trackTotal = true,
  } = params;

  const body = { query };

  if (sort.length) body.sort = sort;
  if (aggs) body.aggs = aggs;

  const requestParams = {
    index: indexName,
    from,
    size,
    track_total_hits: trackTotal,
    body,
  };

  if (sourceFields && sourceFields.length) {
    requestParams._source = sourceFields;
  }

  const response = await client.search(requestParams);

  const total =
    typeof response.hits.total === 'number'
      ? response.hits.total
      : response.hits.total.value;

  const hits = response.hits.hits.map((hit) => ({
    _id: hit._id,
    _score: hit._score,
    ...hit._source,
  }));

  return {
    total,
    hits,
    aggregations: response.aggregations,
  };
}

/**
 * Indexes (creates or replaces) a single document.
 *
 * @param {string} indexName
 * @param {string} id
 * @param {object} document
 * @returns {Promise<object>}
 */
async function indexDocument(indexName, id, document) {
  const client = getClient();
  return client.index({
    index: indexName,
    id,
    body: document,
    refresh: 'wait_for',
  });
}

/**
 * Updates a document by ID using a partial body.
 *
 * @param {string} indexName
 * @param {string} id
 * @param {object} partialDocument
 * @returns {Promise<object>}
 */
async function updateDocument(indexName, id, partialDocument) {
  const client = getClient();
  return client.update({
    index: indexName,
    id,
    body: { doc: partialDocument },
    refresh: 'wait_for',
  });
}

/**
 * Deletes a document by ID.
 *
 * @param {string} indexName
 * @param {string} id
 * @returns {Promise<object>}
 */
async function deleteDocument(indexName, id) {
  const client = getClient();
  return client.delete({
    index: indexName,
    id,
    refresh: 'wait_for',
  });
}

/**
 * Bulk-indexes an array of documents.
 * Each entry must have an `id` property and a `document` property.
 *
 * @param {string} indexName
 * @param {Array<{ id: string, document: object }>} items
 * @returns {Promise<{ errors: boolean, items: object[] }>}
 */
async function bulkIndex(indexName, items) {
  const client = getClient();

  const body = items.flatMap(({ id, document }) => [
    { index: { _index: indexName, _id: id } },
    document,
  ]);

  const response = await client.bulk({ refresh: 'wait_for', body });
  return { errors: response.errors, items: response.items };
}

/**
 * Retrieves a document by ID.
 *
 * @param {string} indexName
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function getDocument(indexName, id) {
  const client = getClient();
  try {
    const response = await client.get({ index: indexName, id });
    return { _id: response._id, ...response._source };
  } catch (err) {
    if (err.meta && err.meta.statusCode === 404) {
      return null;
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  // Client
  getClient,

  // Index mapping helpers
  textKeywordField,
  dateField,
  integerField,
  longField,
  floatField,
  booleanField,
  keywordField,
  buildIndexBody,
  ensureIndex,
  deleteIndex,
  putMapping,

  // Query builders
  matchAllQuery,
  matchQuery,
  multiMatchQuery,
  termQuery,
  termsQuery,
  rangeQuery,
  boolQuery,
  nestedQuery,
  existsQuery,
  wildcardQuery,
  prefixQuery,

  // Sort / pagination
  sortClause,
  paginationParams,

  // Aggregation builders
  termsAggregation,
  dateHistogramAggregation,
  rangeAggregation,

  // High-level operations
  search,
  indexDocument,
  updateDocument,
  deleteDocument,
  bulkIndex,
  getDocument,
};
