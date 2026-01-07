// controllers/address.controller.js
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Get all addresses for the logged-in user
export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('addresses');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      addresses: user.addresses || []
    });
  } catch (error) {
    logger.error('Get addresses error', { error: error.message, userId: req.user.id });
    res.status(500).json({ message: 'Failed to fetch addresses' });
  }
};

// Add a new address
export const addAddress = async (req, res) => {
  try {
    const { label, street, city, state, postalCode, country, phone, isDefault } = req.body;

    if (!street || !city || !postalCode || !country || !phone) {
      return res.status(400).json({ 
        message: 'Missing required fields: street, city, postalCode, country, phone' 
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If this address is set as default, unset all other defaults
    if (isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // If this is the first address, make it default
    const newAddress = {
      label: label || 'Home',
      street,
      city,
      state: state || '',
      postalCode,
      country,
      phone,
      isDefault: isDefault || (user.addresses.length === 0)
    };

    user.addresses.push(newAddress);
    await user.save();

    const savedAddress = user.addresses[user.addresses.length - 1];

    res.status(201).json({
      message: 'Address added successfully',
      address: savedAddress
    });
  } catch (error) {
    logger.error('Add address error', { error: error.message, userId: req.user.id });
    res.status(500).json({ message: 'Failed to add address' });
  }
};

// Update an existing address
export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, street, city, state, postalCode, country, phone, isDefault } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const address = user.addresses.id(id);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Update fields
    if (label !== undefined) address.label = label;
    if (street !== undefined) address.street = street;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (postalCode !== undefined) address.postalCode = postalCode;
    if (country !== undefined) address.country = country;
    if (phone !== undefined) address.phone = phone;

    // If setting as default, unset all other defaults
    if (isDefault === true) {
      user.addresses.forEach(addr => {
        if (addr._id.toString() !== id) {
          addr.isDefault = false;
        }
      });
      address.isDefault = true;
    } else if (isDefault === false) {
      address.isDefault = false;
    }

    await user.save();

    res.json({
      message: 'Address updated successfully',
      address
    });
  } catch (error) {
    logger.error('Update address error', { error: error.message, userId: req.user.id, addressId: id });
    res.status(500).json({ message: 'Failed to update address' });
  }
};

// Delete an address
export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const address = user.addresses.id(id);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const wasDefault = address.isDefault;
    
    // Remove the address
    user.addresses.pull(id);

    // If the deleted address was default, make the first remaining address default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({
      message: 'Address deleted successfully'
    });
  } catch (error) {
    logger.error('Delete address error', { error: error.message, userId: req.user.id, addressId: id });
    res.status(500).json({ message: 'Failed to delete address' });
  }
};

// Set default address
export const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const address = user.addresses.id(id);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Unset all other defaults
    user.addresses.forEach(addr => {
      addr.isDefault = addr._id.toString() === id;
    });

    await user.save();

    res.json({
      message: 'Default address updated successfully',
      address
    });
  } catch (error) {
    logger.error('Set default address error', { error: error.message, userId: req.user.id, addressId: id });
    res.status(500).json({ message: 'Failed to set default address' });
  }
};

