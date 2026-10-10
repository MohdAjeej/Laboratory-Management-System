'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Building2, TrendingUp, Package, CreditCard, Calendar,
  FileText, Clock, CheckCircle, AlertCircle, DollarSign
} from 'lucide-react';

export default function HospitalDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalBilling: 0,
    pendingPayments: 0,
    creditUsed: 0,
    creditLimit: 100000,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [hospitalInfo, setHospitalInfo] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch hospital info
      const infoRes = await fetch('/api/hospital/info');
      if (infoRes.ok) {
        const infoData = await infoRes.json();
        if (infoData.success) {
          setHospitalInfo(infoData.data);
        }
      }

      // Fetch hospital statistics
      const statsRes = await fetch('/api/hospital/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }

      // Fetch recent orders
      const ordersRes = await fetch('/api/hospital/orders?limit=10');
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        if (ordersData.success) {
          setRecentOrders(ordersData.data.orders || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; text: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      sample_collected: { color: 'bg-blue-100 text-blue-800', text: 'Collected' },
      in_progress: { color: 'bg-purple-100 text-purple-800', text: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Completed' },
      delivered: { color: 'bg-gray-100 text-gray-800', text: 'Delivered' },
    };
    const variant = variants[status] || { color: 'bg-gray-100 text-gray-800', text: status };
    return <Badge className={variant.color}>{variant.text}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const creditPercentage = (stats.creditUsed / stats.creditLimit) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hospital Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {hospitalInfo?.name || 'Hospital Portal'} | {hospitalInfo?.code || 'N/A'}
          </p>
        </div>
        <Button onClick={fetchDashboardData}>
          <Clock className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Hospital Info Card */}
      {hospitalInfo && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Hospital Name</p>
                <p className="font-semibold text-gray-900">{hospitalInfo.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Contact Person</p>
                <p className="font-semibold text-gray-900">{hospitalInfo.contactPerson || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Contact</p>
                <p className="font-semibold text-gray-900">{hospitalInfo.phone}</p>
                <p className="text-sm text-gray-600">{hospitalInfo.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
            <FileText className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalOrders}</div>
            <p className="text-xs text-gray-600 mt-1">All time orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Orders</CardTitle>
            <Clock className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.pendingOrders}</div>
            <p className="text-xs text-gray-600 mt-1">Awaiting processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed Orders</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.completedOrders}</div>
            <p className="text-xs text-gray-600 mt-1">Successfully delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Billing</CardTitle>
            <DollarSign className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">₹{stats.totalBilling.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">Current month</p>
          </CardContent>
        </Card>
      </div>

      {/* Credit Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Credit Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Credit Used</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.creditUsed.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Credit Limit</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.creditLimit.toLocaleString()}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Available Credit</span>
                <span className="font-semibold">₹{(stats.creditLimit - stats.creditUsed).toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    creditPercentage > 90 ? 'bg-red-600' : creditPercentage > 70 ? 'bg-yellow-500' : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(creditPercentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600">{creditPercentage.toFixed(1)}% of credit limit used</p>
            </div>
            {stats.pendingPayments > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Pending Payments</p>
                  <p className="text-xs text-yellow-700">₹{stats.pendingPayments.toLocaleString()} payment pending</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p>No orders yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-mono text-sm">{order.orderId}</TableCell>
                    <TableCell>
                      <div className="font-medium">{order.patientName}</div>
                      <div className="text-xs text-gray-500">{order.patientId}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{order.testCount || 0} tests</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-semibold">₹{order.totalAmount?.toLocaleString() || 0}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
