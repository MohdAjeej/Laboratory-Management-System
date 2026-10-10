import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPaymentEvent {
  event: string;
  timestamp: Date;
  userId: mongoose.Types.ObjectId;
  notes?: string;
}

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  paymentId: string; // Human-readable unique ID
  invoiceId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  amount: number;
  method: 'CASH' | 'CARD' | 'UPI' | 'NET_BANKING' | 'CHEQUE' | 'WALLET' | 'OTHER';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  transactionId?: string;
  transactionDate?: Date;
  cardLast4?: string;
  upiId?: string;
  chequeNumber?: string;
  bankName?: string;
  notes?: string;
  receivedBy: mongoose.Types.ObjectId;
  refundAmount?: number;
  refundDate?: Date;
  refundReason?: string;
  refundedBy?: mongoose.Types.ObjectId;
  events: IPaymentEvent[];
  createdAt: Date;
  updatedAt: Date;
}

const PaymentEventSchema = new Schema<IPaymentEvent>({
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

const PaymentSchema = new Schema<IPayment>({
  paymentId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  invoiceId: {
    type: Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
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
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  method: {
    type: String,
    enum: ['CASH', 'CARD', 'UPI', 'NET_BANKING', 'CHEQUE', 'WALLET', 'OTHER'],
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'],
    default: 'PENDING',
    index: true,
  },
  transactionId: {
    type: String,
    index: true,
  },
  transactionDate: {
    type: Date,
    default: Date.now,
    index: true,
  },
  cardLast4: {
    type: String,
    minlength: 4,
    maxlength: 4,
  },
  upiId: {
    type: String,
  },
  chequeNumber: {
    type: String,
  },
  bankName: {
    type: String,
  },
  notes: {
    type: String,
  },
  receivedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  refundAmount: {
    type: Number,
    min: 0,
  },
  refundDate: {
    type: Date,
  },
  refundReason: {
    type: String,
  },
  refundedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  events: [PaymentEventSchema],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
PaymentSchema.index({ paymentId: 1 });
PaymentSchema.index({ invoiceId: 1 });
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ patientId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ method: 1 });
PaymentSchema.index({ transactionDate: -1 });
PaymentSchema.index({ receivedBy: 1 });
PaymentSchema.index({ createdAt: -1 });

// Compound indexes
PaymentSchema.index({ invoiceId: 1, status: 1 });
PaymentSchema.index({ patientId: 1, transactionDate: -1 });
PaymentSchema.index({ receivedBy: 1, transactionDate: -1 });

// Pre-save middleware to generate paymentId
PaymentSchema.pre('save', async function() {
  if (this.isNew && !this.paymentId) {
    const count = await mongoose.model('Payment').countDocuments();
    this.paymentId = `PAY-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;
  }

  // Set transaction date if not provided
  if (!this.transactionDate) {
    this.transactionDate = new Date();
  }
});

// Instance methods
PaymentSchema.methods.addEvent = function(event: string, userId: mongoose.Types.ObjectId, notes?: string) {
  this.events.push({
    event,
    userId,
    notes,
    timestamp: new Date(),
  });
  return this.save();
};

PaymentSchema.methods.complete = function(userId: mongoose.Types.ObjectId, transactionId?: string) {
  this.status = 'COMPLETED';
  if (transactionId) {
    this.transactionId = transactionId;
  }
  this.addEvent('Payment completed', userId);
  return this.save();
};

PaymentSchema.methods.fail = function(userId: mongoose.Types.ObjectId, reason?: string) {
  this.status = 'FAILED';
  this.addEvent('Payment failed', userId, reason);
  return this.save();
};

PaymentSchema.methods.cancel = function(userId: mongoose.Types.ObjectId, reason?: string) {
  this.status = 'CANCELLED';
  this.addEvent('Payment cancelled', userId, reason);
  return this.save();
};

PaymentSchema.methods.refund = function(
  userId: mongoose.Types.ObjectId,
  amount: number,
  reason: string
) {
  this.status = 'REFUNDED';
  this.refundAmount = amount;
  this.refundDate = new Date();
  this.refundReason = reason;
  this.refundedBy = userId;
  this.addEvent(`Payment refunded: ₹${amount}`, userId, reason);
  return this.save();
};

// Static methods
PaymentSchema.statics.findByPaymentId = function(paymentId: string) {
  return this.findOne({ paymentId })
    .populate('invoiceId')
    .populate('orderId')
    .populate('patientId')
    .populate('receivedBy');
};

PaymentSchema.statics.findByInvoice = function(invoiceId: mongoose.Types.ObjectId) {
  return this.find({ invoiceId })
    .populate('receivedBy')
    .sort({ transactionDate: -1 });
};

PaymentSchema.statics.findByOrder = function(orderId: mongoose.Types.ObjectId) {
  return this.find({ orderId })
    .populate('invoiceId')
    .populate('receivedBy')
    .sort({ transactionDate: -1 });
};

PaymentSchema.statics.findByPatient = function(patientId: mongoose.Types.ObjectId) {
  return this.find({ patientId })
    .populate('orderId')
    .populate('invoiceId')
    .sort({ transactionDate: -1 });
};

PaymentSchema.statics.findByStatus = function(status: string) {
  return this.find({ status })
    .populate('patientId')
    .populate('orderId')
    .populate('invoiceId')
    .populate('receivedBy')
    .sort({ transactionDate: -1 });
};

PaymentSchema.statics.findByMethod = function(method: string) {
  return this.find({ method, status: 'COMPLETED' })
    .populate('patientId')
    .populate('receivedBy')
    .sort({ transactionDate: -1 });
};

PaymentSchema.statics.getTotalByDateRange = async function(
  startDate: Date,
  endDate: Date,
  status: string = 'COMPLETED'
) {
  const result = await this.aggregate([
    {
      $match: {
        transactionDate: { $gte: startDate, $lte: endDate },
        status: status,
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  return result.length > 0 ? result[0] : { total: 0, count: 0 };
};

PaymentSchema.statics.getByMethodSummary = async function(
  startDate?: Date,
  endDate?: Date
) {
  const match: any = { status: 'COMPLETED' };
  
  if (startDate && endDate) {
    match.transactionDate = { $gte: startDate, $lte: endDate };
  }

  return await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$method',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        method: '$_id',
        total: 1,
        count: 1
      }
    },
    { $sort: { total: -1 } }
  ]);
};

// Export interface for static methods
interface IPaymentModel extends Model<IPayment> {
  findByPaymentId(paymentId: string): Promise<IPayment | null>;
  findByInvoice(invoiceId: mongoose.Types.ObjectId): Promise<IPayment[]>;
  findByOrder(orderId: mongoose.Types.ObjectId): Promise<IPayment[]>;
  findByPatient(patientId: mongoose.Types.ObjectId): Promise<IPayment[]>;
  findByStatus(status: string): Promise<IPayment[]>;
  findByMethod(method: string): Promise<IPayment[]>;
  getTotalByDateRange(startDate: Date, endDate: Date, status?: string): Promise<{ total: number; count: number }>;
  getByMethodSummary(startDate?: Date, endDate?: Date): Promise<Array<{ method: string; total: number; count: number }>>;
}

// Create and export model
const Payment: IPaymentModel = (mongoose.models.Payment as IPaymentModel) || 
  mongoose.model<IPayment, IPaymentModel>('Payment', PaymentSchema);

export default Payment;
