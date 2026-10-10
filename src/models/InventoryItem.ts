import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IStockTransaction {
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'EXPIRED' | 'DAMAGED';
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  batchNumber?: string;
  expiryDate?: Date;
  reason?: string;
  performedBy: mongoose.Types.ObjectId;
  timestamp: Date;
  notes?: string;
}

export interface IInventoryItem extends Document {
  _id: mongoose.Types.ObjectId;
  itemId: string; // Human-readable unique ID
  name: string;
  description?: string;
  category: 'REAGENT' | 'CONSUMABLE' | 'CALIBRATOR' | 'CONTROL' | 'SAMPLE_COLLECTION' | 'PPE' | 'OTHER';
  subcategory?: string;
  manufacturer?: string;
  supplierId?: mongoose.Types.ObjectId;
  unit: string; // ml, L, pieces, boxes, vials, etc.
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  storageLocation?: string;
  storageConditions?: string;
  shelfLife?: number; // in days
  batchNumber?: string;
  expiryDate?: Date;
  barcode?: string;
  qrCode?: string;
  isActive: boolean;
  transactions: IStockTransaction[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StockTransactionSchema = new Schema<IStockTransaction>({
  type: {
    type: String,
    enum: ['IN', 'OUT', 'ADJUSTMENT', 'EXPIRED', 'DAMAGED'],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  unitCost: {
    type: Number,
  },
  totalCost: {
    type: Number,
  },
  batchNumber: {
    type: String,
  },
  expiryDate: {
    type: Date,
  },
  reason: {
    type: String,
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
  },
}, { _id: false });

const InventoryItemSchema = new Schema<IInventoryItem>({
  itemId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  description: {
    type: String,
  },
  category: {
    type: String,
    enum: ['REAGENT', 'CONSUMABLE', 'CALIBRATOR', 'CONTROL', 'SAMPLE_COLLECTION', 'PPE', 'OTHER'],
    required: true,
    index: true,
  },
  subcategory: {
    type: String,
    index: true,
  },
  manufacturer: {
    type: String,
  },
  supplierId: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
    index: true,
  },
  unit: {
    type: String,
    required: true,
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  minStockLevel: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  maxStockLevel: {
    type: Number,
    required: true,
    default: 1000,
  },
  reorderPoint: {
    type: Number,
    required: true,
    default: 10,
  },
  reorderQuantity: {
    type: Number,
    required: true,
    default: 50,
  },
  unitCost: {
    type: Number,
    required: true,
    min: 0,
  },
  storageLocation: {
    type: String,
  },
  storageConditions: {
    type: String,
  },
  shelfLife: {
    type: Number,
    min: 0,
  },
  batchNumber: {
    type: String,
  },
  expiryDate: {
    type: Date,
    index: true,
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
  },
  qrCode: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  transactions: [StockTransactionSchema],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
InventoryItemSchema.index({ itemId: 1 });
InventoryItemSchema.index({ name: 'text', description: 'text' });
InventoryItemSchema.index({ category: 1, isActive: 1 });
InventoryItemSchema.index({ currentStock: 1 });
InventoryItemSchema.index({ supplierId: 1 });
InventoryItemSchema.index({ barcode: 1 });
InventoryItemSchema.index({ expiryDate: 1 });

// Compound indexes
InventoryItemSchema.index({ category: 1, subcategory: 1 });

// Virtuals
InventoryItemSchema.virtual('stockStatus').get(function() {
  if (this.currentStock === 0) return 'OUT_OF_STOCK';
  if (this.currentStock <= this.reorderPoint) return 'LOW_STOCK';
  if (this.currentStock <= this.minStockLevel) return 'BELOW_MIN';
  if (this.currentStock >= this.maxStockLevel) return 'OVERSTOCK';
  return 'ADEQUATE';
});

InventoryItemSchema.virtual('needsReorder').get(function() {
  return this.currentStock <= this.reorderPoint;
});

InventoryItemSchema.virtual('isExpired').get(function() {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

InventoryItemSchema.virtual('isExpiringSoon').get(function() {
  if (!this.expiryDate) return false;
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  return this.expiryDate <= thirtyDaysFromNow && this.expiryDate > today;
});

InventoryItemSchema.virtual('totalValue').get(function() {
  return this.currentStock * this.unitCost;
});

// Pre-save middleware
InventoryItemSchema.pre('save', async function() {
  if (this.isNew && !this.itemId) {
    const count = await mongoose.model('InventoryItem').countDocuments();
    this.itemId = `INV-${(count + 1).toString().padStart(6, '0')}`;
  }
});

// Instance methods
InventoryItemSchema.methods.addStock = function(
  quantity: number,
  userId: mongoose.Types.ObjectId,
  batchNumber?: string,
  expiryDate?: Date,
  unitCost?: number,
  notes?: string
) {
  this.currentStock += quantity;
  
  const transaction: IStockTransaction = {
    type: 'IN',
    quantity,
    unitCost: unitCost || this.unitCost,
    totalCost: quantity * (unitCost || this.unitCost),
    batchNumber,
    expiryDate,
    performedBy: userId,
    timestamp: new Date(),
    notes,
  };
  
  this.transactions.push(transaction);
  
  if (unitCost) {
    this.unitCost = unitCost;
  }
  if (batchNumber) {
    this.batchNumber = batchNumber;
  }
  if (expiryDate) {
    this.expiryDate = expiryDate;
  }
  
  return this.save();
};

InventoryItemSchema.methods.removeStock = function(
  quantity: number,
  userId: mongoose.Types.ObjectId,
  reason?: string,
  notes?: string
) {
  if (quantity > this.currentStock) {
    throw new Error('Insufficient stock');
  }
  
  this.currentStock -= quantity;
  
  const transaction: IStockTransaction = {
    type: 'OUT',
    quantity: -quantity,
    unitCost: this.unitCost,
    totalCost: -quantity * this.unitCost,
    reason,
    performedBy: userId,
    timestamp: new Date(),
    notes,
  };
  
  this.transactions.push(transaction);
  
  return this.save();
};

InventoryItemSchema.methods.adjustStock = function(
  newQuantity: number,
  userId: mongoose.Types.ObjectId,
  reason: string,
  notes?: string
) {
  const difference = newQuantity - this.currentStock;
  this.currentStock = newQuantity;
  
  const transaction: IStockTransaction = {
    type: 'ADJUSTMENT',
    quantity: difference,
    reason,
    performedBy: userId,
    timestamp: new Date(),
    notes,
  };
  
  this.transactions.push(transaction);
  
  return this.save();
};

InventoryItemSchema.methods.markExpired = function(
  userId: mongoose.Types.ObjectId,
  quantity?: number,
  notes?: string
) {
  const expiredQty = quantity || this.currentStock;
  this.currentStock -= expiredQty;
  
  const transaction: IStockTransaction = {
    type: 'EXPIRED',
    quantity: -expiredQty,
    reason: 'Expired stock',
    performedBy: userId,
    timestamp: new Date(),
    notes,
  };
  
  this.transactions.push(transaction);
  
  return this.save();
};

InventoryItemSchema.methods.markDamaged = function(
  quantity: number,
  userId: mongoose.Types.ObjectId,
  reason: string,
  notes?: string
) {
  this.currentStock -= quantity;
  
  const transaction: IStockTransaction = {
    type: 'DAMAGED',
    quantity: -quantity,
    reason,
    performedBy: userId,
    timestamp: new Date(),
    notes,
  };
  
  this.transactions.push(transaction);
  
  return this.save();
};

// Static methods
InventoryItemSchema.statics.findByItemId = function(itemId: string) {
  return this.findOne({ itemId: itemId.toUpperCase() })
    .populate('supplierId')
    .populate('createdBy', 'firstName lastName')
    .populate('transactions.performedBy', 'firstName lastName');
};

InventoryItemSchema.statics.findByCategory = function(category: string, activeOnly: boolean = true) {
  const query: any = { category };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query)
    .populate('supplierId')
    .sort({ name: 1 });
};

InventoryItemSchema.statics.findLowStock = function() {
  return this.find({
    isActive: true,
    $expr: { $lte: ['$currentStock', '$reorderPoint'] }
  })
    .populate('supplierId')
    .sort({ currentStock: 1 });
};

InventoryItemSchema.statics.findOutOfStock = function() {
  return this.find({
    isActive: true,
    currentStock: 0
  })
    .populate('supplierId')
    .sort({ name: 1 });
};

InventoryItemSchema.statics.findExpired = function() {
  return this.find({
    isActive: true,
    expiryDate: { $lte: new Date() }
  })
    .populate('supplierId')
    .sort({ expiryDate: 1 });
};

InventoryItemSchema.statics.findExpiringSoon = function(days: number = 30) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);
  
  return this.find({
    isActive: true,
    expiryDate: { $gte: today, $lte: futureDate }
  })
    .populate('supplierId')
    .sort({ expiryDate: 1 });
};

InventoryItemSchema.statics.getTotalValue = async function(category?: string) {
  const match: any = { isActive: true };
  if (category) {
    match.category = category;
  }
  
  const result = await this.aggregate([
    { $match: match },
    {
      $project: {
        totalValue: { $multiply: ['$currentStock', '$unitCost'] }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$totalValue' }
      }
    }
  ]);
  
  return result.length > 0 ? result[0].total : 0;
};

InventoryItemSchema.statics.getStockReport = async function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalStock: { $sum: '$currentStock' },
        totalValue: { $sum: { $multiply: ['$currentStock', '$unitCost'] } },
        lowStockItems: {
          $sum: {
            $cond: [{ $lte: ['$currentStock', '$reorderPoint'] }, 1, 0]
          }
        },
        outOfStockItems: {
          $sum: {
            $cond: [{ $eq: ['$currentStock', 0] }, 1, 0]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Export interface for static methods
interface IInventoryItemModel extends Model<IInventoryItem> {
  findByItemId(itemId: string): Promise<IInventoryItem | null>;
  findByCategory(category: string, activeOnly?: boolean): Promise<IInventoryItem[]>;
  findLowStock(): Promise<IInventoryItem[]>;
  findOutOfStock(): Promise<IInventoryItem[]>;
  findExpired(): Promise<IInventoryItem[]>;
  findExpiringSoon(days?: number): Promise<IInventoryItem[]>;
  getTotalValue(category?: string): Promise<number>;
  getStockReport(): Promise<any>;
}

// Create and export model
const InventoryItem: IInventoryItemModel = (mongoose.models.InventoryItem as IInventoryItemModel) || 
  mongoose.model<IInventoryItem, IInventoryItemModel>('InventoryItem', InventoryItemSchema);

export default InventoryItem;
