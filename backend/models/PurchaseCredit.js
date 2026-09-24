import { BaseModel } from './dbHelper.js';

class PurchaseCreditModel extends BaseModel {
  constructor() {
    super('purchase_credits', 'id');
  }

  _parseRow(row) {
    const obj = super._parseRow(row);
    if (!obj) return null;
    obj.totalCost = Number(obj.totalCost) || 0;
    obj.paidToDate = Number(obj.paidToDate) || 0;
    obj.pendingDue = Number(obj.pendingDue) || 0;
    return obj;
  }
}

const PurchaseCredit = new PurchaseCreditModel();
export default PurchaseCredit;
