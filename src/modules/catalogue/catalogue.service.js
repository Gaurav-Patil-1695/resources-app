const db = require('../../db');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPagination(page, limit) {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (parsedPage - 1) * parsedLimit;
  return { parsedPage, parsedLimit, offset };
}

function buildProductOrderClause(sortBy, sortOrder) {
  const allowedSortFields = ['name', 'price', 'created_at', 'updated_at'];
  const allowedSortOrders = ['asc', 'desc'];
  const field = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
  const order = allowedSortOrders.includes((sortOrder || '').toLowerCase()) ? sortOrder.toLowerCase() : 'desc';
  return `p.${field} ${order.toUpperCase()}`;
}

// ─── Products ────────────────────────────────────────────────────────────────

async function listProducts(filters = {}) {
  const { categoryId, brandId, minPrice, maxPrice, search, page, limit, sortBy, sortOrder } = filters;
  const { parsedPage, parsedLimit, offset } = buildPagination(page, limit);
  const orderClause = buildProductOrderClause(sortBy, sortOrder);

  const conditions = ['p.deleted_at IS NULL'];
  const params = [];

  if (categoryId) {
    params.push(categoryId);
    conditions.push(`p.category_id = $${params.length}`);
  }
  if (brandId) {
    params.push(brandId);
    conditions.push(`p.brand_id = $${params.length}`);
  }
  if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
    params.push(parseFloat(minPrice));
    conditions.push(`p.base_price >= $${params.length}`);
  }
  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
    params.push(parseFloat(maxPrice));
    conditions.push(`p.base_price <= $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM products p
    ${whereClause}
  `;

  const dataQuery = `
    SELECT
      p.id,
      p.name,
      p.slug,
      p.description,
      p.base_price,
      p.category_id,
      p.brand_id,
      p.status,
      p.created_at,
      p.updated_at,
      b.name AS brand_name,
      c.name AS category_name
    FROM products p
    LEFT JOIN brands b ON b.id = p.brand_id
    LEFT JOIN categories c ON c.id = p.category_id
    ${whereClause}
    ORDER BY ${orderClause}
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const [countResult, dataResult] = await Promise.all([
    db.query(countQuery, params),
    db.query(dataQuery, [...params, parsedLimit, offset]),
  ]);

  const total = parseInt(countResult.rows[0].total, 10);

  return {
    data: dataResult.rows,
    meta: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
}

async function getProductById(productId) {
  const result = await db.query(
    `SELECT
      p.id,
      p.name,
      p.slug,
      p.description,
      p.base_price,
      p.category_id,
      p.brand_id,
      p.status,
      p.created_at,
      p.updated_at,
      b.name AS brand_name,
      c.name AS category_name
    FROM products p
    LEFT JOIN brands b ON b.id = p.brand_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.id = $1 AND p.deleted_at IS NULL`,
    [productId]
  );
  if (!result.rows.length) return null;
  const product = result.rows[0];
  const [images, skus] = await Promise.all([
    listProductImages(productId),
    listSkus(productId),
  ]);
  return { ...product, images, skus };
}

async function createProduct(data) {
  const { name, slug, description, base_price, category_id, brand_id, status } = data;
  const result = await db.query(
    `INSERT INTO products (name, slug, description, base_price, category_id, brand_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [name, slug, description || null, base_price, category_id || null, brand_id || null, status || 'active']
  );
  return result.rows[0];
}

async function updateProduct(productId, data) {
  const existing = await db.query(
    'SELECT id FROM products WHERE id = $1 AND deleted_at IS NULL',
    [productId]
  );
  if (!existing.rows.length) return null;

  const { name, slug, description, base_price, category_id, brand_id, status } = data;
  const result = await db.query(
    `UPDATE products
     SET name = COALESCE($1, name),
         slug = COALESCE($2, slug),
         description = COALESCE($3, description),
         base_price = COALESCE($4, base_price),
         category_id = COALESCE($5, category_id),
         brand_id = COALESCE($6, brand_id),
         status = COALESCE($7, status),
         updated_at = NOW()
     WHERE id = $8 AND deleted_at IS NULL
     RETURNING *`,
    [name, slug, description, base_price, category_id, brand_id, status, productId]
  );
  return result.rows[0] || null;
}

