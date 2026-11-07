import { BaseModel } from './dbHelper.js';

class SaleProductHistoryModel extends BaseModel {
  constructor() {
    super('sale_product_history', 'id');
  }

  _parseRow(row) {
    const obj = super._parseRow(row);
    if (!obj) return null;
    obj.petisSold = Number(obj.petisSold) || 0;
    obj.eggsSold = Number(obj.eggsSold) || 0;
    obj.sellingRate = Number(obj.sellingRate) || 0;
    obj.totalAmount = Number(obj.totalAmount) || 0;
    obj.cashPaid = Number(obj.cashPaid) || 0;
    obj.bankPaid = Number(obj.bankPaid) || 0;
    obj.dueAmount = Number(obj.dueAmount) || 0;
    return obj;
  }
}

const SaleProductHistory = new SaleProductHistoryModel();
export default SaleProductHistory;

