'use strict';

const db = require('../knex');

const PRODUCTS_TABLE = 'products';
const IMAGES_TABLE = 'product_images';

// ---- products ----

const findById = (id) =>
  db(PRODUCTS_TABLE).where({ id }).first();

const findBySlug = (slug) =>
  db(PRODUCTS_TABLE).where({ slug }).first();

const findAll = ({ limit = 20, offset = 0, is_active } = {}) => {
  const q = db(PRODUCTS_TABLE).limit(limit).offset(offset);
  if (is_active !== undefined) q.where({ is_active });
  return q;
};

const findByCategory = (category_id, { limit = 20, offset = 0 } = {}) =>
  db(PRODUCTS_TABLE).where({ category_id, is_active: true }).limit(limit).offset(offset);

const findByCategoryIds = (categoryIds, { limit = 20, offset = 0 } = {}) =>
  db(PRODUCTS_TABLE)
    .whereIn('category_id', categoryIds)
    .where({ is_active: true })
    .limit(limit)
    .offset(offset);

const findByBrand = (brand_id, { limit = 20, offset = 0 } = {}) =>
  db(PRODUCTS_TABLE).where({ brand_id, is_active: true }).limit(limit).offset(offset);

const search = (term, { limit = 20, offset = 0 } = {}) =>
  db(PRODUCTS_TABLE)
    .whereILike('name', `%${term}%`)
    .where({ is_active: true })
    .limit(limit)
    .offset(offset);

const create = async (data) => {
  const [id] = await db(PRODUCTS_TABLE).insert(data);
  return findById(id);
};

const update = async (id, data) => {
  await db(PRODUCTS_TABLE).where({ id }).update(data);
  return findById(id);
};

const remove = (id) =>
  db(PRODUCTS_TABLE).where({ id }).del();

// ---- product_images ----

const findImagesByProduct = (product_id) =>
  db(IMAGES_TABLE).where({ product_id }).orderBy('sort_order', 'asc');

const findImageById = (id) =>
  db(IMAGES_TABLE).where({ id }).first();

const addImage = async (data) => {
  const [id] = await db(IMAGES_TABLE).insert(data);
  return findImageById(id);
};

const removeImage = (id) =>
  db(IMAGES_TABLE).where({ id }).del();

const removeImagesByProduct = (product_id) =>
  db(IMAGES_TABLE).where({ product_id }).del();

const reorderImages = (product_id, orderedIds) => {
  const updates = orderedIds.map((id, index) =>
    db(IMAGES_TABLE).where({ id, product_id }).update({ sort_order: index })
  );
  return Promise.all(updates);
};

module.exports = {
  findById,
  findBySlug,
  findAll,
  findByCategory,
  findByCategoryIds,
  findByBrand,
  search,
  create,
  update,
  remove,
  findImagesByProduct,
  findImageById,
  addImage,
  removeImage,
  removeImagesByProduct,
  reorderImages,
};
