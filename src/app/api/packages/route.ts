import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import TestPackage from '@/models/TestPackage'
import Test from '@/models/Test'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')

    const query: any = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { packageId: { $regex: search, $options: 'i' } }
      ]
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true'
    }

    const packages = await TestPackage.find(query)
      .populate('tests.testId', 'name code price')
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      data: packages
    })
  } catch (error) {
    console.error('Get packages error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (!['ADMIN', 'LAB_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectToDatabase()

    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.tests || body.tests.length === 0) {
      return NextResponse.json(
        { error: 'Name and tests are required' },
        { status: 400 }
      )
    }

    // Generate packageId if not provided
    if (!body.packageId) {
      const count = await TestPackage.countDocuments()
      body.packageId = `PKG-${String(count + 1).padStart(6, '0')}`
    }

    // Check for duplicate packageId
    const existing = await TestPackage.findOne({ packageId: body.packageId })
    if (existing) {
      return NextResponse.json(
        { error: 'Package with this ID already exists' },
        { status: 409 }
      )
    }

    // Transform tests array to match schema
    const testsData = body.tests.map((testId: string) => ({
      testId: testId,
      isOptional: false
    }))

    // Calculate total price from tests if not provided
    let totalPrice = body.price || 0
    if (!body.price && testsData.length > 0) {
      const testIds = testsData.map((t: any) => t.testId)
      const tests = await Test.find({ _id: { $in: testIds } })
      totalPrice = tests.reduce((sum, test) => sum + (test.price || 0), 0)
    }

    const packageData = {
      packageId: body.packageId,
      name: body.name,
      description: body.description || '',
      category: body.category || 'General',
      tests: testsData,
      price: totalPrice,
      discountPercentage: body.discount || 0,
      sampleType: ['Blood'], // Default
      reportDeliveryTime: 24, // Default
      isActive: body.isActive !== undefined ? body.isActive : true,
      isPopular: false,
      tags: [],
      createdBy: user.id
    }

    const newPackage = await TestPackage.create(packageData)

    return NextResponse.json({
      success: true,
      data: newPackage
    }, { status: 201 })
  } catch (error) {
    console.error('Create package error:', error)
    return NextResponse.json(
      { error: 'Failed to create package' },
      { status: 500 }
    )
  }
}
