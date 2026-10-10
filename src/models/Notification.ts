import mongoose, { Document, Model, Schema } from 'mongoose';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  notificationId: string; // Human-readable unique ID
  type: 'REPORT_READY' | 'CRITICAL_RESULT' | 'ORDER_CONFIRMATION' | 'PAYMENT_RECEIPT' | 'SAMPLE_COLLECTION' | 'PASSWORD_RESET' | 'WELCOME' | 'CUSTOM';
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP';
  recipientId: mongoose.Types.ObjectId; // User or Patient ID
  recipientEmail?: string;
  recipientPhone?: string;
  subject: string;
  content: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'READ';
  sentAt?: Date;
  readAt?: Date;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
  relatedEntityType?: 'ORDER' | 'REPORT' | 'INVOICE' | 'PAYMENT' | 'SAMPLE' | 'TEST_RESULT';
  relatedEntityId?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  notificationId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['REPORT_READY', 'CRITICAL_RESULT', 'ORDER_CONFIRMATION', 'PAYMENT_RECEIPT', 'SAMPLE_COLLECTION', 'PASSWORD_RESET', 'WELCOME', 'CUSTOM'],
    required: true,
    index: true,
  },
  channel: {
    type: String,
    enum: ['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP'],
    required: true,
    index: true,
  },
  recipientId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  recipientEmail: {
    type: String,
    lowercase: true,
  },
  recipientPhone: {
    type: String,
  },
  subject: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'SENT', 'FAILED', 'READ'],
    default: 'PENDING',
    index: true,
  },
  sentAt: {
    type: Date,
    index: true,
  },
  readAt: {
    type: Date,
  },
  failureReason: {
    type: String,
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  maxRetries: {
    type: Number,
    default: 3,
  },
  relatedEntityType: {
    type: String,
    enum: ['ORDER', 'REPORT', 'INVOICE', 'PAYMENT', 'SAMPLE', 'TEST_RESULT'],
    index: true,
  },
  relatedEntityId: {
    type: Schema.Types.ObjectId,
    index: true,
  },
  metadata: {
    type: Schema.Types.Mixed,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
NotificationSchema.index({ notificationId: 1 });
NotificationSchema.index({ recipientId: 1, status: 1 });
NotificationSchema.index({ type: 1, status: 1 });
NotificationSchema.index({ channel: 1, status: 1 });
NotificationSchema.index({ status: 1, createdAt: -1 });
NotificationSchema.index({ relatedEntityType: 1, relatedEntityId: 1 });
NotificationSchema.index({ sentAt: -1 });

// Compound indexes
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, recipientId: 1 });

// Pre-save middleware to generate notificationId
NotificationSchema.pre('save', async function() {
  if (this.isNew && !this.notificationId) {
    const count = await mongoose.model('Notification').countDocuments();
    this.notificationId = `NOTIF-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;
  }
});

// Instance methods
NotificationSchema.methods.markAsSent = function() {
  this.status = 'SENT';
  this.sentAt = new Date();
  return this.save();
};

NotificationSchema.methods.markAsFailed = function(reason: string) {
  this.status = 'FAILED';
  this.failureReason = reason;
  this.retryCount += 1;
  return this.save();
};

NotificationSchema.methods.markAsRead = function() {
  this.status = 'READ';
  this.readAt = new Date();
  return this.save();
};

NotificationSchema.methods.canRetry = function(): boolean {
  return this.status === 'FAILED' && this.retryCount < this.maxRetries;
};

// Static methods
NotificationSchema.statics.findByRecipient = function(recipientId: mongoose.Types.ObjectId, status?: string) {
  const query: any = { recipientId };
  if (status) {
    query.status = status;
  }
  return this.find(query).sort({ createdAt: -1 });
};

NotificationSchema.statics.findPending = function(channel?: string) {
  const query: any = { status: 'PENDING' };
  if (channel) {
    query.channel = channel;
  }
  return this.find(query).sort({ createdAt: 1 });
};

NotificationSchema.statics.findFailed = function(canRetry: boolean = true) {
  const query: any = { status: 'FAILED' };
  if (canRetry) {
    query.$expr = { $lt: ['$retryCount', '$maxRetries'] };
  }
  return this.find(query).sort({ createdAt: 1 });
};

NotificationSchema.statics.findByEntity = function(
  entityType: string,
  entityId: mongoose.Types.ObjectId
) {
  return this.find({
    relatedEntityType: entityType,
    relatedEntityId: entityId,
  }).sort({ createdAt: -1 });
};

NotificationSchema.statics.getStats = async function(startDate?: Date, endDate?: Date) {
  const match: any = {};
  if (startDate && endDate) {
    match.createdAt = { $gte: startDate, $lte: endDate };
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: { channel: '$channel', status: '$status' },
        count: { $sum: 1 },
      }
    },
    {
      $group: {
        _id: '$_id.channel',
        stats: {
          $push: {
            status: '$_id.status',
            count: '$count',
          }
        },
        total: { $sum: '$count' },
      }
    }
  ]);

  return stats;
};

// Export interface for static methods
interface INotificationModel extends Model<INotification> {
  findByRecipient(recipientId: mongoose.Types.ObjectId, status?: string): Promise<INotification[]>;
  findPending(channel?: string): Promise<INotification[]>;
  findFailed(canRetry?: boolean): Promise<INotification[]>;
  findByEntity(entityType: string, entityId: mongoose.Types.ObjectId): Promise<INotification[]>;
  getStats(startDate?: Date, endDate?: Date): Promise<any>;
}

// Create and export model
const Notification: INotificationModel = (mongoose.models.Notification as INotificationModel) || 
  mongoose.model<INotification, INotificationModel>('Notification', NotificationSchema);

export default Notification;
