import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISupplierContact {
  name: string;
  designation: string;
  phone: string;
  email: string;
  isPrimary: boolean;
}

export interface ISupplier extends Document {
  _id: mongoose.Types.ObjectId;
  supplierId: string; // Human-readable unique ID
  name: string;
  companyName: string;
  gstNumber?: string;
  panNumber?: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  contacts: ISupplierContact[];
  email: string;
  phone: string;
  website?: string;
  category: 'REAGENTS' | 'CONSUMABLES' | 'EQUIPMENT' | 'CALIBRATORS' | 'CONTROLS' | 'OTHER';
  paymentTerms?: string;
  creditDays?: number;
  isActive: boolean;
  rating?: number;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierContactSchema = new Schema<ISupplierContact>({
  name: {
    type: String,
    required: true,
  },
  designation: {
    type: String,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    lowercase: true,
  },
  isPrimary: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const SupplierSchema = new Schema<ISupplier>({
  supplierId: {
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
  companyName: {
    type: String,
    required: true,
    trim: true,
  },
  gstNumber: {
    type: String,
    uppercase: true,
    trim: true,
  },
  panNumber: {
    type: String,
    uppercase: true,
    trim: true,
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },
  contacts: [SupplierContactSchema],
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
  },
  website: {
    type: String,
    lowercase: true,
  },
  category: {
    type: String,
    enum: ['REAGENTS', 'CONSUMABLES', 'EQUIPMENT', 'CALIBRATORS', 'CONTROLS', 'OTHER'],
    required: true,
    index: true,
  },
  paymentTerms: {
    type: String,
  },
  creditDays: {
    type: Number,
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
  },
  notes: {
    type: String,
  },
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
SupplierSchema.index({ supplierId: 1 });
SupplierSchema.index({ name: 'text', companyName: 'text' });
SupplierSchema.index({ category: 1, isActive: 1 });
SupplierSchema.index({ isActive: 1 });

// Pre-save middleware
SupplierSchema.pre('save', async function() {
  if (this.isNew && !this.supplierId) {
    const count = await mongoose.model('Supplier').countDocuments();
    this.supplierId = `SUP-${(count + 1).toString().padStart(5, '0')}`;
  }
});

// Instance methods
SupplierSchema.methods.activate = function() {
  this.isActive = true;
  return this.save();
};

SupplierSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

SupplierSchema.methods.updateRating = function(rating: number) {
  this.rating = Math.min(5, Math.max(0, rating));
  return this.save();
};

// Static methods
SupplierSchema.statics.findBySupplierId = function(supplierId: string) {
  return this.findOne({ supplierId: supplierId.toUpperCase() });
};

SupplierSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

SupplierSchema.statics.findByCategory = function(category: string, activeOnly: boolean = true) {
  const query: any = { category };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query).sort({ name: 1 });
};

// Export interface for static methods
interface ISupplierModel extends Model<ISupplier> {
  findBySupplierId(supplierId: string): Promise<ISupplier | null>;
  findActive(): Promise<ISupplier[]>;
  findByCategory(category: string, activeOnly?: boolean): Promise<ISupplier[]>;
}

// Create and export model
const Supplier: ISupplierModel = (mongoose.models.Supplier as ISupplierModel) || 
  mongoose.model<ISupplier, ISupplierModel>('Supplier', SupplierSchema);

export default Supplier;
