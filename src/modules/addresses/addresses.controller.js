const addressesService = require('./addresses.service');

const getAddresses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addresses = await addressesService.getAddressesByUserId(userId);
    return res.status(200).json({ success: true, data: addresses });
  } catch (err) {
    next(err);
  }
};

const getAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const address = await addressesService.getAddressById(userId, addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }
    return res.status(200).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
};

const createAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const payload = req.body;
    const address = await addressesService.createAddress(userId, payload);
    return res.status(201).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const payload = req.body;
    const address = await addressesService.updateAddress(userId, addressId, payload);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }
    return res.status(200).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const result = await addressesService.deleteAddress(userId, addressId);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }
    return res.status(200).json({ success: true, message: 'Address deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
};