async function deleteProduct(productId) {
  const result = await db.query(
    `UPDATE products SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
    [productId]
  );
  return result.rows.length > 0;
}

// ─── SKUs ─────────────────────────────────────────────────────────────────────

async function listSkus(productId) {
  const result = await db.query(
    `SELECT
      s.id,
      s.product_id,
      s.sku_code,
      s.attributes,
      s.price,
      s.stock_quantity,
      s.status,
      s.created_at,
      s.updated_at
     FROM skus s
     WHERE s.product_id = $1 AND s.deleted_at IS NULL
     ORDER BY s.created_at ASC`,
    [productId]
  );
  return result.rows;
}

async function getSkuById(productId, skuId) {
  const result = await db.query(
    `SELECT
      s.id,
      s.product_id,
      s.sku_code,
      s.attributes,
      s.price,
      s.stock_quantity,
      s.status,
      s.created_at,
      s.updated_at
     FROM skus s
     WHERE s.id = $1 AND s.product_id = $2 AND s.deleted_at IS NULL`,
    [skuId, productId]
  );
  return result.rows[0] || null;
}

async function createSku(productId, data) {
  const productExists = await db.query(
    'SELECT id FROM products WHERE id = $1 AND deleted_at IS NULL',
    [productId]
  );
  if (!productExists.rows.length) {
    const err = new Error('Product not found.');
    err.status = 404;
    throw err;
  }

  const { sku_code, attributes, price, stock_quantity, status } = data;
  const result = await db.query(
    `INSERT INTO skus (product_id, sku_code, attributes, price, stock_quantity, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [productId, sku_code, attributes || {}, price, stock_quantity || 0, status || 'active']
  );
  return result.rows[0];
}

async function updateSku(productId, skuId, data) {
  const existing = await db.query(
    'SELECT id FROM skus WHERE id = $1 AND product_id = $2 AND deleted_at IS NULL',
    [skuId, productId]
  );
  if (!existing.rows.length) return null;

  const { sku_code, attributes, price, stock_quantity, status } = data;
  const result = await db.query(
    `UPDATE skus
     SET sku_code = COALESCE($1, sku_code),
         attributes = COALESCE($2, attributes),
         price = COALESCE($3, price),
         stock_quantity = COALESCE($4, stock_quantity),
         status = COALESCE($5, status),
         updated_at = NOW()
     WHERE id = $6 AND product_id = $7 AND deleted_at IS NULL
     RETURNING *`,
    [sku_code, attributes, price, stock_quantity, status, skuId, productId]
  );
  return result.rows[0] || null;
}

async function deleteSku(productId, skuId) {
  const result = await db.query(
    `UPDATE skus SET deleted_at = NOW()
     WHERE id = $1 AND product_id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [skuId, productId]
  );
  return result.rows.length > 0;
}

// ─── Images ───────────────────────────────────────────────────────────────────

async function listProductImages(productId) {
  const result = await db.query(
    `SELECT
      i.id,
      i.product_id,
      i.url,
      i.alt_text,
      i.sort_order,
      i.created_at
     FROM product_images i
     WHERE i.product_id = $1
     ORDER BY i.sort_order ASC, i.created_at ASC`,
    [productId]
  );
  return result.rows;
}

async function addProductImage(productId, data) {
  const productExists = await db.query(
    'SELECT id FROM products WHERE id = $1 AND deleted_at IS NULL',
    [productId]
  );
  if (!productExists.rows.length) {
    const err = new Error('Product not found.');
    err.status = 404;
    throw err;
  }

  const { url, alt_text, sort_order } = data;
  const result = await db.query(
    `INSERT INTO product_images (product_id, url, alt_text, sort_order)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [productId, url, alt_text || null, sort_order || 0]
  );
  return result.rows[0];
}

async function deleteProductImage(productId, imageId) {
  const result = await db.query(
    `DELETE FROM product_images
     WHERE id = $1 AND product_id = $2
     RETURNING id`,
    [imageId, productId]
  );
  return result.rows.length > 0;
}

// ─── Categories ───────────────────────────────────────────────────────────────

async function listCategories() {
  const result = await db.query(
    `SELECT
      c.id,
      c.name,
      c.slug,
      c.description,
      c.parent_id,
      c.image_url,
      c.status,
      c.created_at,
      c.updated_at
     FROM categories c
     WHERE c.deleted_at IS NULL
     ORDER BY c.name ASC`
  );
  return result.rows;
}

async function getCategoryById(categoryId) {
  const result = await db.query(
    `SELECT
      c.id,
      c.name,
      c.slug,
      c.description,
      c.parent_id,
      c.image_url,
      c.status,
      c.created_at,
      c.updated_at
     FROM categories c
     WHERE c.id = $1 AND c.deleted_at IS NULL`,
    [categoryId]
  );
  return result.rows[0] || null;
}

async function createCategory(data) {
  const { name, slug, description, parent_id, image_url, status } = data;
  const result = await db.query(
    `INSERT INTO categories (name, slug, description, parent_id, image_url, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, slug, description || null, parent_id || null, image_url || null, status || 'active']
  );
  return result.rows[0];
}

async function updateCategory(categoryId, data) {
  const existing = await db.query(
    'SELECT id FROM categories WHERE id = $1 AND deleted_at IS NULL',
    [categoryId]
  );
  if (!existing.rows.length) return null;

  const { name, slug, description, parent_id, image_url, status } = data;
  const result = await db.query(
    `UPDATE categories
     SET name = COALESCE($1, name),
         slug = COALESCE($2, slug),
         description = COALESCE($3, description),
         parent_id = COALESCE($4, parent_id),
         image_url = COALESCE($5, image_url),
         status = COALESCE($6, status),
         updated_at = NOW()
     WHERE id = $7 AND deleted_at IS NULL
     RETURNING *`,
    [name, slug, description, parent_id, image_url, status, categoryId]
  );
  return result.rows[0] || null;
}

async function deleteCategory(categoryId) {
  const result = await db.query(
    `UPDATE categories SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
    [categoryId]
  );
  return result.rows.length > 0;
}

async function listProductsByCategory(categoryId, filters = {}) {
  const categoryExists = await getCategoryById(categoryId);
  if (!categoryExists) {
    const err = new Error('Category not found.');
    err.status = 404;
    throw err;
  }
  return listProducts({ ...filters, categoryId });
}

// ─── Brands ───────────────────────────────────────────────────────────────────

async function listBrands() {
  const result = await db.query(
    `SELECT
      b.id,
      b.name,
      b.slug,
      b.description,
      b.image_url,
      b.status,
      b.created_at,
      b.updated_at
     FROM brands b
     WHERE b.deleted_at IS NULL
     ORDER BY b.name ASC`
  );
  return result.rows;
}

async function getBrandById(brandId) {
  const result = await db.query(
    `SELECT
      b.id,
      b.name,
      b.slug,
      b.description,
      b.image_url,
      b.status,
      b.created_at,
      b.updated_at
     FROM brands b
     WHERE b.id = $1 AND b.deleted_at IS NULL`,
    [brandId]
  );
  return result.rows[0] || null;
}

async function createBrand(data) {
  const { name, slug, description, image_url, status } = data;
  const result = await db.query(
    `INSERT INTO brands (name, slug, description, image_url, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, slug, description || null, image_url || null, status || 'active']
  );
  return result.rows[0];
}

async function updateBrand(brandId, data) {
  const existing = await db.query(
    'SELECT id FROM brands WHERE id = $1 AND deleted_at IS NULL',
    [brandId]
  );
  if (!existing.rows.length) return null;

  const { name, slug, description, image_url, status } = data;
  const result = await db.query(
    `UPDATE brands
     SET name = COALESCE($1, name),
         slug = COALESCE($2, slug),
         description = COALESCE($3, description),
         image_url = COALESCE($4, image_url),
         status = COALESCE($5, status),
         updated_at = NOW()
     WHERE id = $6 AND deleted_at IS NULL
     RETURNING *`,
    [name, slug, description, image_url, status, brandId]
  );
  return result.rows[0] || null;
}

async function deleteBrand(brandId) {
  const result = await db.query(
    `UPDATE brands SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
    [brandId]
  );
  return result.rows.length > 0;
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  listSkus,
  getSkuById,
  createSku,
  updateSku,
  deleteSku,
  listProductImages,
  addProductImage,
  deleteProductImage,
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  listProductsByCategory,
  listBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
};
