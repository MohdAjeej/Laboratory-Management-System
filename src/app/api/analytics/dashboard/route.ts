import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import Patient from '@/models/Patient';
import Sample from '@/models/Sample';
import TestResult from '@/models/TestResult';
import Report from '@/models/Report';
import Invoice from '@/models/Invoice';
import Payment from '@/models/Payment';
import Hospital from '@/models/Hospital';
import User from '@/models/User';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission } from '@/lib/permissions';

// GET /api/analytics/dashboard — Real-time stats
export const GET = withPermissionAuth(
  [Permission.READ_ANALYTICS],
  true,
  async (request: NextRequest) => {
    try {
      await connectToDatabase();

      const { searchParams } = new URL(request.url);
      const period = searchParams.get('period') || '30'; // days
      const hospitalId = searchParams.get('hospitalId') || '';

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const baseQuery = hospitalId ? { hospitalId } : {};
      const dateQuery = { createdAt: { $gte: daysAgo } };
      const todayQuery = { createdAt: { $gte: todayStart } };

      // Parallel aggregation queries
      const [
        totalPatients,
        newPatientsToday,
        totalOrders,
        ordersToday,
        pendingOrders,
        totalSamples,
        pendingSamples,
        pendingResults,
        pendingReports,
        revenueToday,
        revenuePeriod,
        totalHospitals,
        totalUsers,
        ordersByStatus,
        samplesByStatus,
        revenueByDay,
        topTests,
      ] = await Promise.all([
        Patient.countDocuments(),
        Patient.countDocuments(todayQuery),
        Order.countDocuments({ ...baseQuery, ...dateQuery }),
        Order.countDocuments({ ...baseQuery, ...todayQuery }),
        Order.countDocuments({ ...baseQuery, status: { $in: ['CONFIRMED', 'SAMPLE_PENDING', 'PROCESSING'] } }),
        Sample.countDocuments({ ...dateQuery }),
        Sample.countDocuments({ status: { $in: ['COLLECTED', 'RECEIVED'] } }),
        TestResult.countDocuments({ status: { $in: ['SUBMITTED'] } }),
        Report.countDocuments({ status: { $in: ['DRAFT', 'GENERATED', 'VERIFIED'] } }),
        // Revenue today
        Payment.aggregate([
          { $match: { ...todayQuery, status: 'COMPLETED' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        // Revenue for period
        Payment.aggregate([
          { $match: { ...dateQuery, status: 'COMPLETED' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Hospital.countDocuments({ isActive: true }),
        User.countDocuments({ isActive: true }),
        // Orders by status
        Order.aggregate([
          { $match: { ...baseQuery, ...dateQuery } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        // Samples by status
        Sample.aggregate([
          { $match: { ...dateQuery } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        // Revenue by day (last 7 days)
        Payment.aggregate([
          {
            $match: {
              createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
              status: 'COMPLETED',
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              total: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        // Top tests by volume
        Order.aggregate([
          { $match: { ...dateQuery } },
          { $unwind: '$items' },
          { $group: { _id: '$items.testId', count: { $sum: 1 }, revenue: { $sum: '$items.price' } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: 'tests',
              localField: '_id',
              foreignField: '_id',
              as: 'test',
            },
          },
          { $unwind: { path: '$test', preserveNullAndEmptyArrays: true } },
          { $project: { name: '$test.name', code: '$test.code', count: 1, revenue: 1 } },
        ]),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          overview: {
            totalPatients,
            newPatientsToday,
            totalOrders,
            ordersToday,
            pendingOrders,
            totalSamples,
            pendingSamples,
            pendingResults,
            pendingReports,
            revenueToday: revenueToday[0]?.total || 0,
            revenuePeriod: revenuePeriod[0]?.total || 0,
            totalHospitals,
            totalUsers,
          },
          charts: {
            ordersByStatus,
            samplesByStatus,
            revenueByDay,
            topTests,
          },
        },
      });
    } catch (error) {
      console.error('Analytics error:', error);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
  }
);
