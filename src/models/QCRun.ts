import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IQCResult {
  parameterName: string;
  observedValue: number;
  targetValue: number;
  lowerLimit: number;
  upperLimit: number;
  criticalLowerLimit: number;
  criticalUpperLimit: number;
  deviation: number; // Observed - Target
  zScore: number; // (Observed - Target) / SD
  status: 'IN_CONTROL' | 'WARNING' | 'OUT_OF_CONTROL';
  violationRule?: string; // Westgard rule violated
}

export interface IQCRun extends Document {
  _id: mongoose.Types.ObjectId;
  runId: string; // Human-readable unique ID
  qcLotId: mongoose.Types.ObjectId;
  testId: mongoose.Types.ObjectId;
  equipmentId?: mongoose.Types.ObjectId;
  runDate: Date;
  runTime: string;
  shift: 'MORNING' | 'AFTERNOON' | 'NIGHT';
  operator: mongoose.Types.ObjectId;
  results: IQCResult[];
  overallStatus: 'ACCEPTED' | 'REJECTED' | 'UNDER_REVIEW';
  comments?: string;
  correctiveAction?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewComments?: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  isPatientResultsReleased: boolean; // Were patient results released based on this QC?
  createdAt: Date;
  updatedAt: Date;
}

const QCResultSchema = new Schema<IQCResult>({
  parameterName: {
    type: String,
    required: true,
  },
  observedValue: {
    type: Number,
    required: true,
  },
  targetValue: {
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
  deviation: {
    type: Number,
    required: true,
  },
  zScore: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['IN_CONTROL', 'WARNING', 'OUT_OF_CONTROL'],
    required: true,
  },
  violationRule: {
    type: String,
  },
}, { _id: false });

