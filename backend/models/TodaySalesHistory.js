import { BaseModel } from './dbHelper.js';

class TodaySalesHistoryModel extends BaseModel {
  constructor() {
    super('today_sales_history', 'id');
  }

  _parseRow(row) {
    const obj = super._parseRow(row);
    if (!obj) return null;
    obj.grossSale = Number(obj.grossSale) || 0;
    obj.cashPaid = Number(obj.cashPaid) || 0;
    obj.bankPaid = Number(obj.bankPaid) || 0;
    obj.dueAmount = Number(obj.dueAmount) || 0;
    obj.shopExpense = Number(obj.shopExpense) || 0;
    obj.fuelExpense = Number(obj.fuelExpense) || 0;
    obj.damagedLoss = Number(obj.damagedLoss) || 0;
    obj.netResult = Number(obj.netResult) || 0;
    obj.cashInDrawer = Number(obj.cashInDrawer) || 0;
    return obj;
  }
}

const TodaySalesHistory = new TodaySalesHistoryModel();
export default TodaySalesHistory;

