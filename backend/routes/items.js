import express from 'express';
import { authenticate, requireShopAdmin } from '../middleware/auth.js';
import { validateProduct } from '../validators/productValidator.js';
const router = express.Router();
import {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem
} from '../controllers/itemController.js';

router.route('/')
  .get(authenticate, getItems)
  .post(authenticate, requireShopAdmin, validateProduct, createItem);

router.route('/all')
  .get(authenticate, getItems);

router.route('/:id')
  .get(authenticate, getItem)
  .put(authenticate, requireShopAdmin, validateProduct, updateItem)
  .delete(authenticate, requireShopAdmin, deleteItem);

export default router;
