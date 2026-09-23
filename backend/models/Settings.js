import { BaseModel } from './dbHelper.js';

class SettingsModel extends BaseModel {
  constructor() {
    super('settings', 'id');
  }

  _parseRow(row) {
    const obj = super._parseRow(row);
    if (!obj) return null;
    obj.taxRate = Number(obj.taxRate) || 0;
    return obj;
  }
}

const Settings = new SettingsModel();
export default Settings;
