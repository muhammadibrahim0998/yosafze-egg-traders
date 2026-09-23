import { BaseModel } from './dbHelper.js';

class ShopModel extends BaseModel {
  constructor() {
    super('shops', 'id');
  }

  _parseRow(row) {
    const obj = super._parseRow(row);
    if (!obj) return null;

    // Provide nested ownerDetails for backward compatibility with frontend
    obj.ownerDetails = {
      fullName: obj.ownerFullName || '',
      email: obj.ownerEmail || '',
      phone: obj.ownerPhone || ''
    };

    return obj;
  }

  async create(shopData) {
    const data = { ...shopData };
    if (data.ownerDetails) {
      data.ownerFullName = data.ownerDetails.fullName || data.ownerFullName || '';
      data.ownerEmail = data.ownerDetails.email || data.ownerEmail || '';
      data.ownerPhone = data.ownerDetails.phone || data.ownerPhone || '';
      delete data.ownerDetails;
    }
    return super.create(data);
  }

  async findByIdAndUpdate(id, updateData, options = {}) {
    const raw = updateData.$set || updateData;
    const data = { ...raw };
    if (data.ownerDetails) {
      data.ownerFullName = data.ownerDetails.fullName || data.ownerFullName || '';
      data.ownerEmail = data.ownerDetails.email || data.ownerEmail || '';
      data.ownerPhone = data.ownerDetails.phone || data.ownerPhone || '';
      delete data.ownerDetails;
    }
    return super.findByIdAndUpdate(id, data, options);
  }
}

const Shop = new ShopModel();
export default Shop;
