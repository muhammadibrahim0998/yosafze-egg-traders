import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
  },
  minStock: {
    type: Number,
    required: true,
    default: 0,
  },
  price: { 
    type: Number, 
    required: true 
  },
  costPrice: { 
    type: Number, 
    default: 0 
  },
  pricePerPeti: {
    type: Number,
    default: 0
  },
  pricePerTray: {
    type: Number,
    default: 0
  },
  pricePerEgg: {
    type: Number,
    default: 0
  },
  images: { 
    type: [String], 
    default: [] 
  },
  description: { 
    type: String, 
    default: '' 
  },
  mfgDate: {
    type: Date
  },
  expiryDate: {
    type: Date
  },
  // Egg Trading Units & Packaging Ratios
  unitType: {
    type: String,
    enum: ['peti', 'tray', 'egg'],
    default: 'peti'
  },
  traysPerPeti: {
    type: Number,
    default: 12
  },
  eggsPerTray: {
    type: Number,
    default: 30
  },
  petiQuantity: {
    type: Number,
    default: 0
  },
  trayQuantity: {
    type: Number,
    default: 0
  },
  eggQuantity: {
    type: Number,
    default: 0
  },
  // Supplier & Purchase Payment Details
  supplierName: {
    type: String,
    default: ''
  },
  supplierPhone: {
    type: String,
    default: ''
  },
  supplierLocation: {
    type: String,
    default: ''
  },
  totalPurchaseCost: {
    type: Number,
    default: 0
  },
  amountPaidToSupplier: {
    type: Number,
    default: 0
  },
  cashPaidToSupplier: {
    type: Number,
    default: 0
  },
  bankPaidToSupplier: {
    type: Number,
    default: 0
  },
  dueAmountToSupplier: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    default: 'Cash'
  },
  paymentReceipt: {
    type: String,
    default: ''
  },
  isOnlinePayment: {
    type: Boolean,
    default: false
  },
  lastUpdated: { 
    type: String, 
    default: () => new Date().toISOString().split('T')[0]
  }
}, { timestamps: true });

// Compound indexes for optimal performance and branch isolation
itemSchema.index({ shopId: 1, category: 1 });
itemSchema.index({ shopId: 1, name: 1 });
itemSchema.index({ shopId: 1, createdAt: -1 });

/**
 * Dynamic Branch Collection Resolver
 * Dynamically returns a Mongoose Model targeting the branch's dedicated collection: `branch_products_<cleanShopId>`
 */
export const getBranchItemModel = (shopId) => {
  if (!shopId) {
    return mongoose.models.Item || mongoose.model('Item', itemSchema);
  }
  const cleanId = String(shopId).replace(/[^a-zA-Z0-9]/g, '_');
  const modelName = `BranchItem_${cleanId}`;
  const collectionName = `branch_products_${cleanId}`;

  if (mongoose.models[modelName]) {
    return mongoose.models[modelName];
  }
  return mongoose.model(modelName, itemSchema, collectionName);
};

/**
 * Helper to sync/replicate branch products between Item and dedicated branch collection
 */
export const syncBranchProducts = async (shopId) => {
  try {
    if (!shopId) return;
    const BranchModel = getBranchItemModel(shopId);
    const mainItems = await mongoose.model('Item').find({ shopId });
    
    for (const item of mainItems) {
      const itemObj = item.toObject();
      await BranchModel.findByIdAndUpdate(item._id, itemObj, { upsert: true, new: true, setDefaultsOnInsert: true });
    }
  } catch (err) {
    console.error(`[syncBranchProducts error for shop ${shopId}]:`, err.message);
  }
};

const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);
export default Item;

