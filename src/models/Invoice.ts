import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IInvoiceItem {
  itemType: 'TEST' | 'PACKAGE' | 'CONSULTATION' | 'OTHER';
  testId?: mongoose.Types.ObjectId;
  packageId?: mongoose.Types.ObjectId;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  total: number;
}

export interface IInvoiceEvent {
  event: string;
  timestamp: Date;
  userId: mongoose.Types.ObjectId;
  notes?: string;
}

export interface IInvoice extends Document {
  _id: mongoose.Types.ObjectId;
  invoiceId: string; // Human-readable unique ID
  orderId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  items: IInvoiceItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  status: 'DRAFT' | 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
  dueDate?: Date;
  paidDate?: Date;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  events: IInvoiceEvent[];
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>({
  itemType: {
    type: String,
    enum: ['TEST', 'PACKAGE', 'CONSULTATION', 'OTHER'],
    required: true,
  },
  testId: {
    type: Schema.Types.ObjectId,
    ref: 'Test',
  },
  packageId: {
    type: Schema.Types.ObjectId,
    ref: 'TestPackage',
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

const InvoiceEventSchema = new Schema<IInvoiceEvent>({
  event: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  notes: {
    type: String,
  },
}, { _id: false });

const InvoiceSchema = new Schema<IInvoice>({
  invoiceId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true,
  },
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true,
  },
  items: [InvoiceItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0,
  },
  amountDue: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED'],
    default: 'DRAFT',
    index: true,
  },
  dueDate: {
    type: Date,
    index: true,
  },
  paidDate: {
    type: Date,
  },
  notes: {
    type: String,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  events: [InvoiceEventSchema],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
InvoiceSchema.index({ invoiceId: 1 });
InvoiceSchema.index({ orderId: 1 });
InvoiceSchema.index({ patientId: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ dueDate: 1 });
InvoiceSchema.index({ createdAt: -1 });
InvoiceSchema.index({ createdBy: 1 });

// Virtual for payment status percentage
InvoiceSchema.virtual('paymentProgress').get(function() {
  if (this.total === 0) return 100;
  return Math.round((this.amountPaid / this.total) * 100);
});

// Pre-save middleware to generate invoiceId and calculate totals
InvoiceSchema.pre('save', async function() {
  if (this.isNew && !this.invoiceId) {
    const count = await mongoose.model('Invoice').countDocuments();
    this.invoiceId = `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;
  }

  // Calculate item totals
  this.items.forEach((item) => {
    item.subtotal = item.unitPrice * item.quantity;
    const afterDiscount = item.subtotal - item.discount;
    item.taxAmount = (afterDiscount * item.taxRate) / 100;
    item.total = afterDiscount + item.taxAmount;
  });

  // Calculate invoice totals
  this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalDiscount = this.items.reduce((sum, item) => sum + item.discount, 0) + this.discount;
  this.taxAmount = this.items.reduce((sum, item) => sum + item.taxAmount, 0);
  this.total = this.subtotal - totalDiscount + this.taxAmount;
  this.amountDue = this.total - this.amountPaid;

  // Update status based on payment
  if (this.amountPaid === 0 && this.status !== 'DRAFT' && this.status !== 'CANCELLED') {
    this.status = 'PENDING';
  } else if (this.amountPaid > 0 && this.amountPaid < this.total) {
    this.status = 'PARTIALLY_PAID';
  } else if (this.amountPaid >= this.total) {
    this.status = 'PAID';
    if (!this.paidDate) {
      this.paidDate = new Date();
    }
  }

  // Check if overdue
  if (this.dueDate && this.status !== 'PAID' && this.status !== 'CANCELLED') {
    if (new Date() > this.dueDate) {
      this.status = 'OVERDUE';
    }
  }
});

// Instance methods
InvoiceSchema.methods.addEvent = function(event: string, userId: mongoose.Types.ObjectId, notes?: string) {
  this.events.push({
    event,
    userId,
    notes,
    timestamp: new Date(),
  });
  return this.save();
};

InvoiceSchema.methods.recordPayment = function(amount: number, userId: mongoose.Types.ObjectId) {
  this.amountPaid += amount;
  this.amountDue = this.total - this.amountPaid;

  if (this.amountPaid >= this.total) {
    this.status = 'PAID';
    this.paidDate = new Date();
  } else if (this.amountPaid > 0) {
    this.status = 'PARTIALLY_PAID';
  }

  this.addEvent(`Payment received: ₹${amount}`, userId);
  return this.save();
};

InvoiceSchema.methods.cancel = function(userId: mongoose.Types.ObjectId, reason?: string) {
  this.status = 'CANCELLED';
  this.addEvent('Invoice cancelled', userId, reason);
  return this.save();
};

InvoiceSchema.methods.refund = function(userId: mongoose.Types.ObjectId, reason?: string) {
  this.status = 'REFUNDED';
  this.addEvent('Invoice refunded', userId, reason);
  return this.save();
};

// Static methods
InvoiceSchema.statics.findByInvoiceId = function(invoiceId: string) {
  return this.findOne({ invoiceId })
    .populate('orderId')
    .populate('patientId')
    .populate('createdBy');
};

InvoiceSchema.statics.findByOrder = function(orderId: mongoose.Types.ObjectId) {
  return this.find({ orderId })
    .populate('patientId')
    .sort({ createdAt: -1 });
};

InvoiceSchema.statics.findByPatient = function(patientId: mongoose.Types.ObjectId) {
  return this.find({ patientId })
    .populate('orderId')
    .sort({ createdAt: -1 });
};

InvoiceSchema.statics.findPending = function() {
  return this.find({
    status: { $in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] }
  })
    .populate('patientId')
    .populate('orderId')
    .sort({ dueDate: 1 });
};

InvoiceSchema.statics.findOverdue = function() {
  return this.find({
    status: 'OVERDUE'
  })
    .populate('patientId')
    .populate('orderId')
    .sort({ dueDate: 1 });
};

// Export interface for static methods
interface IInvoiceModel extends Model<IInvoice> {
  findByInvoiceId(invoiceId: string): Promise<IInvoice | null>;
  findByOrder(orderId: mongoose.Types.ObjectId): Promise<IInvoice[]>;
  findByPatient(patientId: mongoose.Types.ObjectId): Promise<IInvoice[]>;
  findPending(): Promise<IInvoice[]>;
  findOverdue(): Promise<IInvoice[]>;
}

// Create and export model
const Invoice: IInvoiceModel = (mongoose.models.Invoice as IInvoiceModel) || 
  mongoose.model<IInvoice, IInvoiceModel>('Invoice', InvoiceSchema);

export default Invoice;
