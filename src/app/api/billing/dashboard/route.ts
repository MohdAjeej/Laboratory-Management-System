import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import Order from '@/models/Order'
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has ACCOUNTANT or ADMIN role
    if (!['ACCOUNTANT', 'ADMIN', 'LAB_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // day, week, month, year
    
    let startDate: Date
    let endDate: Date = new Date()

    switch (period) {
      case 'day':
        startDate = startOfDay(endDate)
        endDate = endOfDay(endDate)
        break
      case 'week':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        startDate = new Date(endDate.getFullYear(), 0, 1)
        break
      case 'month':
      default:
        startDate = startOfMonth(endDate)
        endDate = endOfMonth(endDate)
    }

    // Get hospital filter if HOSPITAL_STAFF
    const hospitalFilter = session.user.role === 'HOSPITAL_STAFF' && session.user.hospitalId
      ? { hospital: session.user.hospitalId }
      : {}

    // Total revenue for period
    const revenueData = await Order.aggregate([
      {
        $match: {
          ...hospitalFilter,
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: { $in: ['paid', 'partially_paid'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          paidAmount: { $sum: '$paidAmount' },
          count: { $sum: 1 }
        }
      }
    ])

    // Pending payments
    const pendingData = await Order.aggregate([
      {
        $match: {
          ...hospitalFilter,
          paymentStatus: 'pending'
        }
      },
      {
        $group: {
          _id: null,
          totalPending: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ])

    // Outstanding (partially paid)
    const outstandingData = await Order.aggregate([
      {
        $match: {
          ...hospitalFilter,
          paymentStatus: 'partially_paid'
        }
      },
      {
        $group: {
          _id: null,
          totalOutstanding: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } },
          count: { $sum: 1 }
        }
      }
    ])

    // Revenue by payment method
    const paymentMethodBreakdown = await Order.aggregate([
      {
        $match: {
          ...hospitalFilter,
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: { $in: ['paid', 'partially_paid'] }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$paidAmount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { total: -1 }
      }
    ])

    // Top revenue generating tests
    const topTests = await Order.aggregate([
      {
        $match: {
          ...hospitalFilter,
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: { $in: ['paid', 'partially_paid'] }
        }
      },
      {
        $unwind: '$tests'
      },
      {
        $lookup: {
          from: 'tests',
          localField: 'tests.test',
          foreignField: '_id',
          as: 'testInfo'
        }
      },
      {
        $unwind: '$testInfo'
      },
      {
        $group: {
          _id: '$testInfo._id',
          testName: { $first: '$testInfo.name' },
          revenue: { $sum: '$tests.price' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { revenue: -1 }
      },
      {
        $limit: 10
      }
    ])

    // Daily revenue trend for the period (last 7 days for visualization)
    const trendStartDate = subMonths(endDate, 1)
    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          ...hospitalFilter,
          createdAt: { $gte: trendStartDate, $lte: endDate },
          paymentStatus: { $in: ['paid', 'partially_paid'] }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$paidAmount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ])

    // Recent invoices
    const recentInvoices = await Order.find(hospitalFilter)
      .populate('patient', 'name patientId phone')
      .populate('hospital', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderId totalAmount paidAmount paymentStatus paymentMethod createdAt')
      .lean()

    const revenue = revenueData[0] || { totalRevenue: 0, paidAmount: 0, count: 0 }
    const pending = pendingData[0] || { totalPending: 0, count: 0 }
    const outstanding = outstandingData[0] || { totalOutstanding: 0, count: 0 }

    return NextResponse.json({
      success: true,
      data: {
        period,
        summary: {
          totalRevenue: revenue.totalRevenue,
          paidAmount: revenue.paidAmount,
          paidOrders: revenue.count,
          pendingAmount: pending.totalPending,
          pendingOrders: pending.count,
          outstandingAmount: outstanding.totalOutstanding,
          outstandingOrders: outstanding.count
        },
        paymentMethods: paymentMethodBreakdown,
        topTests,
        dailyRevenue,
        recentInvoices
      }
    })
  } catch (error) {
    console.error('Billing dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch billing data' },
      { status: 500 }
    )
  }
}
