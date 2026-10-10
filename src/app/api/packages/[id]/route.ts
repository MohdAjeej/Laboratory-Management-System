import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import TestPackage from '@/models/TestPackage'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const packageData = await TestPackage.findById(params.id)
      .populate('tests.test', 'name code price category')
      .lean()

    if (!packageData) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: packageData
    })
  } catch (error) {
    console.error('Get package error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch package' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ADMIN', 'LAB_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectToDatabase()

    const body = await request.json()

    // If updating code, check for duplicates
    if (body.code) {
      body.code = body.code.toUpperCase()
      const existing = await TestPackage.findOne({
        code: body.code,
        _id: { $ne: params.id }
      })
      if (existing) {
        return NextResponse.json(
          { error: 'Package with this code already exists' },
          { status: 409 }
        )
      }
    }

    // Transform tests if provided
    if (body.tests && Array.isArray(body.tests)) {
      body.tests = body.tests.map((testId: string) => ({
        test: testId
      }))
    }

    const updatedPackage = await TestPackage.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    ).populate('tests.test', 'name code price')

    if (!updatedPackage) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: updatedPackage
    })
  } catch (error) {
    console.error('Update package error:', error)
    return NextResponse.json(
      { error: 'Failed to update package' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ADMIN', 'LAB_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectToDatabase()

    const deletedPackage = await TestPackage.findByIdAndDelete(params.id)

    if (!deletedPackage) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Package deleted successfully'
    })
  } catch (error) {
    console.error('Delete package error:', error)
    return NextResponse.json(
      { error: 'Failed to delete package' },
      { status: 500 }
    )
  }
}
