'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Plus, Search, Edit2, Trash2, RotateCcw, Eye } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from '@/components/ui/dialog';

interface PatientData {
  _id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: { city?: string; state?: string };
  isActive: boolean;
  createdAt: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<PatientData | null>(null);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', dateOfBirth: '', gender: 'MALE',
    phone: '', email: '', address: { street: '', city: '', state: '', zipCode: '', country: 'India' },
    emergencyContact: { name: '', phone: '', relationship: '' },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients?page=${page}&limit=20&search=${search}`);
      const data = await res.json();
      if (data.success) { setPatients(data.data.patients); setTotalPages(data.data.pagination.pages); }
    } catch { setError('Failed to load'); }
    setLoading(false);
  };

  useEffect(() => { fetchPatients(); }, [page, search]);

  const handleSubmit = async () => {
    setSaving(true); setError('');
    try {
      const url = editing ? `/api/patients/${editing._id}` : '/api/patients';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setShowDialog(false); setEditing(null); resetForm(); fetchPatients();
    } catch (err: any) { setError(err.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this patient?')) return;
    await fetch(`/api/patients/${id}`, { method: 'DELETE' });
    fetchPatients();
  };

  const openEdit = (p: PatientData) => {
    setEditing(p);
    setFormData({
      firstName: p.firstName, lastName: p.lastName,
      dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '',
      gender: p.gender || 'MALE', phone: p.phone || '', email: p.email || '',
      address: { street: '', city: p.address?.city || '', state: p.address?.state || '', zipCode: '', country: 'India' },
      emergencyContact: { name: '', phone: '', relationship: '' },
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', dateOfBirth: '', gender: 'MALE', phone: '', email: '', address: { street: '', city: '', state: '', zipCode: '', country: 'India' }, emergencyContact: { name: '', phone: '', relationship: '' } });
    setEditing(null); setError('');
  };

  const calcAge = (dob?: string) => {
    if (!dob) return '';
    const years = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return `${years}y`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Management</h1>
          <p className="text-gray-600">Register and manage patients</p>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Register Patient</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Patient' : 'Register New Patient'}</DialogTitle>
              <DialogDescription>Patient demographic information</DialogDescription>
            </DialogHeader>
            {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">{error}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-gray-700">First Name *</label><Input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} /></div>
              <div><label className="text-sm font-medium text-gray-700">Last Name *</label><Input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} /></div>
              <div><label className="text-sm font-medium text-gray-700">Date of Birth</label><Input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} /></div>
              <div>
                <label className="text-sm font-medium text-gray-700">Gender</label>
                <select className="w-full border rounded-md px-3 py-2 text-sm mt-1" value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}>
                  <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
                </select>
              </div>
              <div><label className="text-sm font-medium text-gray-700">Phone *</label><Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
              <div><label className="text-sm font-medium text-gray-700">Email</label><Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div>
              <div className="col-span-2 border-t pt-3"><h4 className="font-medium text-sm mb-2">Address</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><Input placeholder="Street" value={formData.address.street} onChange={(e) => setFormData({...formData, address: {...formData.address, street: e.target.value}})} /></div>
                  <Input placeholder="City" value={formData.address.city} onChange={(e) => setFormData({...formData, address: {...formData.address, city: e.target.value}})} />
                  <Input placeholder="State" value={formData.address.state} onChange={(e) => setFormData({...formData, address: {...formData.address, state: e.target.value}})} />
                  <Input placeholder="ZIP" value={formData.address.zipCode} onChange={(e) => setFormData({...formData, address: {...formData.address, zipCode: e.target.value}})} />
                </div>
              </div>
              <div className="col-span-2 border-t pt-3"><h4 className="font-medium text-sm mb-2">Emergency Contact</h4>
                <div className="grid grid-cols-3 gap-3">
                  <Input placeholder="Name" value={formData.emergencyContact.name} onChange={(e) => setFormData({...formData, emergencyContact: {...formData.emergencyContact, name: e.target.value}})} />
                  <Input placeholder="Phone" value={formData.emergencyContact.phone} onChange={(e) => setFormData({...formData, emergencyContact: {...formData.emergencyContact, phone: e.target.value}})} />
                  <Input placeholder="Relationship" value={formData.emergencyContact.relationship} onChange={(e) => setFormData({...formData, emergencyContact: {...formData.emergencyContact, relationship: e.target.value}})} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleSubmit} disabled={saving || !formData.firstName || !formData.lastName}>
                {saving ? 'Saving...' : editing ? 'Update' : 'Register'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input className="pl-10" placeholder="Search patients by name, ID, phone..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
            <Button variant="outline" size="sm" onClick={fetchPatients}><RotateCcw className="h-4 w-4 mr-1" />Refresh</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (<div className="text-center py-12 text-gray-500">Loading patients...</div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12"><Users className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No patients found</p></div>
          ) : (
            <>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Patient ID</TableHead><TableHead>Name</TableHead><TableHead>Age/Gender</TableHead>
                  <TableHead>Phone</TableHead><TableHead>City</TableHead><TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {patients.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell className="font-mono text-sm">{p.patientId}</TableCell>
                      <TableCell className="font-medium">{p.firstName} {p.lastName}</TableCell>
                      <TableCell><span className="text-sm">{calcAge(p.dateOfBirth)}</span> <Badge variant="outline" className="ml-1 text-xs">{p.gender}</Badge></TableCell>
                      <TableCell className="text-sm">{p.phone}</TableCell>
                      <TableCell className="text-sm">{p.address?.city || '—'}</TableCell>
                      <TableCell><Badge className={p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{p.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(p._id)}><Trash2 className="h-4 w-4" /></Button>
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
