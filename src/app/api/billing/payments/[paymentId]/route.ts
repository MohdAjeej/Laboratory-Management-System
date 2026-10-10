import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Payment from '@/models/Payment';
import Invoice from '@/models/Invoice';

export const dynamic = 'force-dynamic';

/**
 * GET /api/billing/payments/[paymentId]
 * Get payment details
 * Access: RECEPTIONIST, ADMIN, PATIENT (own payment)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { paymentId } = params;

    const payment = await Payment.findOne({ paymentId })
      .populate('patientId')
      .populate('invoiceId')
      .populate('orderId')
      .populate('receivedBy', 'firstName lastName role')
      .populate('refundedBy', 'firstName lastName role');

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Authorization check
    const patient = payment.patientId as any;
    const isOwnPayment = auth.user.role === 'PATIENT' && patient._id.toString() === auth.user.id.toString();
    const isAuthorized = ['RECEPTIONIST', 'ADMIN'].includes(auth.user.role) || isOwnPayment;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'You do not have permission to access this payment' },
        { status: 403 }
      );
    }

    const invoice = payment.invoiceId as any;
    const order = payment.orderId as any;
    const receivedBy = payment.receivedBy as any;
    const refundedBy = payment.refundedBy as any;

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.paymentId,
        _id: payment._id,
        invoiceId: invoice?.invoiceId,
        invoiceMongoId: invoice?._id,
        orderId: order?.orderId,
        patient: {
          name: `${patient.firstName} ${patient.lastName}`,
          patientId: patient.patientId,
          phone: patient.phone,
        },
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        transactionId: payment.transactionId,
        transactionDate: payment.transactionDate,
        paymentDetails: {
          cardLast4: payment.cardLast4,
          upiId: payment.upiId,
          chequeNumber: payment.chequeNumber,
          bankName: payment.bankName,
        },
        receivedBy: receivedBy ? `${receivedBy.firstName} ${receivedBy.lastName}` : null,
        refund: payment.status === 'REFUNDED' ? {
          amount: payment.refundAmount,
          date: payment.refundDate,
          reason: payment.refundReason,
          refundedBy: refundedBy ? `${refundedBy.firstName} ${refundedBy.lastName}` : null,
        } : null,
        notes: payment.notes,
        events: payment.events,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get payment error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve payment' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/billing/payments/[paymentId]
 * Update payment or perform actions (refund, cancel)
 * Access: ADMIN (refunds require admin)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || auth.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Only admins can modify payments.' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const { paymentId } = params;
    const body = await req.json();
    const { action, amount, reason } = body;

    const payment = await Payment.findOne({ paymentId })
      .populate('invoiceId');

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (action === 'refund') {
      if (payment.status !== 'COMPLETED') {
        return NextResponse.json(
          { error: 'Only completed payments can be refunded' },
          { status: 400 }
        );
      }

      if (!amount || amount <= 0) {
        return NextResponse.json(
          { error: 'Refund amount must be greater than zero' },
          { status: 400 }
        );
      }

      if (amount > payment.amount) {
        return NextResponse.json(
          { error: 'Refund amount cannot exceed payment amount' },
          { status: 400 }
        );
      }

      if (!reason) {
        return NextResponse.json(
          { error: 'Refund reason is required' },
          { status: 400 }
        );
      }

      // Refund payment
      await payment.refund(auth.user.id, amount, reason);

      // Update invoice
      const invoice = payment.invoiceId as any;
      if (invoice) {
        invoice.amountPaid -= amount;
        invoice.amountDue += amount;
        
        if (invoice.status === 'PAID' && invoice.amountDue > 0) {
          invoice.status = 'PARTIALLY_PAID';
          invoice.paidDate = undefined;
        }
        
        await invoice.save();
        await invoice.addEvent(`Payment refunded: ₹${amount}`, auth.user.id, reason);
      }

      return NextResponse.json({
        success: true,
        message: 'Payment refunded successfully',
        data: {
          paymentId: payment.paymentId,
          status: payment.status,
          refundAmount: payment.refundAmount,
          refundDate: payment.refundDate,
          invoice: invoice ? {
            invoiceId: invoice.invoiceId,
            amountPaid: invoice.amountPaid,
            amountDue: invoice.amountDue,
            status: invoice.status,
          } : null,
        },
      });
    } else if (action === 'cancel') {
      if (payment.status === 'REFUNDED') {
        return NextResponse.json(
          { error: 'Cannot cancel a refunded payment' },
          { status: 400 }
        );
      }

      await payment.cancel(auth.user.id, reason);

      // If payment was completed, reverse it from invoice
      if (payment.status === 'COMPLETED') {
        const invoice = payment.invoiceId as any;
        if (invoice) {
          invoice.amountPaid -= payment.amount;
          invoice.amountDue += payment.amount;
          
          if (invoice.status === 'PAID') {
            invoice.status = 'PARTIALLY_PAID';
            invoice.paidDate = undefined;
          }
          
          await invoice.save();
          await invoice.addEvent('Payment cancelled', auth.user.id, reason);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Payment cancelled successfully',
        data: {
          paymentId: payment.paymentId,
          status: payment.status,
        },
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Update payment error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}
