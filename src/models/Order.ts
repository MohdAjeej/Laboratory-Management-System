import mongoose, { Document, Model, Schema } from 'mongoose';
import { OrderStatus, PaymentStatus } from '@/lib/validation';

export interface IOrderItem {
  testId?: mongoose.Types.ObjectId;
  packageId?: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  discount: number;
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  orderId: string; // Human-readable unique ID
  patientId: mongoose.Types.ObjectId;
  hospitalId?: mongoose.Types.ObjectId;
  doctorId?: mongoose.Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: OrderStatus;
  priority: 'NORMAL' | 'URGENT';
  paymentStatus: PaymentStatus;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  testId: {
    type: Schema.Types.ObjectId,
    ref: 'Test',
  },
  packageId: {
    type: Schema.Types.ObjectId,
    ref: 'TestPackage',
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true,
  },
  hospitalId: {
    type: Schema.Types.ObjectId,
    ref: 'Hospital',
    index: true,
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor',
    index: true,
  },
  items: [OrderItemSchema],
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
  tax: {
    type: Number,
    default: 0,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.DRAFT,
    index: true,
  },
  priority: {
    type: String,
    enum: ['NORMAL', 'URGENT'],
    default: 'NORMAL',
    index: true,
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
    index: true,
  },
  notes: {
    type: String,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
OrderSchema.index({ orderId: 1 });
OrderSchema.index({ patientId: 1 });
OrderSchema.index({ hospitalId: 1 });
OrderSchema.index({ doctorId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ priority: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ createdBy: 1 });

// Pre-save middleware to generate orderId and calculate totals
OrderSchema.pre('save', async function() {
  if (this.isNew && !this.orderId) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderId = `ORD-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;
  }

  // Calculate totals
  this.subtotal = this.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const itemDiscount = this.items.reduce((sum, item) => {
    return sum + (item.discount * item.quantity);
  }, 0);

  const totalAfterDiscount = this.subtotal - itemDiscount - this.discount;
  this.total = totalAfterDiscount + this.tax;
});

// Static methods
OrderSchema.statics.findByOrderId = function(orderId: string) {
  return this.findOne({ orderId })
    .populate('patientId')
    .populate('hospitalId')
    .populate('doctorId')
    .populate('items.testId')
    .populate('createdBy');
};

OrderSchema.statics.findByPatient = function(patientId: mongoose.Types.ObjectId) {
  return this.find({ patientId })
    .populate('hospitalId')
    .populate('doctorId')
    .populate('items.testId')
    .sort({ createdAt: -1 });
};

OrderSchema.statics.findByHospital = function(hospitalId: mongoose.Types.ObjectId) {
  return this.find({ hospitalId })
    .populate('patientId')
    .populate('doctorId')
    .populate('items.testId')
    .sort({ createdAt: -1 });
};

OrderSchema.statics.findByStatus = function(status: OrderStatus) {
  return this.find({ status })
    .populate('patientId')
    .populate('hospitalId')
    .populate('doctorId')
    .sort({ createdAt: -1 });
};

// Export interface for static methods
interface IOrderModel extends Model<IOrder> {
  findByOrderId(orderId: string): Promise<IOrder | null>;
  findByPatient(patientId: mongoose.Types.ObjectId): Promise<IOrder[]>;
  findByHospital(hospitalId: mongoose.Types.ObjectId): Promise<IOrder[]>;
  findByStatus(status: OrderStatus): Promise<IOrder[]>;
}

// Create and export model
const Order: IOrderModel = (mongoose.models.Order as IOrderModel) || 
  mongoose.model<IOrder, IOrderModel>('Order', OrderSchema);

export default Order;