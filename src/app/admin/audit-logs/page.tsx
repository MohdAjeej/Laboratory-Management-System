'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSearch, RotateCcw, Filter, Download } from 'lucide-react';

interface AuditLog {
  _id: string;
  userId: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  timestamp: string;
  ipAddress?: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VERIFY', 'APPROVE', 'REJECT', 'DOWNLOAD', 'GENERATE'];
  const entityTypes = ['User', 'Patient', 'Hospital', 'Doctor', 'Test', 'Order', 'Sample', 'TestResult', 'Report', 'Invoice', 'Payment'];

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '50' });
      if (actionFilter) params.set('action', actionFilter);
      if (entityFilter) params.set('entityType', entityFilter);
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);

      const res = await fetch(`/api/audit-logs?${params}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs);
        setTotalPages(data.data.pagination.pages);
        setTotal(data.data.pagination.total);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [page, actionFilter, entityFilter, fromDate, toDate]);

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-800', UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800', LOGIN: 'bg-indigo-100 text-indigo-800',
      LOGOUT: 'bg-gray-100 text-gray-800', VERIFY: 'bg-purple-100 text-purple-800',
      APPROVE: 'bg-emerald-100 text-emerald-800', REJECT: 'bg-orange-100 text-orange-800',
      DOWNLOAD: 'bg-cyan-100 text-cyan-800', GENERATE: 'bg-amber-100 text-amber-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600">System activity trail — {total.toLocaleString()} total entries</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs}><RotateCcw className="h-4 w-4 mr-1" />Refresh</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="h-4 w-4 text-gray-500" />
            <select className="border rounded-md px-3 py-2 text-sm" value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
              <option value="">All Actions</option>
              {actions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select className="border rounded-md px-3 py-2 text-sm" value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}>
              <option value="">All Entities</option>
              {entityTypes.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <Input type="date" className="w-40" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} />
            <span className="text-gray-400">to</span>
            <Input type="date" className="w-40" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} />
            {(actionFilter || entityFilter || fromDate || toDate) && (
              <Button variant="ghost" size="sm" onClick={() => { setActionFilter(''); setEntityFilter(''); setFromDate(''); setToDate(''); setPage(1); }}>Clear</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12"><FileSearch className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No audit logs found</p></div>
          ) : (
            <>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Timestamp</TableHead><TableHead>Action</TableHead><TableHead>Entity</TableHead>
                  <TableHead>Entity ID</TableHead><TableHead>Description</TableHead><TableHead>User</TableHead><TableHead>Role</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell className="text-sm whitespace-nowrap">{formatDate(log.timestamp)}</TableCell>
                      <TableCell><Badge className={getActionColor(log.action)}>{log.action}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{log.entityType}</Badge></TableCell>
                      <TableCell className="font-mono text-xs max-w-[120px] truncate">{log.entityId}</TableCell>
                      <TableCell className="text-sm max-w-[250px] truncate">{log.description}</TableCell>
                      <TableCell className="font-mono text-xs">{log.userId?.substring(0, 10)}...</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{log.userRole}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
