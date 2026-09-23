import { BaseModel } from './dbHelper.js';
import pool from '../config/mysql.js';

class SaleModel extends BaseModel {
  constructor() {
    super('sales', 'id');
  }

  async _attachSaleItems(sale) {
    if (!sale) return null;
    const [items] = await pool.query(
      'SELECT id, productId, name, quantity, price, costPrice, subtotal, profit FROM sale_items WHERE saleId = ?',
      [sale.id]
    );
    sale.items = items.map(it => ({
      ...it,
      _id: it.id,
      productId: it.productId,
      quantity: Number(it.quantity) || 1,
      price: Number(it.price) || 0,
      costPrice: Number(it.costPrice) || 0,
      subtotal: Number(it.subtotal) || 0,
      profit: Number(it.profit) || 0
    }));

    sale.totalAmount = Number(sale.totalAmount) || 0;
    sale.totalProfit = Number(sale.totalProfit) || 0;
    sale.cashPaid = Number(sale.cashPaid) || 0;
    sale.bankPaid = Number(sale.bankPaid) || 0;
    sale.dueAmount = Number(sale.dueAmount) || 0;
    return sale;
  }

  find(query = {}) {
    const queryObj = super.find(query);
    const originalThen = queryObj.then;
    queryObj.then = async (resolve, reject) => {
      try {
        const sales = await new Promise((res, rej) => originalThen(res, rej));
        const withItems = await Promise.all(sales.map(s => this._attachSaleItems(s)));
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
        const sale = await new Promise((res, rej) => originalThen(res, rej));
        if (sale) await this._attachSaleItems(sale);
        resolve(sale);
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
        const sale = await new Promise((res, rej) => originalThen(res, rej));
        if (sale) await this._attachSaleItems(sale);
        resolve(sale);
      } catch (err) {
        reject(err);
      }
    };
    return queryObj;
  }

  async create(saleData) {
    const data = { ...saleData };
    const items = data.items;
    delete data.items;

    const newSale = await super.create(data);

    if (Array.isArray(items) && items.length > 0 && newSale?.id) {
      for (const item of items) {
        await pool.query(
          'INSERT INTO sale_items (saleId, productId, name, quantity, price, costPrice, subtotal, profit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            newSale.id,
            item.productId || item._id || null,
            item.name || '',
            item.quantity || 1,
            item.price || 0,
            item.costPrice || 0,
            item.subtotal || ((item.price || 0) * (item.quantity || 1)),
            item.profit || 0
          ]
        );
      }
    }
    return await this.findById(newSale.id);
  }

  async findByIdAndUpdate(id, updateData, options = {}) {
    const raw = updateData.$set || updateData;
    const data = { ...raw };
    const items = data.items;
    delete data.items;

    await super.findByIdAndUpdate(id, data, options);

    if (Array.isArray(items)) {
      await pool.query('DELETE FROM sale_items WHERE saleId = ?', [id]);
      for (const item of items) {
        await pool.query(
          'INSERT INTO sale_items (saleId, productId, name, quantity, price, costPrice, subtotal, profit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            id,
            item.productId || item._id || null,
            item.name || '',
            item.quantity || 1,
            item.price || 0,
            item.costPrice || 0,
            item.subtotal || ((item.price || 0) * (item.quantity || 1)),
            item.profit || 0
          ]
        );
      }
    }

    return await this.findById(id);
  }
}

const Sale = new SaleModel();
export default Sale;
