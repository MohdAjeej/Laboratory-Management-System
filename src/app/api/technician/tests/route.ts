import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import Order from '@/models/Order'
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
    const status = searchParams.get('status') || 'pending'

    // Find samples assigned to this technician or unassigned
    let sampleFilter: any = {
      status: { $in: ['collected', 'processing'] }
    }

    if (session.user.role === 'TECHNICIAN') {
      sampleFilter.$or = [
        { assignedTo: session.user.id },
        { assignedTo: { $exists: false } }
      ]
    }

    const samples = await Sample.find(sampleFilter)
      .select('_id')
      .lean()

    const sampleIds = samples.map(s => s._id)

    // Find orders with these samples
    const orders = await Order.find({
      samples: { $in: sampleIds },
      status: { $ne: 'completed' }
    })
      .populate('patient', 'name patientId age gender')
      .populate('samples')
      .populate({
        path: 'tests.test',
        select: 'name code category department'
      })
      .sort({ createdAt: -1 })
      .lean()

    // Transform to test-centric view
    const testsList: any[] = []

    orders.forEach(order => {
      order.tests.forEach((testItem: any) => {
        // Check if test has results
        const hasResult = testItem.status === 'completed'
        
        if (status === 'pending' && hasResult) return
        if (status === 'completed' && !hasResult) return

        testsList.push({
          orderId: order.orderId,
          orderObjectId: order._id,
          patient: order.patient,
          test: testItem.test,
          testStatus: testItem.status,
          price: testItem.price,
          urgent: order.urgent,
          sampleStatus: order.samples[0]?.status,
          createdAt: order.createdAt
        })
      })
    })

    // Get counts
    const pendingCount = testsList.filter(t => t.testStatus !== 'completed').length
    const completedCount = testsList.filter(t => t.testStatus === 'completed').length

    return NextResponse.json({
      success: true,
      data: testsList,
      counts: {
        pending: pendingCount,
        completed: completedCount,
        total: testsList.length
      }
    })
  } catch (error) {
    console.error('Technician tests error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tests' },
      { status: 500 }
    )
  }
}
