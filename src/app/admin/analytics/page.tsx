'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, Users, FileText, TestTube, DollarSign, Clock, AlertTriangle,
  CheckCircle, BarChart3, RotateCcw
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalPatients: number;
    newPatientsToday: number;
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
    totalUsers: number;
  };
  charts: {
    ordersByStatus: Array<{ _id: string; count: number }>;
    samplesByStatus: Array<{ _id: string; count: number }>;
    revenueByDay: Array<{ _id: string; total: number; count: number }>;
    topTests: Array<{ name: string; code: string; count: number; revenue: number }>;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/dashboard?period=${period}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchAnalytics(); }, [period]);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading analytics...</div>;
  if (!data) return <div className="text-center py-20 text-gray-500">Failed to load analytics</div>;

  const { overview, charts } = data;

  const statusColor = (s: string) => {
    const colors: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-800', PROCESSING: 'bg-blue-100 text-blue-800',
      CONFIRMED: 'bg-indigo-100 text-indigo-800', DRAFT: 'bg-gray-100 text-gray-800',
      SAMPLE_PENDING: 'bg-yellow-100 text-yellow-800', CANCELLED: 'bg-red-100 text-red-800',
      COLLECTED: 'bg-cyan-100 text-cyan-800', RECEIVED: 'bg-blue-100 text-blue-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return colors[s] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Real-time operational insights</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="border rounded-md px-3 py-2 text-sm" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}><RotateCcw className="h-4 w-4 mr-1" />Refresh</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Patients', value: overview.totalPatients, sub: `+${overview.newPatientsToday} today`, icon: Users, color: 'text-blue-600' },
          { label: 'Orders (Period)', value: overview.totalOrders, sub: `${overview.ordersToday} today`, icon: FileText, color: 'text-green-600' },
          { label: 'Pending Orders', value: overview.pendingOrders, sub: 'Awaiting completion', icon: Clock, color: 'text-yellow-600' },
          { label: 'Pending Results', value: overview.pendingResults, sub: 'Awaiting verification', icon: AlertTriangle, color: 'text-orange-600' },
          { label: 'Revenue Today', value: `₹${overview.revenueToday.toLocaleString()}`, sub: `₹${overview.revenuePeriod.toLocaleString()} period`, icon: DollarSign, color: 'text-emerald-600' },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
                </div>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Orders by Status</CardTitle></CardHeader>
          <CardContent>
            {charts.ordersByStatus.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No order data</p>
            ) : (
              <div className="space-y-3">
                {charts.ordersByStatus.map(s => (
                  <div key={s._id} className="flex items-center justify-between">
                    <Badge className={statusColor(s._id)}>{s._id}</Badge>
                    <div className="flex-1 mx-4">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((s.count / Math.max(...charts.ordersByStatus.map(x => x.count))) * 100, 100)}%` }} />
                      </div>
                    </div>
                    <span className="font-bold text-sm">{s.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Samples by Status */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Samples by Status</CardTitle></CardHeader>
          <CardContent>
            {charts.samplesByStatus.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No sample data</p>
            ) : (
              <div className="space-y-3">
                {charts.samplesByStatus.map(s => (
                  <div key={s._id} className="flex items-center justify-between">
                    <Badge className={statusColor(s._id)}>{s._id}</Badge>
                    <div className="flex-1 mx-4">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min((s.count / Math.max(...charts.samplesByStatus.map(x => x.count))) * 100, 100)}%` }} />
                      </div>
                    </div>
                    <span className="font-bold text-sm">{s.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Revenue Trend (7 days)</CardTitle></CardHeader>
          <CardContent>
            {charts.revenueByDay.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No revenue data</p>
            ) : (
              <div className="space-y-2">
                {charts.revenueByDay.map(d => (
                  <div key={d._id} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-600">{new Date(d._id).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">{d.count} txns</Badge>
                      <span className="font-bold text-sm">₹{d.total.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Tests */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Top Tests by Volume</CardTitle></CardHeader>
          <CardContent>
            {charts.topTests.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No test data</p>
            ) : (
              <div className="space-y-3">
                {charts.topTests.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-400 w-6">#{idx + 1}</span>
                      <div>
                        <p className="text-sm font-medium">{t.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-400">{t.code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{t.count} orders</p>
                      <p className="text-xs text-gray-500">₹{(t.revenue || 0).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
