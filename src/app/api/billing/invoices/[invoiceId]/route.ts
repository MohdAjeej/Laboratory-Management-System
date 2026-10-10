import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Invoice from '@/models/Invoice';

export const dynamic = 'force-dynamic';

/**
 * GET /api/billing/invoices/[invoiceId]
 * Get invoice details
 * Access: RECEPTIONIST, ADMIN, PATIENT (own invoice)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { invoiceId } = params;

    const invoice = await Invoice.findOne({ invoiceId })
      .populate('patientId')
      .populate('orderId')
      .populate('items.testId', 'name code category')
      .populate('createdBy', 'firstName lastName');

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Authorization check
    const patient = invoice.patientId as any;
    const isOwnInvoice = auth.user.role === 'PATIENT' && patient._id.toString() === auth.user.id.toString();
    const isAuthorized = ['RECEPTIONIST', 'ADMIN'].includes(auth.user.role) || isOwnInvoice;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'You do not have permission to access this invoice' },
        { status: 403 }
      );
    }

    const order = invoice.orderId as any;
    const createdBy = invoice.createdBy as any;

    return NextResponse.json({
      success: true,
      data: {
        invoiceId: invoice.invoiceId,
        _id: invoice._id,
        orderId: order.orderId,
        orderMongoId: order._id,
        patient: {
          name: `${patient.firstName} ${patient.lastName}`,
          patientId: patient.patientId,
          phone: patient.phone,
          email: patient.email,
        },
        items: invoice.items.map((item: any) => ({
          itemType: item.itemType,
          testName: item.testId?.name || item.description,
          testCode: item.testId?.code,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          subtotal: item.subtotal,
          total: item.total,
        })),
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
        notes: invoice.notes,
        createdBy: createdBy ? `${createdBy.firstName} ${createdBy.lastName}` : null,
        events: invoice.events,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve invoice' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/billing/invoices/[invoiceId]
 * Update invoice or perform actions (cancel, refund)
 * Access: RECEPTIONIST, ADMIN
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || !['RECEPTIONIST', 'ADMIN'].includes(auth.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const { invoiceId } = params;
    const body = await req.json();
    const { action, reason, discount, notes, dueDate } = body;

    const invoice = await Invoice.findOne({ invoiceId });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (action === 'cancel') {
      if (invoice.status === 'PAID') {
        return NextResponse.json(
          { error: 'Cannot cancel a paid invoice. Please refund instead.' },
          { status: 400 }
        );
      }

      await invoice.cancel(auth.user.id, reason);

      return NextResponse.json({
        success: true,
        message: 'Invoice cancelled successfully',
        data: {
          invoiceId: invoice.invoiceId,
          status: invoice.status,
        },
      });
    } else if (action === 'refund') {
      if (invoice.status !== 'PAID' && invoice.amountPaid === 0) {
        return NextResponse.json(
          { error: 'Cannot refund an unpaid invoice' },
          { status: 400 }
        );
      }

      if (!reason) {
        return NextResponse.json(
          { error: 'Refund reason is required' },
          { status: 400 }
        );
      }

      await invoice.refund(auth.user.id, reason);

      return NextResponse.json({
        success: true,
        message: 'Invoice refunded successfully',
        data: {
          invoiceId: invoice.invoiceId,
          status: invoice.status,
        },
      });
    } else if (action === 'update') {
      // Update invoice details (only for DRAFT or PENDING)
      if (!['DRAFT', 'PENDING'].includes(invoice.status)) {
        return NextResponse.json(
          { error: 'Can only update draft or pending invoices' },
          { status: 400 }
        );
      }

      if (discount !== undefined) {
        invoice.discount = discount;
      }
      if (notes !== undefined) {
        invoice.notes = notes;
      }
      if (dueDate !== undefined) {
        invoice.dueDate = dueDate ? new Date(dueDate) : undefined;
      }

      await invoice.save();
      await invoice.addEvent('Invoice updated', auth.user.id);

      return NextResponse.json({
        success: true,
        message: 'Invoice updated successfully',
        data: {
          invoiceId: invoice.invoiceId,
          discount: invoice.discount,
          total: invoice.total,
          amountDue: invoice.amountDue,
          notes: invoice.notes,
          dueDate: invoice.dueDate,
        },
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Update invoice error:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}
