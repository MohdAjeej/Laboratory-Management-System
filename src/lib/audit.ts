import mongoose from 'mongoose';
import connectToDatabase from './mongodb';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VERIFY = 'VERIFY',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  DOWNLOAD = 'DOWNLOAD',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  REPORT_GENERATED = 'REPORT_GENERATED',
  REPORT_PUBLISHED = 'REPORT_PUBLISHED',
  RESULT_CHANGED = 'RESULT_CHANGED',
  RESULT_VERIFIED = 'RESULT_VERIFIED',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  SAMPLE_COLLECTED = 'SAMPLE_COLLECTED',
  SAMPLE_RECEIVED = 'SAMPLE_RECEIVED',
  SAMPLE_REJECTED = 'SAMPLE_REJECTED',
  STATUS_CHANGED = 'STATUS_CHANGED',
}

export interface IAuditLog {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userRole: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  description: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

const AuditLogSchema = new mongoose.Schema<IAuditLog>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  userRole: {
    type: String,
    required: true,
    index: true,
  },
  action: {
    type: String,
    enum: Object.values(AuditAction),
    required: true,
    index: true,
  },
  entity: {
    type: String,
    required: true,
    index: true,
  },
  entityId: {
    type: String,
    required: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
  },
  oldValue: {
    type: mongoose.Schema.Types.Mixed,
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  sessionId: {
    type: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: false, // We use our own timestamp field
  collection: 'auditlogs',
});

// Indexes for efficient querying
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ entity: 1, entityId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 }); // For general queries

// Create model
const AuditLog = (mongoose.models.AuditLog as mongoose.Model<IAuditLog>) || 
  mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export interface CreateAuditLogParams {
  userId: mongoose.Types.ObjectId | string;
  userRole: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  description: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

// Create audit log entry
export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    await connectToDatabase();
    
    const auditEntry = new AuditLog({
      ...params,
      timestamp: new Date(),
    });
    
    await auditEntry.save();
  } catch (error) {
    // Log the error but don't throw - audit logging should not break the main flow
    console.error('Failed to create audit log:', error);
  }
}

// Convenience function for user actions
export async function auditUserAction(
  userId: mongoose.Types.ObjectId | string,
  userRole: string,
  action: AuditAction,
  entity: string,
  entityId: string,
  description: string,
  metadata?: Record<string, any>
): Promise<void> {
  return createAuditLog({
    userId,
    userRole,
    action,
    entity,
    entityId,
    description,
    metadata,
  });
}

// Convenience function for data changes
export async function auditDataChange(
  userId: mongoose.Types.ObjectId | string,
  userRole: string,
  action: AuditAction,
  entity: string,
  entityId: string,
  description: string,
  oldValue?: any,
  newValue?: any,
  metadata?: Record<string, any>
): Promise<void> {
  return createAuditLog({
    userId,
    userRole,
    action,
    entity,
    entityId,
    description,
    oldValue,
    newValue,
    metadata,
  });
}

// Get audit logs for a specific entity
export async function getEntityAuditLogs(
  entity: string,
  entityId: string,
  limit: number = 50
): Promise<IAuditLog[]> {
  try {
    await connectToDatabase();
    
    return await AuditLog
      .find({ entity, entityId })
      .populate('userId', 'firstName lastName email')
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    console.error('Failed to fetch entity audit logs:', error);
    return [];
  }
}

// Get audit logs for a specific user
export async function getUserAuditLogs(
  userId: mongoose.Types.ObjectId | string,
  limit: number = 100
): Promise<IAuditLog[]> {
  try {
    await connectToDatabase();
    
    return await AuditLog
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    console.error('Failed to fetch user audit logs:', error);
    return [];
  }
}

// Get recent audit logs
export async function getRecentAuditLogs(
  limit: number = 100,
  filters?: {
    actions?: AuditAction[];
    entities?: string[];
    startDate?: Date;
    endDate?: Date;
  }
): Promise<IAuditLog[]> {
  try {
    await connectToDatabase();
    
    const query: any = {};
    
    if (filters?.actions && filters.actions.length > 0) {
      query.action = { $in: filters.actions };
    }
    
    if (filters?.entities && filters.entities.length > 0) {
      query.entity = { $in: filters.entities };
    }
    
    if (filters?.startDate || filters?.endDate) {
      query.timestamp = {};
      if (filters.startDate) {
        query.timestamp.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.timestamp.$lte = filters.endDate;
      }
    }
    
    return await AuditLog
      .find(query)
      .populate('userId', 'firstName lastName email role')
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    console.error('Failed to fetch recent audit logs:', error);
    return [];
  }
}

// Get audit statistics
export async function getAuditStatistics(
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalActions: number;
  actionBreakdown: Record<string, number>;
  entityBreakdown: Record<string, number>;
  userBreakdown: Record<string, number>;
}> {
  try {
    await connectToDatabase();
    
    const matchStage: any = {};
    
    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) matchStage.timestamp.$gte = startDate;
      if (endDate) matchStage.timestamp.$lte = endDate;
    }
    
    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $facet: {
          totalActions: [{ $count: 'count' }],
          actionBreakdown: [
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          entityBreakdown: [
            { $group: { _id: '$entity', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          userBreakdown: [
            { $group: { _id: '$userId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ];
    
    const result = await AuditLog.aggregate(pipeline);
    const data = result[0];
    
    return {
      totalActions: data.totalActions[0]?.count || 0,
      actionBreakdown: data.actionBreakdown.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      entityBreakdown: data.entityBreakdown.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      userBreakdown: data.userBreakdown.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    };
  } catch (error) {
    console.error('Failed to fetch audit statistics:', error);
    return {
      totalActions: 0,
      actionBreakdown: {},
      entityBreakdown: {},
      userBreakdown: {},
    };
  }
}

export default AuditLog;