import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IQCParameter {
  parameterName: string;
  unit?: string;
  targetValue: number;
  allowableSD: number; // Standard Deviation
  lowerLimit: number; // Target - 2SD
  upperLimit: number; // Target + 2SD
  criticalLowerLimit: number; // Target - 3SD
  criticalUpperLimit: number; // Target + 3SD
}

export interface IQCLot extends Document {
  _id: mongoose.Types.ObjectId;
  lotId: string; // Human-readable unique ID
  lotNumber: string; // Manufacturer lot number
  testId: mongoose.Types.ObjectId;
  controlName: string;
  level: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'NORMAL' | 'ABNORMAL' | 'CRITICAL';
  manufacturer: string;
  catalogNumber?: string;
  receivedDate: Date;
  expiryDate: Date;
  openedDate?: Date;
  stabilityAfterOpening?: number; // in days
  expiryAfterOpening?: Date;
  storageConditions: string;
  parameters: IQCParameter[];
  isActive: boolean;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QCParameterSchema = new Schema<IQCParameter>({
  parameterName: {
    type: String,
    required: true,
  },
  unit: {
    type: String,
  },
  targetValue: {
    type: Number,
    required: true,
  },
  allowableSD: {
    type: Number,
    required: true,
  },
  lowerLimit: {
    type: Number,
    required: true,
  },
  upperLimit: {
    type: Number,
    required: true,
  },
  criticalLowerLimit: {
    type: Number,
    required: true,
  },
  criticalUpperLimit: {
    type: Number,
    required: true,
  },
}, { _id: false });

const QCLotSchema = new Schema<IQCLot>({
  lotId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true,
  },
  lotNumber: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  testId: {
    type: Schema.Types.ObjectId,
    ref: 'Test',
    required: true,
    index: true,
  },
  controlName: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  level: {
    type: String,
    enum: ['LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'NORMAL', 'ABNORMAL', 'CRITICAL'],
    required: true,
    index: true,
  },
  manufacturer: {
    type: String,
    required: true,
    trim: true,
  },
  catalogNumber: {
    type: String,
    trim: true,
  },
  receivedDate: {
    type: Date,
    required: true,
    index: true,
  },
  expiryDate: {
    type: Date,
    required: true,
    index: true,
  },
  openedDate: {
    type: Date,
  },
  stabilityAfterOpening: {
    type: Number,
    min: 1,
  },
  expiryAfterOpening: {
    type: Date,
  },
  storageConditions: {
    type: String,
    required: true,
  },
  parameters: [QCParameterSchema],
  isActive: {
    type: Boolean,
    default: true,
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
QCLotSchema.index({ lotId: 1 });
QCLotSchema.index({ lotNumber: 1, testId: 1 });
QCLotSchema.index({ testId: 1, level: 1 });
QCLotSchema.index({ expiryDate: 1 });
QCLotSchema.index({ isActive: 1 });

// Virtuals
QCLotSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiryDate;
});

QCLotSchema.virtual('isExpiringSoon').get(function() {
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  return this.expiryDate <= thirtyDaysFromNow && this.expiryDate > today;
});

QCLotSchema.virtual('isOpened').get(function() {
  return !!this.openedDate;
});

QCLotSchema.virtual('daysUntilExpiry').get(function() {
  const today = new Date();
  const diffTime = this.expiryDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware
QCLotSchema.pre('save', async function() {
  if (this.isNew && !this.lotId) {
    const count = await mongoose.model('QCLot').countDocuments();
    this.lotId = `QCL-${(count + 1).toString().padStart(6, '0')}`;
  }

  // Calculate expiry after opening if opened
  if (this.openedDate && this.stabilityAfterOpening && !this.expiryAfterOpening) {
    const expiryAfterOpen = new Date(this.openedDate);
    expiryAfterOpen.setDate(expiryAfterOpen.getDate() + this.stabilityAfterOpening);
    
    // Use whichever comes first: original expiry or expiry after opening
    this.expiryAfterOpening = expiryAfterOpen < this.expiryDate ? expiryAfterOpen : this.expiryDate;
  }
});

// Instance methods
QCLotSchema.methods.open = function(userId: mongoose.Types.ObjectId) {
  if (!this.openedDate) {
    this.openedDate = new Date();
    this.updatedBy = userId;
  }
  return this.save();
};

QCLotSchema.methods.deactivate = function(userId: mongoose.Types.ObjectId, reason?: string) {
  this.isActive = false;
  this.updatedBy = userId;
  if (reason) {
    this.notes = (this.notes || '') + `\nDeactivated: ${reason}`;
  }
  return this.save();
};

// Static methods
QCLotSchema.statics.findByLotId = function(lotId: string) {
  return this.findOne({ lotId: lotId.toUpperCase() })
    .populate('testId')
    .populate('createdBy', 'firstName lastName');
};

QCLotSchema.statics.findByTest = function(testId: mongoose.Types.ObjectId, activeOnly: boolean = true) {
  const query: any = { testId };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query)
    .sort({ level: 1, expiryDate: 1 });
};

QCLotSchema.statics.findActive = function() {
  return this.find({ 
    isActive: true,
    expiryDate: { $gt: new Date() }
  })
    .populate('testId')
    .sort({ testId: 1, level: 1 });
};

QCLotSchema.statics.findExpired = function() {
  return this.find({
    isActive: true,
    expiryDate: { $lte: new Date() }
  })
    .populate('testId')
    .sort({ expiryDate: 1 });
};

QCLotSchema.statics.findExpiringSoon = function(days: number = 30) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);

  return this.find({
    isActive: true,
    expiryDate: { $gt: today, $lte: futureDate }
  })
    .populate('testId')
    .sort({ expiryDate: 1 });
};

// Export interface for static methods
interface IQCLotModel extends Model<IQCLot> {
  findByLotId(lotId: string): Promise<IQCLot | null>;
  findByTest(testId: mongoose.Types.ObjectId, activeOnly?: boolean): Promise<IQCLot[]>;
  findActive(): Promise<IQCLot[]>;
  findExpired(): Promise<IQCLot[]>;
  findExpiringSoon(days?: number): Promise<IQCLot[]>;
}

// Create and export model
const QCLot: IQCLotModel = (mongoose.models.QCLot as IQCLotModel) || 
  mongoose.model<IQCLot, IQCLotModel>('QCLot', QCLotSchema);

export default QCLot;
