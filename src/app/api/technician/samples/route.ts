import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import Sample from '@/models/Sample'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has TECHNICIAN role
    if (!['TECHNICIAN', 'ADMIN', 'LAB_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const priority = searchParams.get('priority')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build filter
    const filter: any = {}
    
    if (status !== 'all') {
      filter.status = status
    } else {
      // By default, show samples that need processing
      filter.status = { $in: ['collected', 'processing'] }
    }

    if (priority) {
      filter.priority = priority
    }

    // If technician, show only their assigned samples or unassigned
    if (session.user.role === 'TECHNICIAN') {
      filter.$or = [
        { assignedTo: session.user.id },
        { assignedTo: { $exists: false } }
      ]
    }

    const samples = await Sample.find(filter)
      .populate('patient', 'name patientId age gender phone')
      .populate('order', 'orderId')
      .populate('assignedTo', 'name email')
      .populate('collectedBy', 'name')
      .sort({ priority: 1, collectionDate: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    const total = await Sample.countDocuments(filter)

    // Get counts by status
    const statusCounts = await Sample.aggregate([
      {
        $match: session.user.role === 'TECHNICIAN' 
          ? {
              $or: [
                { assignedTo: session.user.id },
                { assignedTo: { $exists: false } }
              ]
            }
          : {}
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    return NextResponse.json({
      success: true,
      data: samples,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      statusCounts: statusCounts.reduce((acc, { _id, count }) => {
        acc[_id] = count
        return acc
      }, {} as Record<string, number>)
    })
  } catch (error) {
    console.error('Technician samples error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch samples' },
      { status: 500 }
    )
  }
}
