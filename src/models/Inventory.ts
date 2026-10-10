import mongoose, { Document, Model, Schema } from 'mongoose';

// ───────────────────────── Supplier ─────────────────────────

export interface ISupplier extends Document {
  _id: mongoose.Types.ObjectId;
  supplierId: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  gstNumber?: string;
  paymentTerms?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>({
  supplierId: { type: String, unique: true, index: true },
  name: { type: String, required: true, trim: true, index: true },
  contactPerson: { type: String, required: true, trim: true },
  phone: { type: String, required: true, index: true },
  email: { type: String, lowercase: true, index: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
  },
  gstNumber: { type: String, trim: true },
  paymentTerms: { type: String, default: '30 days' },
  isActive: { type: Boolean, default: true, index: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

SupplierSchema.pre('save', async function () {
  if (this.isNew && !this.supplierId) {
    const count = await mongoose.model('Supplier').countDocuments();
    this.supplierId = `SUP-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;
  }
});

SupplierSchema.statics.searchSuppliers = function (searchTerm: string) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [{ supplierId: regex }, { name: regex }, { contactPerson: regex }],
    isActive: true,
  });
};

interface ISupplierModel extends Model<ISupplier> {
  searchSuppliers(searchTerm: string): Promise<ISupplier[]>;
}

export const Supplier: ISupplierModel = (mongoose.models.Supplier as ISupplierModel) ||
  mongoose.model<ISupplier, ISupplierModel>('Supplier', SupplierSchema);

// ───────────────────────── Inventory Batch ─────────────────────────

export interface IInventoryBatch {
  batchNumber: string;
  quantity: number;
  purchaseDate: Date;
  expiryDate: Date;
  unitCost: number;
  supplierId?: mongoose.Types.ObjectId;
  status: 'ACTIVE' | 'EXPIRED' | 'DEPLETED';
}

const InventoryBatchSchema = new Schema<IInventoryBatch>({
  batchNumber: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  purchaseDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true, index: true },
  unitCost: { type: Number, required: true, min: 0 },
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
  status: {
    type: String,
    enum: ['ACTIVE', 'EXPIRED', 'DEPLETED'],
    default: 'ACTIVE',
  },
});

// ───────────────────────── Inventory Transaction ─────────────────────────

export interface IInventoryTransaction {
  type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'EXPIRED' | 'WASTAGE';
  quantity: number;
  batchNumber?: string;
  reason?: string;
  userId: mongoose.Types.ObjectId;
  timestamp: Date;
}

const InventoryTransactionSchema = new Schema<IInventoryTransaction>({
  type: {
    type: String,
    enum: ['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'EXPIRED', 'WASTAGE'],
    required: true,
  },
  quantity: { type: Number, required: true },
  batchNumber: { type: String },
  reason: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

// ───────────────────────── Inventory Item ─────────────────────────

export interface IInventoryItem extends Document {
  _id: mongoose.Types.ObjectId;
  itemId: string;
  name: string;
  category: 'REAGENT' | 'CONSUMABLE' | 'CHEMICAL' | 'GLASSWARE' | 'OTHER';
  description?: string;
  unit: string; // e.g., 'ml', 'pcs', 'kg', 'strips'
  currentStock: number;
  minimumStock: number; // Low-stock alert threshold
  maximumStock?: number;
  batches: IInventoryBatch[];
  transactions: IInventoryTransaction[];
  linkedTestIds?: mongoose.Types.ObjectId[];
  location?: string; // Storage location
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryItemSchema = new Schema<IInventoryItem>({
  itemId: { type: String, unique: true, index: true },
  name: { type: String, required: true, trim: true, index: true },
  category: {
    type: String,
    enum: ['REAGENT', 'CONSUMABLE', 'CHEMICAL', 'GLASSWARE', 'OTHER'],
    required: true,
    index: true,
  },
  description: { type: String, trim: true },
  unit: { type: String, required: true, trim: true },
  currentStock: { type: Number, required: true, default: 0, min: 0 },
  minimumStock: { type: Number, required: true, default: 0, min: 0 },
  maximumStock: { type: Number, min: 0 },
  batches: [InventoryBatchSchema],
  transactions: [InventoryTransactionSchema],
  linkedTestIds: [{ type: Schema.Types.ObjectId, ref: 'Test' }],
  location: { type: String, trim: true },
  isActive: { type: Boolean, default: true, index: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
InventoryItemSchema.index({ itemId: 1 });
InventoryItemSchema.index({ name: 1 });
InventoryItemSchema.index({ category: 1 });
InventoryItemSchema.index({ currentStock: 1 });
InventoryItemSchema.index({ isActive: 1 });
InventoryItemSchema.index({ createdAt: -1 });

// Virtual for low stock check
InventoryItemSchema.virtual('isLowStock').get(function () {
  return this.currentStock <= this.minimumStock;
});

// Virtual to get expiring-soon batches (within 30 days)
InventoryItemSchema.virtual('expiringSoonBatches').get(function () {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return this.batches.filter(
    (b) => b.status === 'ACTIVE' && b.expiryDate <= thirtyDaysFromNow
  );
});

// Pre-save middleware to generate itemId
InventoryItemSchema.pre('save', async function () {
  if (this.isNew && !this.itemId) {
    const count = await mongoose.model('InventoryItem').countDocuments();
    this.itemId = `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;
  }
});

// Instance methods
InventoryItemSchema.methods.addStock = function (
  quantity: number,
  batchNumber: string,
  purchaseDate: Date,
  expiryDate: Date,
  unitCost: number,
  userId: mongoose.Types.ObjectId,
  supplierId?: mongoose.Types.ObjectId,
) {
  this.batches.push({ batchNumber, quantity, purchaseDate, expiryDate, unitCost, supplierId, status: 'ACTIVE' });
  this.currentStock += quantity;
  this.transactions.push({ type: 'STOCK_IN', quantity, batchNumber, userId, timestamp: new Date() });
  return this.save();
};

InventoryItemSchema.methods.removeStock = function (
  quantity: number,
  userId: mongoose.Types.ObjectId,
  reason?: string,
  batchNumber?: string,
) {
  if (this.currentStock < quantity) {
    throw new Error('Insufficient stock');
  }
  this.currentStock -= quantity;
  this.transactions.push({ type: 'STOCK_OUT', quantity: -quantity, batchNumber, reason, userId, timestamp: new Date() });
  return this.save();
};

InventoryItemSchema.methods.adjustStock = function (
  quantity: number,
  userId: mongoose.Types.ObjectId,
  reason: string,
) {
  this.currentStock += quantity;
  if (this.currentStock < 0) this.currentStock = 0;
  this.transactions.push({ type: 'ADJUSTMENT', quantity, reason, userId, timestamp: new Date() });
  return this.save();
};

// Static methods
InventoryItemSchema.statics.findByItemId = function (itemId: string) {
  return this.findOne({ itemId });
};

InventoryItemSchema.statics.findLowStock = function () {
  return this.find({
    $expr: { $lte: ['$currentStock', '$minimumStock'] },
    isActive: true,
  }).sort({ currentStock: 1 });
};

InventoryItemSchema.statics.findExpiringSoon = function (days: number = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  return this.find({
    'batches.expiryDate': { $lte: futureDate },
    'batches.status': 'ACTIVE',
    isActive: true,
  });
};

InventoryItemSchema.statics.searchItems = function (searchTerm: string) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [{ itemId: regex }, { name: regex }, { category: regex }],
    isActive: true,
  });
};

// Export interface for static methods
interface IInventoryItemModel extends Model<IInventoryItem> {
  findByItemId(itemId: string): Promise<IInventoryItem | null>;
  findLowStock(): Promise<IInventoryItem[]>;
  findExpiringSoon(days?: number): Promise<IInventoryItem[]>;
  searchItems(searchTerm: string): Promise<IInventoryItem[]>;
}

export const InventoryItem: IInventoryItemModel = (mongoose.models.InventoryItem as IInventoryItemModel) ||
  mongoose.model<IInventoryItem, IInventoryItemModel>('InventoryItem', InventoryItemSchema);
