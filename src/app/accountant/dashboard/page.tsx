'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, FileText, TrendingUp, CreditCard, Clock, BarChart3, RotateCcw } from 'lucide-react';
import Link from 'next/link';

export default function AccountantDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/analytics/dashboard?period=30');
        const data = await res.json();
        if (data.success) setStats(data.data);
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading dashboard...</div>;

  const overview = stats?.overview || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accountant Dashboard</h1>
          <p className="text-gray-600">Financial overview and billing management</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(overview.revenueToday || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Today's collections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue (30 days)</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(overview.revenuePeriod || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Monthly total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.pendingOrders || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting billing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common billing tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/receptionist/billing/invoices">
              <div className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors cursor-pointer">
                <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-900">Invoices</p>
              </div>
            </Link>
            <Link href="/receptionist/billing/payments/new">
              <div className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors cursor-pointer">
                <CreditCard className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-900">Record Payment</p>
              </div>
            </Link>
            <Link href="/receptionist/billing">
              <div className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors cursor-pointer">
                <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-purple-900">Billing Overview</p>
              </div>
            </Link>
            <Link href="/admin/analytics">
              <div className="p-4 bg-amber-50 hover:bg-amber-100 rounded-lg text-center transition-colors cursor-pointer">
                <BarChart3 className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-amber-900">Financial Reports</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Trend */}
      {stats?.charts?.revenueByDay && stats.charts.revenueByDay.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Revenue (Last 7 Days)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.charts.revenueByDay.map((d: any) => (
                <div key={d._id} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">{new Date(d._id).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">{d.count} transactions</Badge>
                    <span className="font-bold text-sm">₹{d.total.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