const QCRunSchema = new Schema<IQCRun>({
  runId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  qcLotId: {
    type: Schema.Types.ObjectId,
    ref: 'QCLot',
    required: true,
    index: true,
  },
  testId: {
    type: Schema.Types.ObjectId,
    ref: 'Test',
    required: true,
    index: true,
  },
  equipmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Equipment',
    index: true,
  },
  runDate: {
    type: Date,
    required: true,
    index: true,
  },
  runTime: {
    type: String,
    required: true,
  },
  shift: {
    type: String,
    enum: ['MORNING', 'AFTERNOON', 'NIGHT'],
    required: true,
    index: true,
  },
  operator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  results: [QCResultSchema],
  overallStatus: {
    type: String,
    enum: ['ACCEPTED', 'REJECTED', 'UNDER_REVIEW'],
    required: true,
    index: true,
  },
  comments: {
    type: String,
  },
  correctiveAction: {
    type: String,
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: {
    type: Date,
  },
  reviewComments: {
    type: String,
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  },
  isPatientResultsReleased: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
QCRunSchema.index({ runId: 1 });
QCRunSchema.index({ qcLotId: 1, runDate: -1 });
QCRunSchema.index({ testId: 1, runDate: -1 });
QCRunSchema.index({ equipmentId: 1, runDate: -1 });
QCRunSchema.index({ operator: 1, runDate: -1 });
QCRunSchema.index({ overallStatus: 1, runDate: -1 });
QCRunSchema.index({ shift: 1, runDate: -1 });

// Compound indexes
QCRunSchema.index({ testId: 1, overallStatus: 1, runDate: -1 });
QCRunSchema.index({ equipmentId: 1, overallStatus: 1, runDate: -1 });

// Virtuals
QCRunSchema.virtual('hasViolations').get(function() {
  return this.results.some(r => r.status === 'OUT_OF_CONTROL');
});

QCRunSchema.virtual('hasWarnings').get(function() {
  return this.results.some(r => r.status === 'WARNING');
});

QCRunSchema.virtual('acceptanceRate').get(function() {
  if (this.results.length === 0) return 0;
  const inControl = this.results.filter(r => r.status === 'IN_CONTROL').length;
  return Math.round((inControl / this.results.length) * 100);
});

// Pre-save middleware
QCRunSchema.pre('save', async function() {
  if (this.isNew && !this.runId) {
    const count = await mongoose.model('QCRun').countDocuments();
    this.runId = `QCR-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;
  }

  // Auto-determine overall status based on results
  if (this.results.length > 0) {
    const hasOutOfControl = this.results.some(r => r.status === 'OUT_OF_CONTROL');
    const hasWarning = this.results.some(r => r.status === 'WARNING');

    if (hasOutOfControl) {
      this.overallStatus = 'REJECTED';
    } else if (hasWarning) {
      this.overallStatus = 'UNDER_REVIEW';
    } else if (this.overallStatus !== 'ACCEPTED') {
      // If all in control and not already set, mark as accepted
      this.overallStatus = 'ACCEPTED';
    }
  }
});

// Instance methods
QCRunSchema.methods.review = function(userId: mongoose.Types.ObjectId, comments?: string) {
  this.reviewedBy = userId;
  this.reviewedAt = new Date();
  if (comments) this.reviewComments = comments;
  return this.save();
};

QCRunSchema.methods.approve = function(userId: mongoose.Types.ObjectId) {
  this.overallStatus = 'ACCEPTED';
  this.approvedBy = userId;
  this.approvedAt = new Date();
  this.isPatientResultsReleased = true;
  return this.save();
};

QCRunSchema.methods.reject = function(userId: mongoose.Types.ObjectId, reason: string, correctiveAction?: string) {
  this.overallStatus = 'REJECTED';
  this.reviewedBy = userId;
  this.reviewedAt = new Date();
  this.reviewComments = reason;
  if (correctiveAction) this.correctiveAction = correctiveAction;
  return this.save();
};

// Static methods
QCRunSchema.statics.findByRunId = function(runId: string) {
  return this.findOne({ runId })
    .populate('qcLotId')
    .populate('testId')
    .populate('equipmentId')
    .populate('operator', 'firstName lastName')
    .populate('reviewedBy', 'firstName lastName')
    .populate('approvedBy', 'firstName lastName');
};

QCRunSchema.statics.findByTest = function(testId: mongoose.Types.ObjectId, startDate?: Date, endDate?: Date) {
  const query: any = { testId };
  
  if (startDate && endDate) {
    query.runDate = { $gte: startDate, $lte: endDate };
  }
  
  return this.find(query)
    .populate('qcLotId')
    .populate('equipmentId')
    .populate('operator', 'firstName lastName')
    .sort({ runDate: -1 });
};

QCRunSchema.statics.findByEquipment = function(equipmentId: mongoose.Types.ObjectId, startDate?: Date, endDate?: Date) {
  const query: any = { equipmentId };
  
  if (startDate && endDate) {
    query.runDate = { $gte: startDate, $lte: endDate };
  }
  
  return this.find(query)
    .populate('qcLotId')
    .populate('testId')
    .populate('operator', 'firstName lastName')
    .sort({ runDate: -1 });
};

QCRunSchema.statics.findByStatus = function(status: string, startDate?: Date, endDate?: Date) {
  const query: any = { overallStatus: status };
  
  if (startDate && endDate) {
    query.runDate = { $gte: startDate, $lte: endDate };
  }
  
  return this.find(query)
    .populate('qcLotId')
    .populate('testId')
    .populate('equipmentId')
    .populate('operator', 'firstName lastName')
    .sort({ runDate: -1 });
};

QCRunSchema.statics.findByShift = function(shift: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.find({
    shift: shift as any,
    runDate: { $gte: startOfDay, $lte: endOfDay }
  })
    .populate('qcLotId')
    .populate('testId')
    .populate('operator', 'firstName lastName')
    .sort({ runTime: 1 });
};

QCRunSchema.statics.getQCStatsByDateRange = async function(startDate: Date, endDate: Date, testId?: mongoose.Types.ObjectId) {
  const match: any = {
    runDate: { $gte: startDate, $lte: endDate }
  };
  
  if (testId) {
    match.testId = testId;
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$overallStatus',
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        statusCounts: {
          $push: {
            status: '$_id',
            count: '$count'
          }
        },
        total: { $sum: '$count' }
      }
    }
  ]);
};

QCRunSchema.statics.getViolationTrends = async function(testId: mongoose.Types.ObjectId, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        testId: testId,
        runDate: { $gte: startDate }
      }
    },
    { $unwind: '$results' },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$runDate' } },
          parameter: '$results.parameterName'
        },
        violations: {
          $sum: {
            $cond: [{ $eq: ['$results.status', 'OUT_OF_CONTROL'] }, 1, 0]
          }
        },
        warnings: {
          $sum: {
            $cond: [{ $eq: ['$results.status', 'WARNING'] }, 1, 0]
          }
        },
        total: { $sum: 1 }
      }
    },
    { $sort: { '_id.date': 1 } }
  ]);
};

// Export interface for static methods
interface IQCRunModel extends Model<IQCRun> {
  findByRunId(runId: string): Promise<IQCRun | null>;
  findByTest(testId: mongoose.Types.ObjectId, startDate?: Date, endDate?: Date): Promise<IQCRun[]>;
  findByEquipment(equipmentId: mongoose.Types.ObjectId, startDate?: Date, endDate?: Date): Promise<IQCRun[]>;
  findByStatus(status: string, startDate?: Date, endDate?: Date): Promise<IQCRun[]>;
  findByShift(shift: string, date: Date): Promise<IQCRun[]>;
  getQCStatsByDateRange(startDate: Date, endDate: Date, testId?: mongoose.Types.ObjectId): Promise<any>;
  getViolationTrends(testId: mongoose.Types.ObjectId, days?: number): Promise<any>;
}

// Create and export model
const QCRun: IQCRunModel = (mongoose.models.QCRun as IQCRunModel) || 
  mongoose.model<IQCRun, IQCRunModel>('QCRun', QCRunSchema);

export default QCRun;
