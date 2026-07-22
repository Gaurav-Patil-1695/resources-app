const express = require('express');
const router = express.Router();
const catalogueController = require('./catalogue.controller');
const { validateBody, validateParams } = require('./catalogue.validator');
const {
  createProductSchema,
  updateProductSchema,
  createSkuSchema,
  updateSkuSchema,
  createCategorySchema,
  updateCategorySchema,
  createBrandSchema,
  updateBrandSchema,
  productIdParamSchema,
  skuIdParamSchema,
  categoryIdParamSchema,
  brandIdParamSchema,
  imageIdParamSchema,
} = require('./catalogue.validator');

// ─── Products ────────────────────────────────────────────────────────────────
router.get('/products', catalogueController.listProducts);
router.post('/products', validateBody(createProductSchema), catalogueController.createProduct);

router.get('/products/:productId', validateParams(productIdParamSchema), catalogueController.getProduct);
router.put('/products/:productId', validateParams(productIdParamSchema), validateBody(updateProductSchema), catalogueController.updateProduct);
router.delete('/products/:productId', validateParams(productIdParamSchema), catalogueController.deleteProduct);

// ─── SKUs ─────────────────────────────────────────────────────────────────────
router.get('/products/:productId/skus', validateParams(productIdParamSchema), catalogueController.listSkus);
router.post('/products/:productId/skus', validateParams(productIdParamSchema), validateBody(createSkuSchema), catalogueController.createSku);

router.get('/products/:productId/skus/:skuId', validateParams(skuIdParamSchema), catalogueController.getSku);
router.put('/products/:productId/skus/:skuId', validateParams(skuIdParamSchema), validateBody(updateSkuSchema), catalogueController.updateSku);
router.delete('/products/:productId/skus/:skuId', validateParams(skuIdParamSchema), catalogueController.deleteSku);

// ─── Images ───────────────────────────────────────────────────────────────────
router.get('/products/:productId/images', validateParams(productIdParamSchema), catalogueController.listProductImages);
router.post('/products/:productId/images', validateParams(productIdParamSchema), catalogueController.addProductImage);
router.delete('/products/:productId/images/:imageId', validateParams(imageIdParamSchema), catalogueController.deleteProductImage);

// ─── Categories ───────────────────────────────────────────────────────────────
router.get('/categories', catalogueController.listCategories);
router.post('/categories', validateBody(createCategorySchema), catalogueController.createCategory);

router.get('/categories/:categoryId', validateParams(categoryIdParamSchema), catalogueController.getCategory);
router.put('/categories/:categoryId', validateParams(categoryIdParamSchema), validateBody(updateCategorySchema), catalogueController.updateCategory);
router.delete('/categories/:categoryId', validateParams(categoryIdParamSchema), catalogueController.deleteCategory);

router.get('/categories/:categoryId/products', validateParams(categoryIdParamSchema), catalogueController.listProductsByCategory);

// ─── Brands ───────────────────────────────────────────────────────────────────
router.get('/brands', catalogueController.listBrands);
router.post('/brands', validateBody(createBrandSchema), catalogueController.createBrand);

router.get('/brands/:brandId', validateParams(brandIdParamSchema), catalogueController.getBrand);
router.put('/brands/:brandId', validateParams(brandIdParamSchema), validateBody(updateBrandSchema), catalogueController.updateBrand);
router.delete('/brands/:brandId', validateParams(brandIdParamSchema), catalogueController.deleteBrand);

module.exports = router;
