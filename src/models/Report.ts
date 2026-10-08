import mongoose, { Document, Model, Schema } from 'mongoose';
import { ReportStatus } from '@/lib/validation';

export interface IReportSignature {
  userId: mongoose.Types.ObjectId;
  name: string;
  role: string;
  signedAt: Date;
  digitalSignature?: string;
}

export interface IReportEvent {
  event: string;
  timestamp: Date;
  userId: mongoose.Types.ObjectId;
  notes?: string;
}

export interface IReport extends Document {
  _id: mongoose.Types.ObjectId;
  reportId: string; // Human-readable unique ID
  orderId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  testResults: mongoose.Types.ObjectId[]; // Array of TestResult IDs
  status: ReportStatus;
  generatedAt?: Date;
  generatedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  publishedAt?: Date;
  publishedBy?: mongoose.Types.ObjectId;
  downloadedAt?: Date[];
  downloadedBy?: mongoose.Types.ObjectId[];
  signatures: IReportSignature[];
  template?: string;
  pdfUrl?: string;
  version: number;
  previousVersion?: mongoose.Types.ObjectId;
  amendmentReason?: string;
  events: IReportEvent[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSignatureSchema = new Schema<IReportSignature>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  signedAt: {
    type: Date,
    default: Date.now,
  },
  digitalSignature: {
    type: String,
  },
}, { _id: false });

const ReportEventSchema = new Schema<IReportEvent>({
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

const ReportSchema = new Schema<IReport>({
  reportId: {
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
  testResults: [{
    type: Schema.Types.ObjectId,
    ref: 'TestResult',
  }],
  status: {
    type: String,
    enum: Object.values(ReportStatus),
    default: ReportStatus.DRAFT,
    index: true,
  },
  generatedAt: {
    type: Date,
    index: true,
  },
  generatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  verifiedAt: {
    type: Date,
    index: true,
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  publishedAt: {
    type: Date,
    index: true,
  },
  publishedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  downloadedAt: [{
    type: Date,
  }],
  downloadedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  signatures: [ReportSignatureSchema],
  template: {
    type: String,
    default: 'standard',
  },
  pdfUrl: {
    type: String,
  },
  version: {
    type: Number,
    default: 1,
  },
  previousVersion: {
    type: Schema.Types.ObjectId,
    ref: 'Report',
  },
  amendmentReason: {
    type: String,
  },
  events: [ReportEventSchema],
  notes: {
    type: String,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
ReportSchema.index({ reportId: 1 });
ReportSchema.index({ orderId: 1 });
ReportSchema.index({ patientId: 1 });
ReportSchema.index({ status: 1 });
ReportSchema.index({ generatedAt: -1 });
ReportSchema.index({ publishedAt: -1 });
ReportSchema.index({ createdAt: -1 });

// Pre-save middleware to generate reportId
ReportSchema.pre('save', async function(next) {
  if (this.isNew && !this.reportId) {
    const count = await mongoose.model('Report').countDocuments();
    this.reportId = `RPT-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;
  }
  next();
});

// Instance methods
ReportSchema.methods.addEvent = function(event: string, userId: mongoose.Types.ObjectId, notes?: string) {
  this.events.push({
    event,
    userId,
    notes,
    timestamp: new Date(),
  });
  return this.save();
};

ReportSchema.methods.generate = function(userId: mongoose.Types.ObjectId, pdfUrl?: string) {
  this.status = ReportStatus.GENERATED;
  this.generatedBy = userId;
  this.generatedAt = new Date();
  if (pdfUrl) {
    this.pdfUrl = pdfUrl;
  }
  this.addEvent('Report generated', userId);
  return this.save();
};

ReportSchema.methods.verify = function(userId: mongoose.Types.ObjectId, userName: string, userRole: string) {
  this.status = ReportStatus.VERIFIED;
  this.verifiedBy = userId;
  this.verifiedAt = new Date();
  
  // Add signature
  this.signatures.push({
    userId,
    name: userName,
    role: userRole,
    signedAt: new Date(),
  });
  
  this.addEvent('Report verified and signed', userId);
  return this.save();
};

ReportSchema.methods.publish = function(userId: mongoose.Types.ObjectId) {
  this.status = ReportStatus.PUBLISHED;
  this.publishedBy = userId;
  this.publishedAt = new Date();
  this.addEvent('Report published', userId);
  return this.save();
};

ReportSchema.methods.recordDownload = function(userId: mongoose.Types.ObjectId) {
  if (!this.downloadedAt) {
    this.downloadedAt = [];
  }
  if (!this.downloadedBy) {
    this.downloadedBy = [];
  }
  
  this.downloadedAt.push(new Date());
  this.downloadedBy.push(userId);
  
  if (this.status === ReportStatus.PUBLISHED) {
    this.status = ReportStatus.DOWNLOADED;
  }
  
  this.addEvent('Report downloaded', userId);
  return this.save();
};

ReportSchema.methods.amend = function(userId: mongoose.Types.ObjectId, reason: string) {
  // Create a copy reference
  const previousVersionId = this._id;
  
  this.status = ReportStatus.AMENDED;
  this.version += 1;
  this.previousVersion = previousVersionId;
  this.amendmentReason = reason;
  
  // Clear verification and publication
  this.verifiedAt = undefined;
  this.verifiedBy = undefined;
  this.publishedAt = undefined;
  this.publishedBy = undefined;
  
  this.addEvent(`Report amended: ${reason}`, userId);
  return this.save();
};

ReportSchema.methods.revoke = function(userId: mongoose.Types.ObjectId, reason: string) {
  this.status = ReportStatus.REVOKED;
  this.addEvent(`Report revoked: ${reason}`, userId);
  return this.save();
};

// Static methods
ReportSchema.statics.findByReportId = function(reportId: string) {
  return this.findOne({ reportId })
    .populate('orderId')
    .populate('patientId')
    .populate('testResults')
    .populate('generatedBy')
    .populate('verifiedBy')
    .populate('publishedBy');
};

ReportSchema.statics.findByOrder = function(orderId: mongoose.Types.ObjectId) {
  return this.find({ orderId })
    .populate('testResults')
    .sort({ version: -1, createdAt: -1 });
};

ReportSchema.statics.findByPatient = function(patientId: mongoose.Types.ObjectId) {
  return this.find({ patientId })
    .populate('orderId')
    .populate('testResults')
    .sort({ createdAt: -1 });
};

ReportSchema.statics.findPublished = function() {
  return this.find({
    status: { $in: [ReportStatus.PUBLISHED, ReportStatus.DOWNLOADED] }
  })
    .populate('patientId')
    .populate('orderId')
    .sort({ publishedAt: -1 });
};

ReportSchema.statics.findPendingVerification = function() {
  return this.find({
    status: ReportStatus.GENERATED
  })
    .populate('patientId')
    .populate('orderId')
    .populate('generatedBy')
    .sort({ generatedAt: 1 });
};

// Export interface for static methods
interface IReportModel extends Model<IReport> {
  findByReportId(reportId: string): Promise<IReport | null>;
  findByOrder(orderId: mongoose.Types.ObjectId): Promise<IReport[]>;
  findByPatient(patientId: mongoose.Types.ObjectId): Promise<IReport[]>;
  findPublished(): Promise<IReport[]>;
  findPendingVerification(): Promise<IReport[]>;
}

// Create and export model
const Report: IReportModel = (mongoose.models.Report as IReportModel) || 
  mongoose.model<IReport, IReportModel>('Report', ReportSchema);

export default Report;
