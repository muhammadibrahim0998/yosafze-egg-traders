import express from 'express';
import Customer from '../models/Customer.js';
import Item from '../models/Item.js';
import User from '../models/User.js';

const router = express.Router();

// ─── Middleware: Verify customer session via token ───────────────────────────
const authenticateCustomer = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  const customerId = authHeader.split(' ')[1];
  try {
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(401).json({ message: 'Invalid session' });
    req.customer = customer;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid session' });
  }
};

// ─── GET ALL CUSTOMERS (FOR ADMIN DASHBOARD) ──────────────────────────────────
router.get('/all', async (req, res) => {
  try {
    const { shopId } = req.query;
    const filter = shopId ? { shopId } : {};
    const customers = await Customer.find(filter).select('-password');
    res.json({ success: true, count: customers.length, customers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── REGISTER ────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, shopId } = req.body;
    if (!fullName || !email || !password || !shopId) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existing = await Customer.findOne({ email, shopId });
    if (existing) return res.status(409).json({ message: 'Email already registered for this shop' });

    const customer = new Customer({ fullName, email, password, shopId });
    await customer.save();

    res.status(201).json({
      success: true,
      message: 'Registered successfully',
      customerId: customer._id,
      fullName: customer.fullName,
      email: customer.email
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password, shopId } = req.body;
    if (!email || !password || !shopId) {
      return res.status(400).json({ message: 'Email, password, and shopId are required' });
    }
    
    // 1. Try Customer Login
    const customer = await Customer.findOne({ email, shopId });
    if (customer && (await customer.comparePassword(password))) {
      return res.json({
        success: true,
        customerId: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        cart: customer.cart,
        role: 'customer'
      });
    }

    // 2. Try User (Shop Admin) Login as fallback
    // Some shop admins use the Customer Storefront and expect to login there.
    const user = await User.findOne({ $or: [{ email: email }, { username: email }] });
    if (user && (await user.comparePassword(password))) {
      // Create a JWT token for the user so they can act as an admin!
      const jwt = (await import('jsonwebtoken')).default;
      const token = jwt.sign(
        { id: user._id, role: user.role, shopId: user.shopId },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '1d' }
      );

      return res.json({
        success: true,
        customerId: user._id, // map _id to customerId so frontend context doesn't break
        fullName: user.fullName,
        email: user.email || user.username,
        cart: [],
        role: user.role,
        token: token
      });
    }

    // If neither matches
    return res.status(401).json({ message: 'Invalid email/username or password' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET CART ─────────────────────────────────────────────────────────────────
router.get('/cart', authenticateCustomer, (req, res) => {
  res.json({ cart: req.customer.cart });
});

// ─── ADD TO CART ──────────────────────────────────────────────────────────────
router.post('/cart', authenticateCustomer, async (req, res) => {
  try {
    const { itemId, quantity = 1 } = req.body;
    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Product not found' });
    if (item.stock < quantity) return res.status(400).json({ message: 'Not enough stock' });

    const customer = req.customer;
    const existing = customer.cart.find(c => c.itemId.toString() === itemId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      customer.cart.push({
        itemId: item._id,
        name: item.name,
        price: item.price,
        image: item.images?.[0] || '',
        quantity
      });
    }
    await customer.save();
    res.json({ success: true, cart: customer.cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── UPDATE CART ITEM QTY ─────────────────────────────────────────────────────
router.put('/cart/:itemId', authenticateCustomer, async (req, res) => {
  try {
    const { quantity } = req.body;
    const customer = req.customer;
    const cartItem = customer.cart.find(c => c.itemId.toString() === req.params.itemId);
    if (!cartItem) return res.status(404).json({ message: 'Item not in cart' });
    if (quantity <= 0) {
      customer.cart = customer.cart.filter(c => c.itemId.toString() !== req.params.itemId);
    } else {
      cartItem.quantity = quantity;
    }
    await customer.save();
    res.json({ success: true, cart: customer.cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── REMOVE FROM CART ────────────────────────────────────────────────────────
router.delete('/cart/:itemId', authenticateCustomer, async (req, res) => {
  try {
    const customer = req.customer;
    customer.cart = customer.cart.filter(c => c.itemId.toString() !== req.params.itemId);
    await customer.save();
    res.json({ success: true, cart: customer.cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── CLEAR CART ───────────────────────────────────────────────────────────────
router.delete('/cart', authenticateCustomer, async (req, res) => {
  try {
    req.customer.cart = [];
    await req.customer.save();
    res.json({ success: true, cart: [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
