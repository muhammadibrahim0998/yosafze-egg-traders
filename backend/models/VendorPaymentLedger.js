import { BaseModel } from './dbHelper.js';

class VendorPaymentLedgerModel extends BaseModel {
  constructor() {
    super('vendor_payment_ledger', 'id');
  }

  _parseRow(row) {
    const obj = super._parseRow(row);
    if (!obj) return null;
    obj.totalCost = Number(obj.totalCost) || 0;
    obj.amountPaid = Number(obj.amountPaid) || 0;
    obj.cashPaid = Number(obj.cashPaid) || 0;
    obj.bankPaid = Number(obj.bankPaid) || 0;
    obj.dueAmount = Number(obj.dueAmount) || 0;
    obj.petisPurchased = Number(obj.petisPurchased) || 0;
    obj.eggQuantity = Number(obj.eggQuantity) || 0;
    obj.buyCost = Number(obj.buyCost) || 0;
    return obj;
  }
}

const VendorPaymentLedger = new VendorPaymentLedgerModel();
export default VendorPaymentLedger;
