import { BaseModel } from './dbHelper.js';

class DamagedProductModel extends BaseModel {
  constructor() {
    super('damaged_products', 'id');
  }

  _parseRow(row) {
    const obj = super._parseRow(row);
    if (!obj) return null;
    obj.quantity = Number(obj.quantity) || 0;
    obj.petiQuantity = Number(obj.petiQuantity) || 0;
    obj.trayQuantity = Number(obj.trayQuantity) || 0;
    obj.eggQuantity = Number(obj.eggQuantity) || 0;
    obj.deductedEggs = Number(obj.deductedEggs) || 0;
    obj.unitPrice = Number(obj.unitPrice) || 0;
    obj.totalLoss = Number(obj.totalLoss) || 0;
    return obj;
  }
}

const DamagedProduct = new DamagedProductModel();
export default DamagedProduct;
