import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { getRecentAuditLogs, getAuditStatistics } from '@/lib/audit';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission } from '@/lib/permissions';

// GET /api/audit-logs — List audit logs with filters
export const GET = withPermissionAuth(
  [Permission.VIEW_AUDIT_LOG],
  true,
  async (request: NextRequest) => {
    try {
      await connectToDatabase();

      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const action = searchParams.get('action') || '';
      const entityType = searchParams.get('entityType') || '';
      const userId = searchParams.get('userId') || '';
      const fromDate = searchParams.get('fromDate') || '';
      const toDate = searchParams.get('toDate') || '';
      const view = searchParams.get('view') || 'logs'; // logs | stats

      if (view === 'stats') {
        const stats = await getAuditStatistics();
        return NextResponse.json({ success: true, data: { stats } });
      }

      // Build filter
      const filter: any = {};
      if (action) filter.action = action;
      if (entityType) filter.entityType = entityType;
      if (userId) filter.userId = userId;
      if (fromDate || toDate) {
        filter.timestamp = {};
        if (fromDate) filter.timestamp.$gte = new Date(fromDate);
        if (toDate) filter.timestamp.$lte = new Date(toDate);
      }

      const skip = (page - 1) * limit;

      const mongoose = (await import('mongoose')).default;
      const db = mongoose.connection.db;
      if (!db) {
        return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
      }

      const auditCollection = db.collection('audit_logs');

      const [logs, total] = await Promise.all([
        auditCollection
          .find(filter)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        auditCollection.countDocuments(filter),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          logs,
          pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        },
      });
    } catch (error) {
      console.error('Get audit logs error:', error);
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }
  }
);
