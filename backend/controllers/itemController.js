import Item from '../models/Item.js';
import { logSystemUpdate } from '../utils/updateHelper.js';

// @desc    Get all items
const getItems = async (req, res) => {
  try {
    const filter = (req.user?.role === 'super_admin' || !req.user?.shopId) ? {} : { shopId: req.user.shopId };
    const items = await Item.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single item
const getItem = async (req, res) => {
  try {
    const filter = req.user?.role === 'super_admin' ? { _id: req.params.id } : { _id: req.params.id, shopId: req.user.shopId };
    const item = await Item.findOne(filter);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new item
const createItem = async (req, res) => {
  try {
    // Use shopId from user token; fallback to body shopId (for ShopAdmin via customer portal)
    const shopId = req.user?.shopId || req.body.shopId;
    if (!shopId) {
      return res.status(400).json({ message: 'shopId is required to add a product' });
    }
    const finalImages = (req.body.images && req.body.images.length > 0) ? req.body.images : ['/egg2.png'];
    const newItemData = { ...req.body, images: finalImages, shopId };
    const newItem = await Item.create(newItemData);
    
    // Log system update for new product
    await logSystemUpdate(
      "New Features", 
      "zap", 
      `New Product deployed: ${newItem.name} (${newItem.category})`
    );

    // Check if this is a new category for the shop (optional but requested)
    const categoryCount = await Item.countDocuments({ 
      shopId, 
      category: newItem.category 
    });
    
    if (categoryCount === 1) {
      await logSystemUpdate(
        "UI Improvements", 
        "sparkles", 
        `New Category established: ${newItem.category}`
      );
    }

    res.status(201).json(newItem);
  } catch (error) {
    console.error('[createItem error]', error.message);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update item
const updateItem = async (req, res) => {
  try {
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedItem) return res.status(404).json({ message: 'Item not found' });
    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete item
const deleteItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem
};
