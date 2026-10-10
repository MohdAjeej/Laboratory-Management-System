import mongoose, { Document, Model, Schema } from 'mongoose';

// ───────────────────────── QC Lot ─────────────────────────

export interface IQCLot extends Document {
  _id: mongoose.Types.ObjectId;
  lotId: string;
  name: string;
  manufacturer: string;
  lotNumber: string;
  testId: mongoose.Types.ObjectId;
  parameterId?: mongoose.Types.ObjectId;
  equipmentId?: mongoose.Types.ObjectId;
  targetValue: number;
  acceptableMin: number;
  acceptableMax: number;
  unit: string;
  expiryDate: Date;
  openDate?: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'DEPLETED';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QCLotSchema = new Schema<IQCLot>({
  lotId: { type: String, unique: true, index: true },
  name: { type: String, required: true, trim: true, index: true },
  manufacturer: { type: String, required: true, trim: true },
  lotNumber: { type: String, required: true, trim: true, index: true },
  testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true, index: true },
  parameterId: { type: Schema.Types.ObjectId },
  equipmentId: { type: Schema.Types.ObjectId, ref: 'Equipment', index: true },
  targetValue: { type: Number, required: true },
  acceptableMin: { type: Number, required: true },
  acceptableMax: { type: Number, required: true },
  unit: { type: String, required: true },
  expiryDate: { type: Date, required: true, index: true },
  openDate: { type: Date },
  status: {
    type: String,
    enum: ['ACTIVE', 'EXPIRED', 'DEPLETED'],
    default: 'ACTIVE',
    index: true,
  },
  isActive: { type: Boolean, default: true, index: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

QCLotSchema.pre('save', async function () {
  if (this.isNew && !this.lotId) {
    const count = await mongoose.model('QCLot').countDocuments();
    this.lotId = `QCL-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;
  }
});

QCLotSchema.virtual('isExpired').get(function () {
  return new Date() > this.expiryDate;
});

QCLotSchema.statics.findByTestId = function (testId: mongoose.Types.ObjectId) {
  return this.find({ testId, status: 'ACTIVE', isActive: true })
    .populate('testId', 'name code')
    .populate('equipmentId', 'name equipmentId');
};

QCLotSchema.statics.findExpiring = function (days: number = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  return this.find({
    expiryDate: { $lte: futureDate },
    status: 'ACTIVE',
    isActive: true,
  }).sort({ expiryDate: 1 });
};

interface IQCLotModel extends Model<IQCLot> {
  findByTestId(testId: mongoose.Types.ObjectId): Promise<IQCLot[]>;
  findExpiring(days?: number): Promise<IQCLot[]>;
}

export const QCLot: IQCLotModel = (mongoose.models.QCLot as IQCLotModel) ||
  mongoose.model<IQCLot, IQCLotModel>('QCLot', QCLotSchema);

// ───────────────────────── QC Run ─────────────────────────

export interface IQCRun extends Document {
  _id: mongoose.Types.ObjectId;
  runId: string;
  qcLotId: mongoose.Types.ObjectId;
  testId: mongoose.Types.ObjectId;
  equipmentId?: mongoose.Types.ObjectId;
  measuredValue: number;
  targetValue: number;
  acceptableMin: number;
  acceptableMax: number;
  unit: string;
  result: 'PASS' | 'FAIL' | 'WARNING';
  deviation: number; // Percentage deviation from target
  performedBy: mongoose.Types.ObjectId;
  performedAt: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  correctiveAction?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QCRunSchema = new Schema<IQCRun>({
  runId: { type: String, unique: true, index: true },
  qcLotId: { type: Schema.Types.ObjectId, ref: 'QCLot', required: true, index: true },
  testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true, index: true },
  equipmentId: { type: Schema.Types.ObjectId, ref: 'Equipment', index: true },
  measuredValue: { type: Number, required: true },
  targetValue: { type: Number, required: true },
  acceptableMin: { type: Number, required: true },
  acceptableMax: { type: Number, required: true },
  unit: { type: String, required: true },
  result: {
    type: String,
    enum: ['PASS', 'FAIL', 'WARNING'],
    required: true,
    index: true,
  },
  deviation: { type: Number, required: true },
  performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  performedAt: { type: Date, required: true, default: Date.now, index: true },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  correctiveAction: { type: String },
  notes: { type: String },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
QCRunSchema.index({ runId: 1 });
QCRunSchema.index({ qcLotId: 1 });
QCRunSchema.index({ testId: 1 });
QCRunSchema.index({ result: 1 });
QCRunSchema.index({ performedAt: -1 });
QCRunSchema.index({ createdAt: -1 });

// Compound
QCRunSchema.index({ testId: 1, performedAt: -1 });
QCRunSchema.index({ equipmentId: 1, performedAt: -1 });

// Pre-save middleware
QCRunSchema.pre('save', async function () {
  if (this.isNew && !this.runId) {
    const count = await mongoose.model('QCRun').countDocuments();
    this.runId = `QCR-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;
  }

  // Calculate result
  if (this.measuredValue < this.acceptableMin || this.measuredValue > this.acceptableMax) {
    this.result = 'FAIL';
  } else {
    this.result = 'PASS';
  }

  // Calculate deviation %
  if (this.targetValue !== 0) {
    this.deviation = Math.round(((this.measuredValue - this.targetValue) / this.targetValue) * 10000) / 100;
  } else {
    this.deviation = 0;
  }
});

// Static methods
QCRunSchema.statics.findByLot = function (qcLotId: mongoose.Types.ObjectId) {
  return this.find({ qcLotId })
    .populate('performedBy', 'firstName lastName')
    .populate('reviewedBy', 'firstName lastName')
    .sort({ performedAt: -1 });
};

QCRunSchema.statics.findByTest = function (testId: mongoose.Types.ObjectId, limit: number = 50) {
  return this.find({ testId })
    .populate('qcLotId', 'lotId name lotNumber')
    .populate('performedBy', 'firstName lastName')
    .sort({ performedAt: -1 })
    .limit(limit);
};

QCRunSchema.statics.findFailures = function (days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return this.find({
    result: 'FAIL',
    performedAt: { $gte: startDate },
  })
    .populate('qcLotId', 'lotId name')
    .populate('testId', 'name code')
    .populate('performedBy', 'firstName lastName')
    .sort({ performedAt: -1 });
};

QCRunSchema.statics.getStatsForTest = async function (testId: mongoose.Types.ObjectId, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return this.aggregate([
    { $match: { testId: new mongoose.Types.ObjectId(testId), performedAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$result',
        count: { $sum: 1 },
        avgDeviation: { $avg: '$deviation' },
      },
    },
  ]);
};

interface IQCRunModel extends Model<IQCRun> {
  findByLot(qcLotId: mongoose.Types.ObjectId): Promise<IQCRun[]>;
  findByTest(testId: mongoose.Types.ObjectId, limit?: number): Promise<IQCRun[]>;
  findFailures(days?: number): Promise<IQCRun[]>;
  getStatsForTest(testId: mongoose.Types.ObjectId, days?: number): Promise<any>;
}

export const QCRun: IQCRunModel = (mongoose.models.QCRun as IQCRunModel) ||
  mongoose.model<IQCRun, IQCRunModel>('QCRun', QCRunSchema);
