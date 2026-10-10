import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICalibrationRecord {
  calibratedDate: Date;
  nextDueDate: Date;
  performedBy: mongoose.Types.ObjectId;
  certificateNumber?: string;
  result: 'PASSED' | 'FAILED' | 'CONDITIONAL';
  notes?: string;
}

export interface IEquipment extends Document {
  _id: mongoose.Types.ObjectId;
  equipmentId: string; // Human-readable unique ID
  name: string;
  code: string;
  manufacturer: string;
  modelName: string; // Changed from 'model' to avoid conflict with Document.model
  serialNumber: string;
  purchaseDate: Date;
  purchaseCost: number;
  supplier?: mongoose.Types.ObjectId;
  location: string;
  department: string;
  category: 'ANALYZER' | 'CENTRIFUGE' | 'MICROSCOPE' | 'INCUBATOR' | 'REFRIGERATOR' | 'AUTOCLAVE' | 'OTHER';
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'UNDER_REPAIR' | 'OUT_OF_SERVICE' | 'CALIBRATION_DUE';
  lastCalibrationDate?: Date;
  nextCalibrationDate?: Date;
  calibrationFrequency?: number; // in days
  calibrationRecords: ICalibrationRecord[];
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  maintenanceFrequency?: number; // in days
  warrantyExpiryDate?: Date;
  isUnderWarranty: boolean;
  specifications?: string;
  operatingProcedure?: string;
  notes?: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CalibrationRecordSchema = new Schema<ICalibrationRecord>({
  calibratedDate: {
    type: Date,
    required: true,
  },
  nextDueDate: {
    type: Date,
    required: true,
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  certificateNumber: {
    type: String,
  },
  result: {
    type: String,
    enum: ['PASSED', 'FAILED', 'CONDITIONAL'],
    required: true,
  },
  notes: {
    type: String,
  },
}, { _id: false, timestamps: true });

const EquipmentSchema = new Schema<IEquipment>({
  equipmentId: {
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
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
  },
  manufacturer: {
    type: String,
    required: true,
    trim: true,
  },
  modelName: {
    type: String,
    required: true,
    trim: true,
  },
  serialNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  purchaseDate: {
    type: Date,
    required: true,
  },
  purchaseCost: {
    type: Number,
    required: true,
    min: 0,
  },
  supplier: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
  },
  location: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  department: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  category: {
    type: String,
    enum: ['ANALYZER', 'CENTRIFUGE', 'MICROSCOPE', 'INCUBATOR', 'REFRIGERATOR', 'AUTOCLAVE', 'OTHER'],
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['OPERATIONAL', 'MAINTENANCE', 'UNDER_REPAIR', 'OUT_OF_SERVICE', 'CALIBRATION_DUE'],
    default: 'OPERATIONAL',
    index: true,
  },
  lastCalibrationDate: {
    type: Date,
  },
  nextCalibrationDate: {
    type: Date,
    index: true,
  },
  calibrationFrequency: {
    type: Number,
    min: 1,
  },
  calibrationRecords: [CalibrationRecordSchema],
  lastMaintenanceDate: {
    type: Date,
  },
  nextMaintenanceDate: {
    type: Date,
    index: true,
  },
  maintenanceFrequency: {
    type: Number,
    min: 1,
  },
  warrantyExpiryDate: {
    type: Date,
  },
  isUnderWarranty: {
    type: Boolean,
    default: false,
  },
  specifications: {
    type: String,
  },
  operatingProcedure: {
    type: String,
  },
  notes: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
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
EquipmentSchema.index({ equipmentId: 1 });
EquipmentSchema.index({ code: 1 });
EquipmentSchema.index({ serialNumber: 1 });
EquipmentSchema.index({ name: 'text' });
EquipmentSchema.index({ category: 1, status: 1 });
EquipmentSchema.index({ location: 1, department: 1 });
EquipmentSchema.index({ status: 1 });
EquipmentSchema.index({ nextCalibrationDate: 1 });
EquipmentSchema.index({ nextMaintenanceDate: 1 });

// Virtuals
EquipmentSchema.virtual('isCalibrationDue').get(function() {
  if (!this.nextCalibrationDate) return false;
  return new Date() >= this.nextCalibrationDate;
});

EquipmentSchema.virtual('isMaintenanceDue').get(function() {
  if (!this.nextMaintenanceDate) return false;
  return new Date() >= this.nextMaintenanceDate;
});

EquipmentSchema.virtual('age').get(function() {
  const today = new Date();
  const purchase = new Date(this.purchaseDate);
  const ageInDays = Math.floor((today.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24));
  return {
    days: ageInDays,
    years: Math.floor(ageInDays / 365),
    months: Math.floor((ageInDays % 365) / 30),
  };
});

// Pre-save middleware
EquipmentSchema.pre('save', async function() {
  if (this.isNew && !this.equipmentId) {
    const count = await mongoose.model('Equipment').countDocuments();
    this.equipmentId = `EQP-${(count + 1).toString().padStart(5, '0')}`;
  }

  // Update warranty status
  if (this.warrantyExpiryDate) {
    this.isUnderWarranty = new Date() <= this.warrantyExpiryDate;
  }

  // Auto-update status if calibration is due
  if (this.nextCalibrationDate && new Date() >= this.nextCalibrationDate && this.status === 'OPERATIONAL') {
    this.status = 'CALIBRATION_DUE';
  }
});

// Instance methods
EquipmentSchema.methods.recordCalibration = function(
  calibratedDate: Date,
  result: 'PASSED' | 'FAILED' | 'CONDITIONAL',
  performedBy: mongoose.Types.ObjectId,
  certificateNumber?: string,
  notes?: string
) {
  this.lastCalibrationDate = calibratedDate;
  
  if (this.calibrationFrequency) {
    const nextDate = new Date(calibratedDate);
    nextDate.setDate(nextDate.getDate() + this.calibrationFrequency);
    this.nextCalibrationDate = nextDate;
  }

  this.calibrationRecords.push({
    calibratedDate,
    nextDueDate: this.nextCalibrationDate!,
    performedBy,
    certificateNumber,
    result,
    notes,
  });

  if (result === 'PASSED') {
    this.status = 'OPERATIONAL';
  } else if (result === 'FAILED') {
    this.status = 'OUT_OF_SERVICE';
  }

  return this.save();
};

EquipmentSchema.methods.updateMaintenanceSchedule = function(lastDate: Date, frequency: number) {
  this.lastMaintenanceDate = lastDate;
  this.maintenanceFrequency = frequency;
  
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + frequency);
  this.nextMaintenanceDate = nextDate;
  
  return this.save();
};

EquipmentSchema.methods.updateStatus = function(status: string, userId?: mongoose.Types.ObjectId) {
  this.status = status as any;
  if (userId) {
    this.updatedBy = userId;
  }
  return this.save();
};

// Static methods
EquipmentSchema.statics.findByEquipmentId = function(equipmentId: string) {
  return this.findOne({ equipmentId: equipmentId.toUpperCase() })
    .populate('supplier')
    .populate('createdBy', 'firstName lastName')
    .populate('calibrationRecords.performedBy', 'firstName lastName');
};

EquipmentSchema.statics.findByCode = function(code: string) {
  return this.findOne({ code: code.toUpperCase() });
};

EquipmentSchema.statics.findByCategory = function(category: string, activeOnly: boolean = true) {
  const query: any = { category };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query)
    .populate('supplier')
    .sort({ name: 1 });
};

EquipmentSchema.statics.findByLocation = function(location: string) {
  return this.find({ location, isActive: true })
    .sort({ name: 1 });
};

EquipmentSchema.statics.findByStatus = function(status: string) {
  return this.find({ status: status as any, isActive: true })
    .populate('supplier')
    .sort({ name: 1 });
};

EquipmentSchema.statics.findCalibrationDue = function(daysAhead: number = 30) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);

  return this.find({
    isActive: true,
    nextCalibrationDate: { $lte: futureDate },
    status: { $ne: 'OUT_OF_SERVICE' }
  })
    .populate('supplier')
    .sort({ nextCalibrationDate: 1 });
};

