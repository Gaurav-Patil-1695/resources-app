const express = require('express');
const router = express.Router();
const addressesController = require('./addresses.controller');
const { validateCreateAddress, validateUpdateAddress } = require('./addresses.validator');
const authenticate = require('../../middleware/authenticate');

router.use(authenticate);

router.get('/', addressesController.getAddresses);
router.post('/', validateCreateAddress, addressesController.createAddress);
router.get('/:addressId', addressesController.getAddress);
router.put('/:addressId', validateUpdateAddress, addressesController.updateAddress);
router.delete('/:addressId', addressesController.deleteAddress);

module.exports = router;
