import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import Equipment from '@/models/Equipment'
import AuditLog from '@/models/AuditLog'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const { type, description, date, nextDue } = await request.json()

    // Validate required fields
    if (!type || !description || !date) {
      return NextResponse.json(
        { error: 'Type, description, and date are required' },
        { status: 400 }
      )
    }

    // Find equipment
    const equipment = await Equipment.findById(params.id)
    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
    }

    // Create maintenance record
    const maintenanceRecord = {
      date: new Date(date),
      type,
      description,
      performedBy: session.user.id,
      nextDue: nextDue ? new Date(nextDue) : undefined
    }

    // Initialize maintenanceHistory if it doesn't exist
    if (!equipment.maintenanceHistory) {
      equipment.maintenanceHistory = []
    }

    equipment.maintenanceHistory.push(maintenanceRecord)
    equipment.lastMaintenanceDate = new Date(date)
    
    if (nextDue) {
      equipment.nextMaintenanceDate = new Date(nextDue)
    }

    // Update status if it was in maintenance and repair is complete
    if (equipment.status === 'maintenance' && type === 'repair') {
      equipment.status = 'operational'
    }

    await equipment.save()

    // Create audit log
    await AuditLog.create({
      user: session.user.id,
      action: 'equipment_maintenance_recorded',
      resource: 'equipment',
      resourceId: equipment._id,
      details: {
        equipmentName: equipment.name,
        maintenanceType: type,
        description
      }
    })

    return NextResponse.json({
      success: true,
      data: equipment
    })
  } catch (error) {
    console.error('Equipment maintenance error:', error)
    return NextResponse.json(
      { error: 'Failed to record maintenance' },
      { status: 500 }
    )
  }
}
