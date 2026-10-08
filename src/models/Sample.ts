import mongoose, { Document, Model, Schema } from 'mongoose';
import { SampleStatus } from '@/lib/validation';

export interface ISampleEvent {
  event: string;
  timestamp: Date;
  userId: mongoose.Types.ObjectId;
  notes?: string;
}

export interface ISample extends Document {
  _id: mongoose.Types.ObjectId;
  sampleId: string; // Human-readable unique ID
  orderId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  sampleType: string;
  barcode: string;
  qrCode: string;
  status: SampleStatus;
  collectionDate?: Date;
  receiptDate?: Date;
  collectedBy?: string;
  collectionLocation?: string;
  rejectionReason?: string;
  events: ISampleEvent[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SampleEventSchema = new Schema<ISampleEvent>({
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

const SampleSchema = new Schema<ISample>({
  sampleId: {
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
  sampleType: {
    type: String,
    required: true,
    index: true,
  },
  barcode: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  qrCode: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: Object.values(SampleStatus),
    default: SampleStatus.COLLECTED,
    index: true,
  },
  collectionDate: {
    type: Date,
    index: true,
  },
  receiptDate: {
    type: Date,
    index: true,
  },
  collectedBy: {
    type: String,
  },
  collectionLocation: {
    type: String,
  },
  rejectionReason: {
    type: String,
  },
  events: [SampleEventSchema],
  notes: {
    type: String,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
SampleSchema.index({ sampleId: 1 });
SampleSchema.index({ orderId: 1 });
SampleSchema.index({ patientId: 1 });
SampleSchema.index({ barcode: 1 });
SampleSchema.index({ qrCode: 1 });
SampleSchema.index({ status: 1 });
SampleSchema.index({ sampleType: 1 });
SampleSchema.index({ collectionDate: -1 });
SampleSchema.index({ receiptDate: -1 });
SampleSchema.index({ createdAt: -1 });

// Pre-save middleware to generate sampleId and codes
SampleSchema.pre('save', async function(next) {
  if (this.isNew) {
    if (!this.sampleId) {
      const count = await mongoose.model('Sample').countDocuments();
      this.sampleId = `SMP-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;
    }
    
    if (!this.barcode) {
      this.barcode = this.sampleId;
    }
    
    if (!this.qrCode) {
      this.qrCode = `${process.env.APP_URL}/samples/${this.sampleId}`;
    }
  }
  next();
});

// Instance method to add event
SampleSchema.methods.addEvent = function(event: string, userId: mongoose.Types.ObjectId, notes?: string) {
  this.events.push({
    event,
    userId,
    notes,
    timestamp: new Date(),
  });
  return this.save();
};

// Instance method to update status
SampleSchema.methods.updateStatus = function(
  status: SampleStatus, 
  userId: mongoose.Types.ObjectId,
  rejectionReason?: string,
  notes?: string
) {
  this.status = status;
  if (rejectionReason) {
    this.rejectionReason = rejectionReason;
  }
  
  if (status === SampleStatus.RECEIVED && !this.receiptDate) {
    this.receiptDate = new Date();
  }
  
  this.addEvent(`Status changed to ${status}`, userId, notes);
  return this.save();
};

// Static methods
SampleSchema.statics.findBySampleId = function(sampleId: string) {
  return this.findOne({ sampleId })
    .populate('orderId')
    .populate('patientId')
    .populate('events.userId');
};

SampleSchema.statics.findByBarcode = function(barcode: string) {
  return this.findOne({ barcode })
    .populate('orderId')
    .populate('patientId');
};

SampleSchema.statics.findByOrder = function(orderId: mongoose.Types.ObjectId) {
  return this.find({ orderId })
    .populate('patientId')
    .sort({ createdAt: -1 });
};

SampleSchema.statics.findByStatus = function(status: SampleStatus) {
  return this.find({ status })
    .populate('orderId')
    .populate('patientId')
    .sort({ createdAt: -1 });
};

SampleSchema.statics.findPendingSamples = function() {
  return this.find({
    status: { $in: [SampleStatus.COLLECTED, SampleStatus.RECEIVED] }
  })
    .populate('orderId')
    .populate('patientId')
    .sort({ createdAt: 1 });
};

// Export interface for static methods
interface ISampleModel extends Model<ISample> {
  findBySampleId(sampleId: string): Promise<ISample | null>;
  findByBarcode(barcode: string): Promise<ISample | null>;
  findByOrder(orderId: mongoose.Types.ObjectId): Promise<ISample[]>;
  findByStatus(status: SampleStatus): Promise<ISample[]>;
  findPendingSamples(): Promise<ISample[]>;
}

// Create and export model
const Sample: ISampleModel = (mongoose.models.Sample as ISampleModel) || 
  mongoose.model<ISample, ISampleModel>('Sample', SampleSchema);

export default Sample;