EquipmentSchema.statics.findMaintenanceDue = function(daysAhead: number = 30) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);

  return this.find({
    isActive: true,
    nextMaintenanceDate: { $lte: futureDate },
    status: { $ne: 'OUT_OF_SERVICE' }
  })
    .sort({ nextMaintenanceDate: 1 });
};

EquipmentSchema.statics.getEquipmentStats = async function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalCost: { $sum: '$purchaseCost' }
      }
    }
  ]);
};

// Export interface for static methods
interface IEquipmentModel extends Model<IEquipment> {
  findByEquipmentId(equipmentId: string): Promise<IEquipment | null>;
  findByCode(code: string): Promise<IEquipment | null>;
  findByCategory(category: string, activeOnly?: boolean): Promise<IEquipment[]>;
  findByLocation(location: string): Promise<IEquipment[]>;
  findByStatus(status: string): Promise<IEquipment[]>;
  findCalibrationDue(daysAhead?: number): Promise<IEquipment[]>;
  findMaintenanceDue(daysAhead?: number): Promise<IEquipment[]>;
  getEquipmentStats(): Promise<any>;
}

// Create and export model
const Equipment: IEquipmentModel = (mongoose.models.Equipment as IEquipmentModel) || 
  mongoose.model<IEquipment, IEquipmentModel>('Equipment', EquipmentSchema);

export default Equipment;
