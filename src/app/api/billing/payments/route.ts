import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Payment from '@/models/Payment';
import Invoice from '@/models/Invoice';
import Order from '@/models/Order';

export const dynamic = 'force-dynamic';

/**
 * POST /api/billing/payments
 * Record a payment for an invoice
 * Access: RECEPTIONIST, ADMIN
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || !['RECEPTIONIST', 'ADMIN'].includes(auth.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only receptionists and admins can record payments.' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const body = await req.json();
    const {
      invoiceId,
      amount,
      method,
      transactionId,
      cardLast4,
      upiId,
      chequeNumber,
      bankName,
      notes,
    } = body;

    // Validation
    if (!invoiceId || !amount || !method) {
      return NextResponse.json(
        { error: 'Invoice ID, amount, and payment method are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Payment amount must be greater than zero' },
        { status: 400 }
      );
    }

    const validMethods = ['CASH', 'CARD', 'UPI', 'NET_BANKING', 'CHEQUE', 'WALLET', 'OTHER'];
    if (!validMethods.includes(method)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Find invoice
    const invoice = await Invoice.findById(invoiceId)
      .populate('orderId')
      .populate('patientId');

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (['CANCELLED', 'REFUNDED'].includes(invoice.status)) {
      return NextResponse.json(
        { error: 'Cannot record payment for cancelled or refunded invoice' },
        { status: 400 }
      );
    }

    if (invoice.amountDue <= 0) {
      return NextResponse.json(
        { error: 'Invoice is already fully paid' },
        { status: 400 }
      );
    }

    // Check if payment amount exceeds amount due
    if (amount > invoice.amountDue) {
      return NextResponse.json(
        { 
          error: 'Payment amount exceeds amount due',
          amountDue: invoice.amountDue 
        },
        { status: 400 }
      );
    }

    const order = invoice.orderId as any;
    const patient = invoice.patientId as any;

    // Create payment record
    const payment = new Payment({
      invoiceId: invoice._id,
      orderId: order._id,
      patientId: patient._id,
      amount: amount,
      method: method,
      status: 'COMPLETED',
      transactionId: transactionId,
      cardLast4: cardLast4,
      upiId: upiId,
      chequeNumber: chequeNumber,
      bankName: bankName,
      notes: notes,
      receivedBy: auth.user.id,
    });

    await payment.save();
    await payment.addEvent('Payment recorded', auth.user.id);

    // Update invoice
    await invoice.recordPayment(amount, auth.user.id);

    // Update order payment status
    if (invoice.status === 'PAID') {
      order.paymentStatus = 'PAID';
    } else if (invoice.status === 'PARTIALLY_PAID') {
      order.paymentStatus = 'PARTIALLY_PAID';
    }
    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        paymentId: payment.paymentId,
        _id: payment._id,
        invoiceId: invoice.invoiceId,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        transactionId: payment.transactionId,
        transactionDate: payment.transactionDate,
        invoice: {
          invoiceId: invoice.invoiceId,
          total: invoice.total,
          amountPaid: invoice.amountPaid,
          amountDue: invoice.amountDue,
          status: invoice.status,
        },
        createdAt: payment.createdAt,
      },
    });
  } catch (error) {
    console.error('Record payment error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to record payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/billing/payments
 * List payments with filters
 * Access: RECEPTIONIST, ADMIN, PATIENT (own payments)
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
    const method = searchParams.get('method');
    const patientId = searchParams.get('patientId');
    const invoiceId = searchParams.get('invoiceId');
    const orderId = searchParams.get('orderId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
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
      if (method) {
        query.method = method;
      }
      if (patientId) {
        query.patientId = patientId;
      }
      if (invoiceId) {
        const invoice = await Invoice.findOne({ invoiceId });
        if (invoice) {
          query.invoiceId = invoice._id;
        }
      }
      if (orderId) {
        query.orderId = orderId;
      }
      if (startDate || endDate) {
        query.transactionDate = {};
        if (startDate) {
          query.transactionDate.$gte = new Date(startDate);
        }
        if (endDate) {
          query.transactionDate.$lte = new Date(endDate);
        }
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('patientId', 'firstName lastName patientId phone')
        .populate('invoiceId', 'invoiceId total')
        .populate('orderId', 'orderId')
        .populate('receivedBy', 'firstName lastName')
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(query),
    ]);

    const paymentsData = payments.map((payment) => {
      const patient = payment.patientId as any;
      const invoice = payment.invoiceId as any;
      const order = payment.orderId as any;
      const receivedBy = payment.receivedBy as any;

      return {
        paymentId: payment.paymentId,
        _id: payment._id,
        invoiceId: invoice?.invoiceId,
        orderId: order?.orderId,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
        patientId: patient?.patientId,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        transactionId: payment.transactionId,
        transactionDate: payment.transactionDate,
        receivedBy: receivedBy ? `${receivedBy.firstName} ${receivedBy.lastName}` : null,
        notes: payment.notes,
        createdAt: payment.createdAt,
      };
    });

    // Get summary statistics for staff
    let summary = null;
    if (['RECEPTIONIST', 'ADMIN'].includes(auth.user.role)) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [todayTotal, totalCompleted, byMethod] = await Promise.all([
        Payment.getTotalByDateRange(today, tomorrow, 'COMPLETED'),
        Payment.getTotalByDateRange(new Date(0), new Date(), 'COMPLETED'),
        Payment.getByMethodSummary(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined),
      ]);

      summary = {
        today: todayTotal,
        total: totalCompleted,
        byMethod: byMethod,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        payments: paymentsData,
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
    console.error('List payments error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve payments' },
      { status: 500 }
    );
  }
}
