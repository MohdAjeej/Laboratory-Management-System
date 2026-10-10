'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, FileText, TestTube, Users, Clock, CheckCircle, Download } from 'lucide-react';
import Link from 'next/link';

export default function HospitalDashboard() {
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Hospital Staff Portal</h1>
        <p className="text-gray-600">View your hospital's orders, reports, and patient data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.pendingReports || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patients</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalPatients || 0}</div>
            <p className="text-xs text-muted-foreground">Total registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.ordersToday || 0}</div>
            <p className="text-xs text-muted-foreground">Today's orders</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Access your hospital data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/hospital/patients">
              <div className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors cursor-pointer">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-900">View Patients</p>
              </div>
            </Link>
            <Link href="/hospital/orders">
              <div className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors cursor-pointer">
                <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-900">View Orders</p>
              </div>
            </Link>
            <Link href="/hospital/reports">
              <div className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors cursor-pointer">
                <Download className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-purple-900">Download Reports</p>
              </div>
            </Link>
            <Link href="/verify">
              <div className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-center transition-colors cursor-pointer">
                <TestTube className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-orange-900">Verify Report</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
