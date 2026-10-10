import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import Inventory from '@/models/Inventory'
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

    const { type, quantity, reason } = await request.json()

    // Validate required fields
    if (!type || !quantity || !reason) {
      return NextResponse.json(
        { error: 'Type, quantity, and reason are required' },
        { status: 400 }
      )
    }

    if (!['in', 'out', 'adjustment'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid transaction type. Must be: in, out, or adjustment' },
        { status: 400 }
      )
    }

    // Find inventory item
    const item = await Inventory.findById(params.id)
    if (!item) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }

    // Calculate new quantity
    let newQuantity = item.quantity
    if (type === 'in') {
      newQuantity += quantity
    } else if (type === 'out') {
      if (item.quantity < quantity) {
        return NextResponse.json(
          { error: 'Insufficient stock' },
          { status: 400 }
        )
      }
      newQuantity -= quantity
    } else if (type === 'adjustment') {
      newQuantity = quantity // Direct adjustment
    }

    // Create transaction record
    const transaction = {
      type,
      quantity: type === 'adjustment' ? quantity - item.quantity : quantity,
      reason,
      performedBy: session.user.id,
      date: new Date(),
      balanceAfter: newQuantity
    }

    // Initialize transactions array if it doesn't exist
    if (!item.transactions) {
      item.transactions = []
    }

    item.transactions.push(transaction)
    item.quantity = newQuantity
    item.lastUpdated = new Date()

    await item.save()

    // Create audit log
    await AuditLog.create({
      user: session.user.id,
      action: 'inventory_transaction',
      resource: 'inventory',
      resourceId: item._id,
      details: {
        itemName: item.name,
        transactionType: type,
        quantity,
        reason,
        newQuantity
      }
    })

    return NextResponse.json({
      success: true,
      data: item
    })
  } catch (error) {
    console.error('Inventory transaction error:', error)
    return NextResponse.json(
      { error: 'Failed to record transaction' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const item = await Inventory.findById(params.id)
      .populate('transactions.performedBy', 'name email')
    
    if (!item) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: item.transactions || []
    })
  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
