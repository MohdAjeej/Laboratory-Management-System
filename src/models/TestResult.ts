import mongoose, { Document, Model, Schema } from 'mongoose';
import { ResultStatus } from '@/lib/validation';

export interface IResultParameter {
  parameterId: mongoose.Types.ObjectId;
  name: string;
  value: string | number;
  unit?: string;
  referenceRange?: string;
  flag?: 'NORMAL' | 'HIGH' | 'LOW' | 'ABNORMAL' | 'CRITICAL';
  notes?: string;
}

export interface IResultEvent {
  event: string;
  timestamp: Date;
  userId: mongoose.Types.ObjectId;
  notes?: string;
}

export interface ITestResult extends Document {
  _id: mongoose.Types.ObjectId;
  resultId: string; // Human-readable unique ID
  orderId: mongoose.Types.ObjectId;
  sampleId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  testId: mongoose.Types.ObjectId;
  parameters: IResultParameter[];
  status: ResultStatus;
  enteredBy?: mongoose.Types.ObjectId;
  enteredAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  amendedBy?: mongoose.Types.ObjectId;
  amendedAt?: Date;
  amendmentReason?: string;
  previousVersion?: mongoose.Types.ObjectId;
  events: IResultEvent[];
  technicalComments?: string;
  clinicalSignificance?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResultParameterSchema = new Schema<IResultParameter>({
  parameterId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  value: {
    type: Schema.Types.Mixed,
    required: true,
  },
  unit: {
    type: String,
  },
  referenceRange: {
    type: String,
  },
  flag: {
    type: String,
    enum: ['NORMAL', 'HIGH', 'LOW', 'ABNORMAL', 'CRITICAL'],
  },
  notes: {
    type: String,
  },
}, { _id: false });

const ResultEventSchema = new Schema<IResultEvent>({
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

const TestResultSchema = new Schema<ITestResult>({
  resultId: {
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
  sampleId: {
    type: Schema.Types.ObjectId,
    ref: 'Sample',
    required: true,
    index: true,
  },
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true,
  },
  testId: {
    type: Schema.Types.ObjectId,
    ref: 'Test',
    required: true,
    index: true,
  },
  parameters: [ResultParameterSchema],
  status: {
    type: String,
    enum: Object.values(ResultStatus),
    default: ResultStatus.DRAFT,
    index: true,
  },
  enteredBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  enteredAt: {
    type: Date,
    index: true,
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  verifiedAt: {
    type: Date,
    index: true,
  },
  amendedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  amendedAt: {
    type: Date,
  },
  amendmentReason: {
    type: String,
  },
  previousVersion: {
    type: Schema.Types.ObjectId,
    ref: 'TestResult',
  },
  events: [ResultEventSchema],
  technicalComments: {
    type: String,
  },
  clinicalSignificance: {
    type: String,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
TestResultSchema.index({ resultId: 1 });
TestResultSchema.index({ orderId: 1 });
TestResultSchema.index({ sampleId: 1 });
TestResultSchema.index({ patientId: 1 });
TestResultSchema.index({ testId: 1 });
TestResultSchema.index({ status: 1 });
TestResultSchema.index({ enteredAt: -1 });
TestResultSchema.index({ verifiedAt: -1 });
TestResultSchema.index({ createdAt: -1 });

// Pre-save middleware to generate resultId
TestResultSchema.pre('save', async function() {
  if (this.isNew && !this.resultId) {
    const count = await mongoose.model('TestResult').countDocuments();
    this.resultId = `RES-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;
  }
});

// Instance methods
TestResultSchema.methods.addEvent = function(event: string, userId: mongoose.Types.ObjectId, notes?: string) {
  this.events.push({
    event,
    userId,
    notes,
    timestamp: new Date(),
  });
  return this.save();
};

TestResultSchema.methods.submit = function(userId: mongoose.Types.ObjectId) {
  this.status = ResultStatus.SUBMITTED;
  this.enteredBy = userId;
  this.enteredAt = new Date();
  
  // Check for critical or abnormal values
  const hasCritical = this.parameters.some((p: IResultParameter) => p.flag === 'CRITICAL');
  const hasAbnormal = this.parameters.some((p: IResultParameter) => p.flag === 'ABNORMAL' || p.flag === 'HIGH' || p.flag === 'LOW');
  
  if (hasCritical) {
    this.status = ResultStatus.CRITICAL;
  } else if (hasAbnormal) {
    this.status = ResultStatus.ABNORMAL;
  }
  
  this.addEvent('Result submitted', userId);
  return this.save();
};

TestResultSchema.methods.verify = function(userId: mongoose.Types.ObjectId) {
  this.status = ResultStatus.VERIFIED;
  this.verifiedBy = userId;
  this.verifiedAt = new Date();
  this.addEvent('Result verified', userId);
  return this.save();
};

TestResultSchema.methods.amend = function(
  userId: mongoose.Types.ObjectId,
  reason: string,
  updatedParameters: IResultParameter[]
) {
  // Create a copy of the current version
  const previousVersionId = this._id;
  
  // Update parameters
  this.parameters = updatedParameters;
  this.status = ResultStatus.AMENDED;
  this.amendedBy = userId;
  this.amendedAt = new Date();
  this.amendmentReason = reason;
  this.previousVersion = previousVersionId;
  
  this.addEvent(`Result amended: ${reason}`, userId);
  return this.save();
};

// Static methods
TestResultSchema.statics.findByResultId = function(resultId: string) {
  return this.findOne({ resultId })
    .populate('orderId')
    .populate('sampleId')
    .populate('patientId')
    .populate('testId')
    .populate('enteredBy')
    .populate('verifiedBy');
};

TestResultSchema.statics.findByOrder = function(orderId: mongoose.Types.ObjectId) {
  return this.find({ orderId })
    .populate('sampleId')
    .populate('testId')
    .sort({ createdAt: -1 });
};

TestResultSchema.statics.findByPatient = function(patientId: mongoose.Types.ObjectId) {
  return this.find({ patientId })
    .populate('orderId')
    .populate('testId')
    .sort({ createdAt: -1 });
};

TestResultSchema.statics.findPendingVerification = function() {
  return this.find({
    status: { $in: [ResultStatus.SUBMITTED, ResultStatus.ABNORMAL, ResultStatus.CRITICAL] }
  })
    .populate('orderId')
    .populate('patientId')
    .populate('testId')
    .populate('enteredBy')
    .sort({ createdAt: 1 });
};

TestResultSchema.statics.findCriticalResults = function() {
  return this.find({
    status: ResultStatus.CRITICAL
  })
    .populate('orderId')
    .populate('patientId')
    .populate('testId')
    .sort({ createdAt: -1 });
};

// Export interface for static methods
interface ITestResultModel extends Model<ITestResult> {
  findByResultId(resultId: string): Promise<ITestResult | null>;
  findByOrder(orderId: mongoose.Types.ObjectId): Promise<ITestResult[]>;
  findByPatient(patientId: mongoose.Types.ObjectId): Promise<ITestResult[]>;
  findPendingVerification(): Promise<ITestResult[]>;
  findCriticalResults(): Promise<ITestResult[]>;
}

// Create and export model
const TestResult: ITestResultModel = (mongoose.models.TestResult as ITestResultModel) || 
  mongoose.model<ITestResult, ITestResultModel>('TestResult', TestResultSchema);

export default TestResult;
