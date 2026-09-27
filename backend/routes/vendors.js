import express from 'express';
import pool from '../config/mysql.js';

const router = express.Router();

// Get all vendors for a shop
router.get('/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    const [rows] = await pool.query('SELECT * FROM vendors WHERE shopId = ? ORDER BY name ASC', [shopId]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching vendors' });
  }
});

// Add a new vendor
router.post('/', async (req, res) => {
  try {
    const { shopId, name, phone, location } = req.body;
    if (!name || !shopId) return res.status(400).json({ message: 'Name and shopId are required' });
    
    const [result] = await pool.query(
      'INSERT INTO vendors (shopId, name, phone, location) VALUES (?, ?, ?, ?)',
      [shopId, name, phone || '', location || '']
    );
    
    const [newVendor] = await pool.query('SELECT * FROM vendors WHERE id = ?', [result.insertId]);
    res.status(201).json(newVendor[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding vendor' });
  }
});

// Delete a vendor
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM vendors WHERE id = ?', [id]);
    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting vendor' });
  }
});

export default router;
