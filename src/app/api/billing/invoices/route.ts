import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import Order from '@/models/Order';
import Test from '@/models/Test';

export const dynamic = 'force-dynamic';

/**
 * POST /api/billing/invoices
 * Create invoice from order
 * Access: RECEPTIONIST, ADMIN
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || !['RECEPTIONIST', 'ADMIN'].includes(auth.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only receptionists and admins can create invoices.' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const body = await req.json();
    const { orderId, discount = 0, taxRate = 0, dueDate, notes } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Check if invoice already exists for this order
    const existingInvoice = await Invoice.findOne({
      orderId: orderId,
      status: { $nin: ['CANCELLED', 'REFUNDED'] }
    });

    if (existingInvoice) {
      return NextResponse.json(
        { 
          error: 'Invoice already exists for this order',
          invoiceId: existingInvoice.invoiceId 
        },
        { status: 400 }
      );
    }

    // Fetch order with test details
    const order = await Order.findById(orderId)
      .populate('patientId')
      .populate('items.testId');

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot create invoice for cancelled order' },
        { status: 400 }
      );
    }

    // Build invoice items from order items
    const invoiceItems = order.items.map((item: any) => {
      const test = item.testId;
      const itemSubtotal = item.price * item.quantity;
      const itemDiscount = item.discount * item.quantity;
      const afterDiscount = itemSubtotal - itemDiscount;
      const itemTaxAmount = (afterDiscount * taxRate) / 100;

      return {
        itemType: 'TEST',
        testId: test._id,
        description: test ? test.name : 'Unknown Test',
        quantity: item.quantity,
        unitPrice: item.price,
        discount: itemDiscount,
        taxRate: taxRate,
        taxAmount: itemTaxAmount,
        subtotal: itemSubtotal,
        total: afterDiscount + itemTaxAmount,
      };
    });

    // Create invoice
    const invoice = new Invoice({
      orderId: order._id,
      patientId: order.patientId,
      items: invoiceItems,
      discount: discount,
      status: 'PENDING',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes: notes,
      createdBy: auth.user.id,
    });

    await invoice.save();

    // Update order payment status
    order.paymentStatus = 'PENDING';
    await order.save();

    await invoice.addEvent('Invoice created', auth.user.id);

    return NextResponse.json({
      success: true,
      message: 'Invoice created successfully',
      data: {
        invoiceId: invoice.invoiceId,
        _id: invoice._id,
        orderId: order.orderId,
        patientName: `${(order.patientId as any).firstName} ${(order.patientId as any).lastName}`,
        subtotal: invoice.subtotal,
        discount: invoice.discount,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        amountDue: invoice.amountDue,
        status: invoice.status,
        dueDate: invoice.dueDate,
        createdAt: invoice.createdAt,
      },
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create invoice',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/billing/invoices
 * List invoices with filters
 * Access: RECEPTIONIST, ADMIN, PATIENT (own invoices)
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const patientId = searchParams.get('patientId');
    const orderId = searchParams.get('orderId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query: any = {};

    // Role-based filtering
    if (auth.user.role === 'PATIENT') {
      query.patientId = auth.user.id;
    } else if (['RECEPTIONIST', 'ADMIN'].includes(auth.user.role)) {
      if (status) {
        query.status = status;
      }
      if (patientId) {
        query.patientId = patientId;
      }
      if (orderId) {
        query.orderId = orderId;
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate('patientId', 'firstName lastName patientId phone')
        .populate('orderId', 'orderId status')
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Invoice.countDocuments(query),
    ]);

    const invoicesData = invoices.map((invoice) => {
      const patient = invoice.patientId as any;
      const order = invoice.orderId as any;
      const createdBy = invoice.createdBy as any;

      return {
        invoiceId: invoice.invoiceId,
        _id: invoice._id,
        orderId: order?.orderId,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
        patientId: patient?.patientId,
        patientPhone: patient?.phone,
        subtotal: invoice.subtotal,
        discount: invoice.discount,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        amountPaid: invoice.amountPaid,
        amountDue: invoice.amountDue,
        status: invoice.status,
        paymentProgress: (invoice as any).paymentProgress,
        dueDate: invoice.dueDate,
        paidDate: invoice.paidDate,
        createdBy: createdBy ? `${createdBy.firstName} ${createdBy.lastName}` : null,
        createdAt: invoice.createdAt,
      };
    });

    // Get summary statistics for staff
    let summary = null;
    if (['RECEPTIONIST', 'ADMIN'].includes(auth.user.role)) {
      const summaryQuery = patientId ? { patientId } : {};
      const [pending, overdue, paid] = await Promise.all([
        Invoice.countDocuments({ ...summaryQuery, status: { $in: ['PENDING', 'PARTIALLY_PAID'] } }),
        Invoice.countDocuments({ ...summaryQuery, status: 'OVERDUE' }),
        Invoice.countDocuments({ ...summaryQuery, status: 'PAID' }),
      ]);

      summary = {
        pending,
        overdue,
        paid,
        total: pending + overdue + paid,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        invoices: invoicesData,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        summary,
      },
    });
  } catch (error) {
    console.error('List invoices error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve invoices' },
      { status: 500 }
    );
  }
}
