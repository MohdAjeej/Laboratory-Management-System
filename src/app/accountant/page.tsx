'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { 
  DollarSign, 
  FileText, 
  CreditCard, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Filter,
  Calendar
} from 'lucide-react';

interface FinancialData {
  summary: {
    totalRevenue: number;
    pendingPayments: number;
    completedToday: number;
    outstandingBalance: number;
    invoicesIssued: number;
    invoicesPaid: number;
    refundsIssued: number;
  };
  recentInvoices?: Array<{
    _id: string;
    invoiceId: string;
    patientName: string;
    hospitalName?: string;
    amount: number;
    status: string;
    dueDate: string;
  }>;
  recentPayments?: Array<{
    _id: string;
    paymentId: string;
    amount: number;
    method: string;
    status: string;
    createdAt: string;
  }>;
}

export default function AccountantDashboard() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    fetchFinancialData();
  }, [dateRange]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      // Map day range to period
      let period = 'month'
      if (dateRange === '7') period = 'week'
      else if (dateRange === '30') period = 'month'
      else if (dateRange === '90' || dateRange === '365') period = 'year'
      
      const res = await fetch(`/api/billing/dashboard?period=${period}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch financial data');
      }
      
      const result = await res.json();
      
      if (result.success) {
        // Transform API data to match expected format
        const apiData = result.data
        setData({
          summary: {
            totalRevenue: apiData.summary.totalRevenue || 0,
            pendingPayments: apiData.summary.pendingOrders || 0,
            completedToday: apiData.summary.paidAmount || 0,
            outstandingBalance: apiData.summary.outstandingAmount || 0,
            invoicesIssued: apiData.summary.paidOrders + apiData.summary.pendingOrders || 0,
            invoicesPaid: apiData.summary.paidOrders || 0,
            refundsIssued: 0
          },
          recentInvoices: (apiData.recentInvoices || []).map((inv: any) => ({
            _id: inv._id,
            invoiceId: inv.orderId,
            patientName: inv.patient?.name || 'Unknown',
            hospitalName: inv.hospital?.name,
            amount: inv.totalAmount || 0,
            status: inv.paymentStatus === 'paid' ? 'PAID' : inv.paymentStatus === 'pending' ? 'PENDING' : 'PARTIAL',
            dueDate: inv.createdAt
          })),
          recentPayments: []
        });
      } else {
        setError(result.error || 'Failed to load dashboard data');
      }
    } catch (err: any) {
      console.error('Dashboard error:', err);
      setError(err.message || 'Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading financial data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-800">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>{error}</p>
            </div>
            <Button onClick={fetchFinancialData} variant="outline" size="sm" className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accountant Dashboard</h1>
          <p className="text-gray-600">Financial overview and billing management</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(data?.summary.totalRevenue || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last {dateRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(data?.summary.outstandingBalance || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {data?.summary.pendingPayments || 0} pending payments
            </p>
            <Link href="/accountant/invoices?status=pending">
              <Button variant="link" size="sm" className="px-0 mt-2">View →</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices Issued</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.invoicesIssued || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.summary.invoicesPaid || 0} paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Collection</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(data?.summary.completedToday || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Payments received
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>Latest billing activity</CardDescription>
              </div>
              <Link href="/accountant/invoices">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data?.recentInvoices && data.recentInvoices.length > 0 ? (
              <div className="space-y-3">
                {data.recentInvoices.slice(0, 5).map((invoice) => (
                  <div key={invoice._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{invoice.invoiceId}</p>
                      <p className="text-xs text-gray-600">{invoice.patientName}</p>
                      {invoice.hospitalName && (
                        <p className="text-xs text-gray-500">{invoice.hospitalName}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">₹{invoice.amount.toLocaleString()}</p>
                      <Badge className={
                        invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">No recent invoices</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Latest payment transactions</CardDescription>
              </div>
              <Link href="/accountant/payments">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data?.recentPayments && data.recentPayments.length > 0 ? (
              <div className="space-y-3">
                {data.recentPayments.slice(0, 5).map((payment) => (
                  <div key={payment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{payment.paymentId}</p>
                      <p className="text-xs text-gray-600">{payment.method}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-green-600">₹{payment.amount.toLocaleString()}</p>
                      <Badge className={
                        payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">No recent payments</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common financial tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/accountant/invoices/new">
              <button className="w-full p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors">
                <FileText className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-900">New Invoice</p>
              </button>
            </Link>

            <Link href="/accountant/payments/new">
              <button className="w-full p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors">
                <CreditCard className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-900">Record Payment</p>
              </button>
            </Link>

            <Link href="/accountant/reports">
              <button className="w-full p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors">
                <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-purple-900">Reports</p>
              </button>
            </Link>

            <Link href="/accountant/hospitals">
              <button className="w-full p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-center transition-colors">
                <DollarSign className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-orange-900">Hospital Billing</p>
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Financial Summary
          </CardTitle>
          <CardDescription>Revenue breakdown for the period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Collected</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                ₹{((data?.summary.totalRevenue || 0) - (data?.summary.outstandingBalance || 0)).toLocaleString()}
              </p>
              <p className="text-xs text-green-700 mt-1">
                {data?.summary.invoicesPaid || 0} invoices paid
              </p>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-900">Pending</span>
              </div>
              <p className="text-2xl font-bold text-yellow-900">
                ₹{(data?.summary.outstandingBalance || 0).toLocaleString()}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                {data?.summary.pendingPayments || 0} invoices pending
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Refunds</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {data?.summary.refundsIssued || 0}
              </p>
              <p className="text-xs text-blue-700 mt-1">Processed this period</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
