'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Stethoscope, Plus, Search, Edit2, Trash2, RotateCcw } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from '@/components/ui/dialog';

interface DoctorData {
  _id: string;
  doctorId: string;
  firstName: string;
  lastName: string;
  registrationNumber: string;
  specialization: string;
  phone?: string;
  email?: string;
  hospitalIds?: Array<{ _id: string; name: string; code: string }>;
  isActive: boolean;
  createdAt: string;
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<DoctorData | null>(null);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', registrationNumber: '', specialization: '',
    phone: '', email: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/doctors?page=${page}&limit=20&search=${search}`);
      const data = await res.json();
      if (data.success) {
        setDoctors(data.data.doctors);
        setTotalPages(data.data.pagination.pages);
      }
    } catch { setError('Failed to load'); }
    setLoading(false);
  };

  useEffect(() => { fetchDoctors(); }, [page, search]);

  const handleSubmit = async () => {
    setSaving(true); setError('');
    try {
      const url = editing ? `/api/doctors/${editing._id}` : '/api/doctors';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setShowDialog(false); setEditing(null); resetForm(); fetchDoctors();
    } catch (err: any) { setError(err.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this doctor?')) return;
    await fetch(`/api/doctors/${id}`, { method: 'DELETE' });
    fetchDoctors();
  };

  const openEdit = (d: DoctorData) => {
    setEditing(d);
    setFormData({ firstName: d.firstName, lastName: d.lastName, registrationNumber: d.registrationNumber, specialization: d.specialization, phone: d.phone || '', email: d.email || '' });
    setShowDialog(true);
  };

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', registrationNumber: '', specialization: '', phone: '', email: '' });
    setEditing(null); setError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Doctor Management</h1>
          <p className="text-gray-600">Manage referring doctors and specialists</p>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Doctor</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Doctor' : 'Add New Doctor'}</DialogTitle>
              <DialogDescription>Doctor profile information</DialogDescription>
            </DialogHeader>
            {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">{error}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-gray-700">First Name *</label><Input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} /></div>
              <div><label className="text-sm font-medium text-gray-700">Last Name *</label><Input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} /></div>
              <div><label className="text-sm font-medium text-gray-700">Reg. Number *</label><Input value={formData.registrationNumber} onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})} placeholder="MCI-12345" /></div>
              <div><label className="text-sm font-medium text-gray-700">Specialization *</label><Input value={formData.specialization} onChange={(e) => setFormData({...formData, specialization: e.target.value})} placeholder="General Medicine" /></div>
              <div><label className="text-sm font-medium text-gray-700">Phone</label><Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
              <div><label className="text-sm font-medium text-gray-700">Email</label><Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} type="email" /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleSubmit} disabled={saving || !formData.firstName || !formData.lastName || !formData.registrationNumber}>
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input className="pl-10" placeholder="Search doctors..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Button variant="outline" size="sm" onClick={fetchDoctors}><RotateCcw className="h-4 w-4 mr-1" />Refresh</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading doctors...</div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-12"><Stethoscope className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No doctors found</p></div>
          ) : (
            <>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Doctor ID</TableHead><TableHead>Name</TableHead><TableHead>Reg. Number</TableHead>
                  <TableHead>Specialization</TableHead><TableHead>Contact</TableHead><TableHead>Hospitals</TableHead>
                  <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {doctors.map((d) => (
                    <TableRow key={d._id}>
                      <TableCell className="font-mono text-sm">{d.doctorId}</TableCell>
                      <TableCell className="font-medium">Dr. {d.firstName} {d.lastName}</TableCell>
                      <TableCell><Badge variant="outline">{d.registrationNumber}</Badge></TableCell>
                      <TableCell>{d.specialization}</TableCell>
                      <TableCell><div className="text-sm">{d.phone}</div><div className="text-xs text-gray-500">{d.email}</div></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {d.hospitalIds?.map((h) => (<Badge key={h._id} className="bg-blue-50 text-blue-700 text-xs">{h.code}</Badge>))}
                        </div>
                      </TableCell>
                      <TableCell><Badge className={d.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{d.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(d)}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(d._id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
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
