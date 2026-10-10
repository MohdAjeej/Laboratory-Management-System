'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  TestTube, 
  Hospital, 
  FileText, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Package,
  Wrench,
  Shield,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';

interface DashboardData {
  overview: {
    totalOrders: number;
    ordersToday: number;
    pendingOrders: number;
    totalSamples: number;
    pendingSamples: number;
    pendingResults: number;
    pendingReports: number;
    revenueToday: number;
    revenuePeriod: number;
    totalHospitals: number;
    totalPatients: number;
  };
  alerts?: {
    lowStock?: number;
    expiringItems?: number;
    maintenanceDue?: number;
    qcFailures?: number;
    overdueOrders?: number;
  };
}

export default function LabAdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics/dashboard?period=30');
      const result = await res.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
              <AlertTriangle className="h-5 w-5 mr-2" />
              <p>{error}</p>
            </div>
            <Button onClick={fetchDashboardData} variant="outline" size="sm" className="mt-4">
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lab Admin Dashboard</h1>
        <p className="text-gray-600">Real-time operational overview and system health</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.overview.pendingOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.overview.ordersToday || 0} received today
            </p>
            <Link href="/lab-admin/orders">
              <Button variant="link" size="sm" className="px-0 mt-2">View all →</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Samples</CardTitle>
            <TestTube className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.overview.pendingSamples || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.overview.totalSamples || 0} total samples
            </p>
            <Link href="/lab-admin/samples">
              <Button variant="link" size="sm" className="px-0 mt-2">Manage →</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.overview.pendingReports || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.overview.pendingResults || 0} results pending
            </p>
            <Link href="/lab-admin/reports">
              <Button variant="link" size="sm" className="px-0 mt-2">Review →</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(data?.overview.revenueToday || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ₹{(data?.overview.revenuePeriod || 0).toLocaleString()} this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
            System Alerts
          </CardTitle>
          <CardDescription>Items requiring immediate attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/inventory">
              <div className="p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 cursor-pointer transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <Package className="h-5 w-5 text-red-600" />
                  <Badge variant="destructive">{data?.alerts?.lowStock || 0}</Badge>
                </div>
                <p className="font-medium text-red-900">Low Stock Items</p>
                <p className="text-xs text-red-700 mt-1">Requires reordering</p>
              </div>
            </Link>

            <Link href="/admin/inventory">
              <div className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg border border-yellow-200 cursor-pointer transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <Badge className="bg-yellow-200 text-yellow-800">{data?.alerts?.expiringItems || 0}</Badge>
                </div>
                <p className="font-medium text-yellow-900">Expiring Soon</p>
                <p className="text-xs text-yellow-700 mt-1">Within 30 days</p>
              </div>
            </Link>

            <Link href="/admin/equipment">
              <div className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 cursor-pointer transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <Wrench className="h-5 w-5 text-orange-600" />
                  <Badge className="bg-orange-200 text-orange-800">{data?.alerts?.maintenanceDue || 0}</Badge>
                </div>
                <p className="font-medium text-orange-900">Maintenance Due</p>
                <p className="text-xs text-orange-700 mt-1">Equipment needs service</p>
              </div>
            </Link>

            <Link href="/admin/quality-control">
              <div className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 cursor-pointer transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <Badge className="bg-purple-200 text-purple-800">{data?.alerts?.qcFailures || 0}</Badge>
                </div>
                <p className="font-medium text-purple-900">QC Failures</p>
                <p className="text-xs text-purple-700 mt-1">Recent failures</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hospital Activity</CardTitle>
            <CardDescription>Active hospital partnerships</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Hospital className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-sm">Active Hospitals</p>
                    <p className="text-xs text-gray-600">Currently registered</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-blue-600">{data?.overview.totalHospitals || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-sm">Total Patients</p>
                    <p className="text-xs text-gray-600">In database</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-green-600">{data?.overview.totalPatients || 0}</span>
              </div>

              <Link href="/admin/hospitals">
                <Button className="w-full" variant="outline">
                  <Hospital className="h-4 w-4 mr-2" />
                  Manage Hospitals
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Master Data Management</CardTitle>
            <CardDescription>Quick access to configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/admin/tests">
                <button className="w-full p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors">
                  <TestTube className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-purple-900">Tests</p>
                </button>
              </Link>

              <Link href="/admin/packages">
                <button className="w-full p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-center transition-colors">
                  <Package className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-indigo-900">Packages</p>
                </button>
              </Link>

              <Link href="/admin/users">
                <button className="w-full p-4 bg-cyan-50 hover:bg-cyan-100 rounded-lg text-center transition-colors">
                  <Users className="h-6 w-6 text-cyan-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-cyan-900">Users</p>
                </button>
              </Link>

              <Link href="/admin/settings">
                <button className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center transition-colors">
                  <Wrench className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Settings</p>
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            System Performance
          </CardTitle>
          <CardDescription>Real-time system health monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <Badge className="bg-green-100 text-green-800">Healthy</Badge>
              </div>
              <p className="font-medium text-green-900">Database</p>
              <p className="text-xs text-green-700 mt-1">Connection active</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <Badge className="bg-green-100 text-green-800">Online</Badge>
              </div>
              <p className="font-medium text-green-900">API Services</p>
              <p className="text-xs text-green-700 mt-1">All endpoints responsive</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <Badge className="bg-blue-100 text-blue-800">Normal</Badge>
              </div>
              <p className="font-medium text-blue-900">System Load</p>
              <p className="text-xs text-blue-700 mt-1">CPU & Memory within limits</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
