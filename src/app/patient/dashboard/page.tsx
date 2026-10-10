import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Calendar, User, Activity, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import TestResult from '@/models/TestResult';
import Report from '@/models/Report';
import Patient from '@/models/Patient';
import { OrderStatus, ResultStatus, ReportStatus } from '@/lib/validation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

async function getPatientStats(userEmail: string) {
  try {
    await connectToDatabase();

    // Find patient record by user email
    const patient = await Patient.findOne({ email: userEmail });
    
    if (!patient) {
      return null;
    }

    // Get all statistics in parallel
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      totalResults,
      criticalResults,
      totalReports,
      recentOrders,
      recentResults,
    ] = await Promise.all([
      // Total orders
      Order.countDocuments({ patientId: patient._id }),
      
      // Pending orders (not completed or cancelled)
      Order.countDocuments({ 
        patientId: patient._id,
        status: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] }
      }),
      
      // Completed orders
      Order.countDocuments({ 
        patientId: patient._id,
        status: OrderStatus.COMPLETED
      }),
      
      // Total verified results
      TestResult.countDocuments({ 
        patientId: patient._id,
        status: ResultStatus.VERIFIED
      }),
      
      // Critical results
      TestResult.countDocuments({ 
        patientId: patient._id,
        status: ResultStatus.CRITICAL
      }),
      
      // Total published reports
      Report.countDocuments({ 
        patientId: patient._id,
        status: { $in: [ReportStatus.PUBLISHED, ReportStatus.DOWNLOADED] }
      }),
      
      // Recent orders (last 5)
      Order.find({ patientId: patient._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('items.testId', 'name')
        .select('orderId status createdAt items')
        .lean(),
      
      // Recent results (last 5 verified)
      TestResult.find({ 
        patientId: patient._id,
        status: ResultStatus.VERIFIED
      })
        .sort({ verifiedAt: -1 })
        .limit(5)
        .populate('testId', 'name code')
        .select('resultId testId verifiedAt')
        .lean(),
    ]);

    return {
      stats: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalResults,
        criticalResults,
        totalReports,
      },
      recentActivity: {
        orders: recentOrders,
        results: recentResults,
      },
    };
  } catch (error) {
    console.error('Error fetching patient stats:', error);
    return null;
  }
}

export default async function PatientDashboard() {
  await cookies();
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch actual data from database directly
  const statsData = await getPatientStats(user.email);
  
  const stats = statsData?.stats || {
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalResults: 0,
    criticalResults: 0,
    totalReports: 0,
  };

  const recentActivity = statsData?.recentActivity || {
    orders: [],
    results: [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Patient Portal</h1>
        <p className="text-gray-600">Welcome back, {user.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/patient/orders">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingOrders} pending, {stats.completedOrders} completed
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/patient/results">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Test Results</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalResults}</div>
              <p className="text-xs text-muted-foreground">
                {stats.criticalResults > 0 ? (
                  <span className="text-red-600 font-semibold">{stats.criticalResults} critical</span>
                ) : (
                  'All normal'
                )}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/patient/reports">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports Available</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReports}</div>
              <p className="text-xs text-muted-foreground">Ready to download</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {stats.criticalResults > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="h-5 w-5" />
              Critical Results Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-800">
              You have {stats.criticalResults} critical test result{stats.criticalResults > 1 ? 's' : ''} that require immediate attention. 
              Please consult with your healthcare provider as soon as possible.
            </p>
            <Link href="/patient/results" className="text-sm font-semibold text-red-900 hover:underline mt-2 inline-block">
              View Critical Results →
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.orders.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.orders.map((order: any) => (
                  <div key={order._id} className="flex justify-between items-center border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{order.orderId}</p>
                      <p className="text-xs text-gray-600">
                        {order.items?.length || 0} test{(order.items?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
                <Link href="/patient/orders" className="text-sm text-blue-600 hover:underline inline-block mt-2">
                  View all orders →
                </Link>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No recent orders</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.results.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.results.map((result: any) => (
                  <div key={result._id} className="flex justify-between items-center border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{result.testId?.name || 'Unknown Test'}</p>
                      <p className="text-xs text-gray-600">{result.resultId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">
                        {result.verifiedAt ? new Date(result.verifiedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
                <Link href="/patient/results" className="text-sm text-blue-600 hover:underline inline-block mt-2">
                  View all results →
                </Link>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No results available yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
