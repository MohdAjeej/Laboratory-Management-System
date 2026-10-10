import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, PackageOpen, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import Patient from '@/models/Patient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

async function getPatientOrders(userEmail: string) {
  try {
    await connectToDatabase();

    // Find patient record by user email
    const patient = await Patient.findOne({ email: userEmail });
    
    if (!patient) {
      return [];
    }

    // Fetch all orders for this patient
    const orders = await Order.find({ patientId: patient._id })
      .populate('hospitalId', 'name')
      .populate('doctorId', 'firstName lastName specialization')
      .populate('items.testId', 'name code category')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(orders));
  } catch (error) {
    console.error('Error fetching patient orders:', error);
    return [];
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'PROCESSING':
      return 'bg-blue-100 text-blue-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    case 'CONFIRMED':
      return 'bg-purple-100 text-purple-800';
    case 'SAMPLE_PENDING':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getPaymentStatusColor(status: string) {
  switch (status) {
    case 'PAID':
      return 'bg-green-100 text-green-800';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'PARTIALLY_PAID':
      return 'bg-orange-100 text-orange-800';
    case 'FAILED':
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default async function PatientOrdersPage() {
  await cookies();
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  const orders = await getPatientOrders(user.email);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-600">View and track your test orders</p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PackageOpen className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Yet</h3>
            <p className="text-gray-600 text-center max-w-sm">
              You haven't placed any test orders yet. Contact your healthcare provider to schedule laboratory tests.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order: any) => (
            <Card key={order._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {order.orderId}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.replace(/_/g, ' ')}
                    </Badge>
                    <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                      {order.paymentStatus.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Test Items */}
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Tests Ordered:</h4>
                    <div className="space-y-2">
                      {order.items?.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                          <div>
                            <p className="font-medium text-sm">
                              {item.testId?.name || 'Unknown Test'}
                            </p>
                            <p className="text-xs text-gray-600">
                              Code: {item.testId?.code || 'N/A'} • Category: {item.testId?.category || 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">₹{item.price}</p>
                            {item.discount > 0 && (
                              <p className="text-xs text-green-600">-₹{item.discount} off</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    {order.hospitalId && (
                      <div>
                        <p className="text-xs text-gray-600">Hospital</p>
                        <p className="font-medium text-sm">{order.hospitalId.name}</p>
                      </div>
                    )}
                    {order.doctorId && (
                      <div>
                        <p className="text-xs text-gray-600">Doctor</p>
                        <p className="font-medium text-sm">
                          Dr. {order.doctorId.firstName} {order.doctorId.lastName}
                        </p>
                        <p className="text-xs text-gray-600">{order.doctorId.specialization}</p>
                      </div>
                    )}
                    {order.priority === 'URGENT' && (
                      <div className="col-span-2">
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-semibold">Urgent Priority</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pricing Summary */}
                  <div className="bg-gray-50 p-4 rounded space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span>₹{order.subtotal}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount:</span>
                        <span>-₹{order.discount}</span>
                      </div>
                    )}
                    {order.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax:</span>
                        <span>₹{order.tax}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base pt-2 border-t">
                      <span>Total:</span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ₹{order.total}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div className="text-sm">
                      <p className="text-gray-600 font-semibold">Notes:</p>
                      <p className="text-gray-700 italic">{order.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
