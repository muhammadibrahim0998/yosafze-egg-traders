import { BaseModel } from './dbHelper.js';
import pool from '../config/mysql.js';

class OrderModel extends BaseModel {
  constructor() {
    super('orders', 'id');
  }

  async _attachOrderItems(order) {
    if (!order) return null;
    const [items] = await pool.query(
      'SELECT id, itemId, name, price, quantity, image FROM order_items WHERE orderId = ?',
      [order.id]
    );
    order.items = items.map(it => ({
      ...it,
      _id: it.id,
      price: Number(it.price) || 0,
      quantity: Number(it.quantity) || 1
    }));
    order.shippingDetails = {
      fullName: order.shippingFullName || '',
      phone: order.shippingPhone || '',
      address: order.shippingAddress || '',
      city: order.shippingCity || ''
    };
    order.totalAmount = Number(order.totalAmount) || 0;
    return order;
  }

  find(query = {}) {
    const queryObj = super.find(query);
    const originalThen = queryObj.then;
    queryObj.then = async (resolve, reject) => {
      try {
        const orders = await new Promise((res, rej) => originalThen(res, rej));
        const withItems = await Promise.all(orders.map(o => this._attachOrderItems(o)));
        resolve(withItems);
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
        const order = await new Promise((res, rej) => originalThen(res, rej));
        if (order) await this._attachOrderItems(order);
        resolve(order);
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
        const order = await new Promise((res, rej) => originalThen(res, rej));
        if (order) await this._attachOrderItems(order);
        resolve(order);
      } catch (err) {
        reject(err);
      }
    };
    return queryObj;
  }

  async create(orderData) {
    const data = { ...orderData };
    if (data.shippingDetails) {
      data.shippingFullName = data.shippingDetails.fullName || data.shippingFullName || '';
      data.shippingPhone = data.shippingDetails.phone || data.shippingPhone || '';
      data.shippingAddress = data.shippingDetails.address || data.shippingAddress || '';
      data.shippingCity = data.shippingDetails.city || data.shippingCity || '';
      delete data.shippingDetails;
    }
    const items = data.items;
    delete data.items;

    const newOrder = await super.create(data);

    if (Array.isArray(items) && items.length > 0 && newOrder?.id) {
      for (const item of items) {
        await pool.query(
          'INSERT INTO order_items (orderId, itemId, name, price, quantity, image) VALUES (?, ?, ?, ?, ?, ?)',
          [newOrder.id, item.itemId || item._id || null, item.name || '', item.price || 0, item.quantity || 1, item.image || '']
        );
      }
    }
    return await this.findById(newOrder.id);
  }

  async findByIdAndUpdate(id, updateData, options = {}) {
    const raw = updateData.$set || updateData;
    const data = { ...raw };
    if (data.shippingDetails) {
      data.shippingFullName = data.shippingDetails.fullName || data.shippingFullName || '';
      data.shippingPhone = data.shippingDetails.phone || data.shippingPhone || '';
      data.shippingAddress = data.shippingDetails.address || data.shippingAddress || '';
      data.shippingCity = data.shippingDetails.city || data.shippingCity || '';
      delete data.shippingDetails;
    }
    const items = data.items;
    delete data.items;

    await super.findByIdAndUpdate(id, data, options);

    if (Array.isArray(items)) {
      await pool.query('DELETE FROM order_items WHERE orderId = ?', [id]);
      for (const item of items) {
        await pool.query(
          'INSERT INTO order_items (orderId, itemId, name, price, quantity, image) VALUES (?, ?, ?, ?, ?, ?)',
          [id, item.itemId || item._id || null, item.name || '', item.price || 0, item.quantity || 1, item.image || '']
        );
      }
    }

    return await this.findById(id);
  }
}

const Order = new OrderModel();
export default Order;
