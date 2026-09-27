import express from 'express';
import pool from '../config/mysql.js';
import { authenticate, requireShopAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/vendors/:shopId -> restricted authenticated read endpoint for cashiers
// Returns only id and name. Enforces shop isolation.
router.get('/:shopId', authenticate, async (req, res) => {
  try {
    const shopId = req.user.shopId; // Force isolated shopId
    const [rows] = await pool.query('SELECT id, name FROM vendors WHERE shopId = ? ORDER BY name ASC', [shopId]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching vendors' });
  }
});

// GET /api/vendors/:shopId/full -> for Shop Admin management page
router.get('/:shopId/full', authenticate, requireShopAdmin, async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const [rows] = await pool.query('SELECT * FROM vendors WHERE shopId = ? ORDER BY name ASC', [shopId]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching vendors' });
  }
});

// Add a new vendor
router.post('/', authenticate, requireShopAdmin, async (req, res) => {
  try {
    const shopId = req.user.shopId; // Force isolated shopId
    const { name, phone, location } = req.body;
    
    // Server-side validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: 'Valid vendor name is required' });
    }
    const cleanName = name.trim().substring(0, 100);
    const cleanPhone = phone ? phone.toString().trim().substring(0, 20) : '';
    const cleanLocation = location ? location.toString().trim().substring(0, 255) : '';
    
    // Check for duplicates
    const [existing] = await pool.query('SELECT id FROM vendors WHERE shopId = ? AND name = ?', [shopId, cleanName]);
    if (existing.length > 0) return res.status(409).json({ message: 'Vendor with this name already exists' });
    
    const [result] = await pool.query(
      'INSERT INTO vendors (shopId, name, phone, location) VALUES (?, ?, ?, ?)',
      [shopId, cleanName, cleanPhone, cleanLocation]
    );
    
    const [newVendor] = await pool.query('SELECT * FROM vendors WHERE id = ?', [result.insertId]);
    res.status(201).json(newVendor[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding vendor' });
  }
});

// Update a vendor
router.put('/:id', authenticate, requireShopAdmin, async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { id } = req.params;
    const { name, phone, location } = req.body;
    
    // Verify ownership
    const [existing] = await pool.query('SELECT id FROM vendors WHERE id = ? AND shopId = ?', [id, shopId]);
    if (existing.length === 0) return res.status(404).json({ message: 'Vendor not found or unauthorized' });

    const cleanName = name ? name.trim().substring(0, 100) : '';
    const cleanPhone = phone ? phone.toString().trim().substring(0, 20) : '';
    const cleanLocation = location ? location.toString().trim().substring(0, 255) : '';
    
    await pool.query(
      'UPDATE vendors SET name = ?, phone = ?, location = ? WHERE id = ? AND shopId = ?',
      [cleanName, cleanPhone, cleanLocation, id, shopId]
    );
    
    res.json({ message: 'Vendor updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating vendor' });
  }
});

// Delete a vendor (archive/disable simulation via deletion here, or hard delete if allowed)
router.delete('/:id', authenticate, requireShopAdmin, async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { id } = req.params;
    
    // Verify ownership
    const [existing] = await pool.query('SELECT id FROM vendors WHERE id = ? AND shopId = ?', [id, shopId]);
    if (existing.length === 0) return res.status(404).json({ message: 'Vendor not found or unauthorized' });

    // Since we don't have an active flag yet, we'll hard delete as before, but secured
    await pool.query('DELETE FROM vendors WHERE id = ? AND shopId = ?', [id, shopId]);
    res.json({ message: 'Vendor removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting vendor' });
  }
});

export default router;
