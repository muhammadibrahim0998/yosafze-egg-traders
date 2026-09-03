import mongoose from 'mongoose';

const damagedProductSchema = new mongoose.Schema({
  shopId: { type: String, required: true },
  productName: { type: String, required: true },
  productId: { type: String, default: '' },
  quantity: { type: Number, default: 0 },
  petiQuantity: { type: Number, default: 0 },
  trayQuantity: { type: Number, default: 0 },
  eggQuantity: { type: Number, default: 0 },
  unitType: { type: String, default: 'egg' },
  deductedEggs: { type: Number, default: 0 },
  unitPrice: { type: Number, required: true, default: 0 },
  totalLoss: { type: Number, required: true, default: 0 },
  reason: { 
    type: String, 
    enum: ['Egg Breakage / Crack', 'Spoiled / Expired', 'Transport Damage', 'Storage Loss', 'Other'],
    default: 'Egg Breakage / Crack' 
  },
  damageDate: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
  reportedBy: { type: String, default: 'Shop Admin' }
}, { timestamps: true });

export default mongoose.model('DamagedProduct', damagedProductSchema);
