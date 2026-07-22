/**
 * Parse and normalise page / limit query parameters.
 *
 * @param {object} query - Express request.query object
 * @param {number} [defaultLimit=20] - Default page size when not supplied
 * @param {number} [maxLimit=100]    - Hard upper bound for page size
 * @returns {{ page: number, limit: number, offset: number }}
 */
const parsePagination = (query, defaultLimit = 20, maxLimit = 100) => {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (!Number.isFinite(page) || page < 1) {
    page = 1;
  }

  if (!Number.isFinite(limit) || limit < 1) {
    limit = defaultLimit;
  }

  if (limit > maxLimit) {
    limit = maxLimit;
  }

  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Build a standardised paginated response envelope.
 *
 * @param {Array}  data       - The records for the current page
 * @param {number} total      - Total number of matching records
 * @param {number} page       - Current page number (1-based)
 * @param {number} limit      - Page size used for this request
 * @returns {object}
 */
const buildPaginatedResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      perPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

module.exports = { parsePagination, buildPaginatedResponse };
