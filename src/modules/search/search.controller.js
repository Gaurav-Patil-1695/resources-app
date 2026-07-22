const searchService = require('./search.service');

/**
 * Handle GET /search
 * Full-text search with optional faceted filters, pagination
 */
async function search(req, res, next) {
  try {
    const { q, filters, page, size } = req.query;

    const parsedPage = parseInt(page, 10) || 1;
    const parsedSize = parseInt(size, 10) || 10;

    let parsedFilters = {};
    if (filters) {
      try {
        parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;
      } catch {
        parsedFilters = {};
      }
    }

    const result = await searchService.search({
      query: q || '',
      filters: parsedFilters,
      page: parsedPage,
      size: parsedSize,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Handle GET /search/autocomplete
 * Autocomplete suggestions based on partial query
 */
async function suggest(req, res, next) {
  try {
    const { q, size } = req.query;

    const parsedSize = parseInt(size, 10) || 5;

    const result = await searchService.suggest({
      query: q || '',
      size: parsedSize,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  search,
  suggest,
};
