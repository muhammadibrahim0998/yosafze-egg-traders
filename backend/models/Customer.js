import { BaseModel } from './dbHelper.js';
import pool from '../config/mysql.js';
import bcrypt from 'bcryptjs';

class CustomerModel extends BaseModel {
  constructor() {
    super('customers', 'id');
  }

  async _attachCart(customer) {
    if (!customer) return null;
    const [cartRows] = await pool.query(
      'SELECT id, itemId, name, unit, price, image, quantity FROM customer_cart_items WHERE customerId = ?',
      [customer.id]
    );
    customer.cart = cartRows.map(r => ({
      ...r,
      _id: r.id,
      itemId: r.itemId,
      price: Number(r.price) || 0,
      quantity: Number(r.quantity) || 1
    }));
    return customer;
  }

  _parseRow(row) {
    const obj = super._parseRow(row);
    if (!obj) return null;

    obj.comparePassword = async function(candidatePassword) {
      if (!this.password || !candidatePassword) return false;
      return await bcrypt.compare(candidatePassword, this.password);
    };

    return obj;
  }

  find(query = {}) {
    const queryObj = super.find(query);
    const originalThen = queryObj.then;
    queryObj.then = async (resolve, reject) => {
      try {
        const customers = await new Promise((res, rej) => originalThen(res, rej));
        const withCarts = await Promise.all(customers.map(c => this._attachCart(c)));
        resolve(withCarts);
      } catch (err) {
        reject(err);
      }
    };
    return queryObj;
  }

  findOne(query = {}) {
    const queryObj = super.findOne(query);
    const originalThen = queryObj.then;
    queryObj.then = async (resolve, reject) => {
      try {
        const customer = await new Promise((res, rej) => originalThen(res, rej));
        if (customer) await this._attachCart(customer);
        resolve(customer);
      } catch (err) {
        reject(err);
      }
    };
    return queryObj;
  }

  findById(id) {
    const queryObj = super.findById(id);
    const originalThen = queryObj.then;
    queryObj.then = async (resolve, reject) => {
      try {
        const customer = await new Promise((res, rej) => originalThen(res, rej));
        if (customer) await this._attachCart(customer);
        resolve(customer);
      } catch (err) {
        reject(err);
      }
    };
    return queryObj;
  }

  async create(customerData) {
    const data = { ...customerData };
    if (data.password && !data.password.startsWith('$2')) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const cart = data.cart;
    delete data.cart;

    const newCustomer = await super.create(data);

    if (Array.isArray(cart) && cart.length > 0 && newCustomer?.id) {
      for (const item of cart) {
        await pool.query(
          'INSERT INTO customer_cart_items (customerId, itemId, name, unit, price, image, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [newCustomer.id, item.itemId || item._id, item.name, item.unit || 'egg', item.price || 0, item.image || '', item.quantity || 1]
        );
      }
    }
    return await this.findById(newCustomer.id);
  }

  async findByIdAndUpdate(id, updateData, options = {}) {
    const raw = updateData.$set || updateData;
    const data = { ...raw };
    if (data.password && !data.password.startsWith('$2')) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const cart = data.cart;
    delete data.cart;

    await super.findByIdAndUpdate(id, data, options);

    if (Array.isArray(cart)) {
      await pool.query('DELETE FROM customer_cart_items WHERE customerId = ?', [id]);
      for (const item of cart) {
        await pool.query(
          'INSERT INTO customer_cart_items (customerId, itemId, name, unit, price, image, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [id, item.itemId || item._id, item.name, item.unit || 'egg', item.price || 0, item.image || '', item.quantity || 1]
        );
      }
    }

    return await this.findById(id);
  }
}

const Customer = new CustomerModel();
export default Customer;
