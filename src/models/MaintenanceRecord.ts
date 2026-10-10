import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMaintenancePart {
  partName: string;
  partNumber?: string;
  quantity: number;
  cost: number;
}

export interface IMaintenanceRecord extends Document {
  _id: mongoose.Types.ObjectId;
  maintenanceId: string; // Human-readable unique ID
  equipmentId: mongoose.Types.ObjectId;
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'CALIBRATION' | 'BREAKDOWN' | 'UPGRADE';
  description: string;
  scheduledDate?: Date;
  serviceDate: Date;
  completedDate?: Date;
  nextDueDate?: Date;
  performedBy: mongoose.Types.ObjectId; // Internal technician
  serviceProvider?: string; // External service provider name
  serviceEngineer?: string;
  contactNumber?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DEFERRED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  laborCost: number;
  partsCost: number;
  totalCost: number;
  partsReplaced: IMaintenancePart[];
  findings?: string;
  actionTaken?: string;
  recommendations?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  downtime?: number; // in hours
  attachments?: string[]; // URLs to documents/photos
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenancePartSchema = new Schema<IMaintenancePart>({
  partName: {
    type: String,
    required: true,
  },
  partNumber: {
    type: String,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  cost: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

const MaintenanceRecordSchema = new Schema<IMaintenanceRecord>({
  maintenanceId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  equipmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['PREVENTIVE', 'CORRECTIVE', 'CALIBRATION', 'BREAKDOWN', 'UPGRADE'],
    required: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
  },
  scheduledDate: {
    type: Date,
    index: true,
  },
  serviceDate: {
    type: Date,
    required: true,
    index: true,
  },
  completedDate: {
    type: Date,
  },
  nextDueDate: {
    type: Date,
    index: true,
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  serviceProvider: {
    type: String,
    trim: true,
  },
  serviceEngineer: {
    type: String,
    trim: true,
  },
  contactNumber: {
    type: String,
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DEFERRED'],
    default: 'SCHEDULED',
    index: true,
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM',
    index: true,
  },
  laborCost: {
    type: Number,
    default: 0,
    min: 0,
  },
  partsCost: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalCost: {
    type: Number,
    default: 0,
    min: 0,
  },
  partsReplaced: [MaintenancePartSchema],
  findings: {
    type: String,
  },
  actionTaken: {
    type: String,
  },
  recommendations: {
    type: String,
  },
  correctiveAction: {
    type: String,
  },
  preventiveAction: {
    type: String,
  },
  downtime: {
    type: Number,
    min: 0,
  },
  attachments: [{
    type: String,
  }],
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
MaintenanceRecordSchema.index({ maintenanceId: 1 });
MaintenanceRecordSchema.index({ equipmentId: 1, serviceDate: -1 });
MaintenanceRecordSchema.index({ type: 1, status: 1 });
MaintenanceRecordSchema.index({ status: 1, scheduledDate: 1 });
MaintenanceRecordSchema.index({ performedBy: 1, serviceDate: -1 });
MaintenanceRecordSchema.index({ createdAt: -1 });

// Pre-save middleware
MaintenanceRecordSchema.pre('save', async function() {
  if (this.isNew && !this.maintenanceId) {
    const count = await mongoose.model('MaintenanceRecord').countDocuments();
    this.maintenanceId = `MNT-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;
  }

  // Calculate total cost
  this.partsCost = this.partsReplaced.reduce((sum, part) => sum + (part.cost * part.quantity), 0);
  this.totalCost = this.laborCost + this.partsCost;
});

// Instance methods
MaintenanceRecordSchema.methods.complete = function(userId: mongoose.Types.ObjectId, findings?: string, actionTaken?: string) {
  this.status = 'COMPLETED';
  this.completedDate = new Date();
  if (findings) this.findings = findings;
  if (actionTaken) this.actionTaken = actionTaken;
  this.updatedBy = userId;
  return this.save();
};

MaintenanceRecordSchema.methods.cancel = function(userId: mongoose.Types.ObjectId, reason?: string) {
  this.status = 'CANCELLED';
  if (reason) this.notes = (this.notes || '') + `\nCancellation reason: ${reason}`;
  this.updatedBy = userId;
  return this.save();
};

MaintenanceRecordSchema.methods.defer = function(userId: mongoose.Types.ObjectId, newDate: Date, reason?: string) {
  this.status = 'DEFERRED';
  this.scheduledDate = newDate;
  if (reason) this.notes = (this.notes || '') + `\nDeferred reason: ${reason}`;
  this.updatedBy = userId;
  return this.save();
};

MaintenanceRecordSchema.methods.startWork = function(userId: mongoose.Types.ObjectId) {
  this.status = 'IN_PROGRESS';
  this.updatedBy = userId;
  return this.save();
};

// Static methods
MaintenanceRecordSchema.statics.findByMaintenanceId = function(maintenanceId: string) {
  return this.findOne({ maintenanceId })
    .populate('equipmentId')
    .populate('performedBy', 'firstName lastName')
    .populate('createdBy', 'firstName lastName');
};

MaintenanceRecordSchema.statics.findByEquipment = function(equipmentId: mongoose.Types.ObjectId) {
  return this.find({ equipmentId })
    .populate('performedBy', 'firstName lastName')
    .sort({ serviceDate: -1 });
};

MaintenanceRecordSchema.statics.findByType = function(type: string, status?: string) {
  const query: any = { type };
  if (status) {
    query.status = status;
  }
  return this.find(query)
    .populate('equipmentId')
    .populate('performedBy', 'firstName lastName')
    .sort({ serviceDate: -1 });
};

MaintenanceRecordSchema.statics.findScheduled = function(startDate?: Date, endDate?: Date) {
  const query: any = { status: 'SCHEDULED' };
  
  if (startDate && endDate) {
    query.scheduledDate = { $gte: startDate, $lte: endDate };
  }
  
  return this.find(query)
    .populate('equipmentId')
    .populate('performedBy', 'firstName lastName')
    .sort({ scheduledDate: 1 });
};

MaintenanceRecordSchema.statics.findOverdue = function() {
  return this.find({
    status: 'SCHEDULED',
    scheduledDate: { $lt: new Date() }
  })
    .populate('equipmentId')
    .populate('performedBy', 'firstName lastName')
    .sort({ scheduledDate: 1 });
};

MaintenanceRecordSchema.statics.getCostsByDateRange = async function(startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        serviceDate: { $gte: startDate, $lte: endDate },
        status: 'COMPLETED'
      }
    },
    {
      $group: {
        _id: '$type',
        totalCost: { $sum: '$totalCost' },
        laborCost: { $sum: '$laborCost' },
        partsCost: { $sum: '$partsCost' },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalCost: -1 } }
  ]);
};

MaintenanceRecordSchema.statics.getEquipmentDowntime = async function(equipmentId: mongoose.Types.ObjectId, startDate: Date, endDate: Date) {
  const result = await this.aggregate([
    {
      $match: {
        equipmentId: equipmentId,
        serviceDate: { $gte: startDate, $lte: endDate },
        status: 'COMPLETED'
      }
    },
    {
      $group: {
        _id: null,
        totalDowntime: { $sum: '$downtime' },
        maintenanceCount: { $sum: 1 }
      }
    }
  ]);

  return result.length > 0 ? result[0] : { totalDowntime: 0, maintenanceCount: 0 };
};

// Export interface for static methods
interface IMaintenanceRecordModel extends Model<IMaintenanceRecord> {
  findByMaintenanceId(maintenanceId: string): Promise<IMaintenanceRecord | null>;
  findByEquipment(equipmentId: mongoose.Types.ObjectId): Promise<IMaintenanceRecord[]>;
  findByType(type: string, status?: string): Promise<IMaintenanceRecord[]>;
  findScheduled(startDate?: Date, endDate?: Date): Promise<IMaintenanceRecord[]>;
  findOverdue(): Promise<IMaintenanceRecord[]>;
  getCostsByDateRange(startDate: Date, endDate: Date): Promise<any>;
  getEquipmentDowntime(equipmentId: mongoose.Types.ObjectId, startDate: Date, endDate: Date): Promise<any>;
}

// Create and export model
const MaintenanceRecord: IMaintenanceRecordModel = (mongoose.models.MaintenanceRecord as IMaintenanceRecordModel) || 
  mongoose.model<IMaintenanceRecord, IMaintenanceRecordModel>('MaintenanceRecord', MaintenanceRecordSchema);

export default MaintenanceRecord;
