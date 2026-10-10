'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Hospital, Plus, Search, Edit2, Trash2, RotateCcw, MapPin } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from '@/components/ui/dialog';

interface HospitalData {
  _id: string;
  hospitalId: string;
  name: string;
  code: string;
  registrationNumber?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: { street?: string; city?: string; state?: string; zipCode?: string };
  creditLimit?: number;
  billingTerms?: string;
  isActive: boolean;
  createdAt: string;
}

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<HospitalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<HospitalData | null>(null);
  const [formData, setFormData] = useState({
    name: '', code: '', registrationNumber: '', contactPerson: '',
    phone: '', email: '', creditLimit: 0, billingTerms: '30 days',
    address: { street: '', city: '', state: '', zipCode: '', country: 'India' },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<any>(null);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hospitals?page=${page}&limit=20&search=${search}`);
      const data = await res.json();
      if (data.success) {
        setHospitals(data.data.hospitals);
        setTotalPages(data.data.pagination.pages);
      }
    } catch { setError('Failed to load hospitals'); }
    setLoading(false);
  };

  useEffect(() => { fetchHospitals(); }, [page, search]);

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      const url = editing ? `/api/hospitals/${editing._id}` : '/api/hospitals';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (!res.ok) {
        // Show detailed validation errors if available
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details.map((err: any) => `${err.field}: ${err.message}`).join('\n');
          throw new Error(errorMessages);
        }
        throw new Error(data.error || 'Failed to save');
      }
      setShowDialog(false);
      resetForm();
      fetchHospitals();
      
      // Show credentials for new hospital
      if (!editing && data.data.credentials) {
        setCredentials(data.data.credentials);
        setShowCredentials(true);
      }
    } catch (err: any) { setError(err.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this hospital?')) return;
    try {
      await fetch(`/api/hospitals/${id}`, { method: 'DELETE' });
      fetchHospitals();
    } catch { setError('Failed to delete'); }
  };

  const openEdit = (h: HospitalData) => {
    setEditing(h);
    setFormData({
      name: h.name, code: h.code, registrationNumber: h.registrationNumber || '',
      contactPerson: h.contactPerson || '', phone: h.phone || '', email: h.email || '',
      creditLimit: h.creditLimit || 0, billingTerms: h.billingTerms || '30 days',
      address: h.address ? { ...h.address, country: h.address?.zipCode ? 'India' : 'India' } as any : { street: '', city: '', state: '', zipCode: '', country: 'India' },
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', registrationNumber: '', contactPerson: '', phone: '', email: '', creditLimit: 0, billingTerms: '30 days', address: { street: '', city: '', state: '', zipCode: '', country: 'India' } });
    setEditing(null);
    setError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hospital Management</h1>
          <p className="text-gray-600">Manage registered hospitals and clinics</p>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Hospital</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Hospital' : 'Add New Hospital'}</DialogTitle>
              <DialogDescription>Fill in the hospital details below</DialogDescription>
            </DialogHeader>
            {error && (
              <div className="p-4 text-sm text-red-800 bg-red-50 rounded-md border border-red-200">
                <p className="font-semibold mb-2">Validation Error:</p>
                <div className="whitespace-pre-wrap">{error}</div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">Hospital Name *</label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="City General Hospital" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Code *</label>
                <Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="CGH" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Registration Number</label>
                <Input value={formData.registrationNumber} onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})} placeholder="REG-XXX-001" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Contact Person</label>
                <Input value={formData.contactPerson} onChange={(e) => setFormData({...formData, contactPerson: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Phone *</label>
                <Input 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  placeholder="10-15 digits only"
                  pattern="[0-9]{10,15}"
                  title="Phone number must be 10-15 digits"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email *</label>
                <Input 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  type="email"
                  placeholder="hospital@example.com"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Credit Limit (₹)</label>
                <Input type="number" value={formData.creditLimit} onChange={(e) => setFormData({...formData, creditLimit: Number(e.target.value)})} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Billing Terms</label>
                <Input value={formData.billingTerms} onChange={(e) => setFormData({...formData, billingTerms: e.target.value})} placeholder="30 days" />
              </div>
              <div className="col-span-2 border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center"><MapPin className="h-4 w-4 mr-2"/>Address * (All fields required)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Input 
                      placeholder="Street Address *" 
                      value={formData.address.street} 
                      onChange={(e) => setFormData({...formData, address: {...formData.address, street: e.target.value}})} 
                      required
                    />
                  </div>
                  <Input 
                    placeholder="City *" 
                    value={formData.address.city} 
                    onChange={(e) => setFormData({...formData, address: {...formData.address, city: e.target.value}})} 
                    required
                  />
                  <Input 
                    placeholder="State *" 
                    value={formData.address.state} 
                    onChange={(e) => setFormData({...formData, address: {...formData.address, state: e.target.value}})} 
                    required
                  />
                  <Input 
                    placeholder="ZIP Code *" 
                    value={formData.address.zipCode} 
                    onChange={(e) => setFormData({...formData, address: {...formData.address, zipCode: e.target.value}})} 
                    required
                  />
                  <Input 
                    placeholder="Country" 
                    value={formData.address.country} 
                    onChange={(e) => setFormData({...formData, address: {...formData.address, country: e.target.value}})} 
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleSubmit} disabled={saving || !formData.name || !formData.code}>
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
              <Input className="pl-10" placeholder="Search hospitals..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Button variant="outline" size="sm" onClick={fetchHospitals}><RotateCcw className="h-4 w-4 mr-1" />Refresh</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading hospitals...</div>
          ) : hospitals.length === 0 ? (
            <div className="text-center py-12">
              <Hospital className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hospitals found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hospital ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Credit Limit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hospitals.map((h) => (
                    <TableRow key={h._id}>
                      <TableCell className="font-mono text-sm">{h.hospitalId}</TableCell>
                      <TableCell className="font-medium">{h.name}</TableCell>
                      <TableCell><Badge variant="outline">{h.code}</Badge></TableCell>
                      <TableCell>
                        <div className="text-sm">{h.contactPerson}</div>
                        <div className="text-xs text-gray-500">{h.phone}</div>
                      </TableCell>
                      <TableCell>{h.address?.city || '—'}</TableCell>
                      <TableCell>₹{(h.creditLimit || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={h.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {h.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(h)}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(h._id)}><Trash2 className="h-4 w-4" /></Button>
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

      {/* Credentials Dialog */}
      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-600">✓ Hospital Created Successfully!</DialogTitle>
            <DialogDescription>Login credentials for hospital staff</DialogDescription>
          </DialogHeader>
          {credentials && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm font-medium text-yellow-800 mb-2">⚠️ {credentials.message}</p>
                <p className="text-xs text-yellow-700">Please copy and share these credentials with the hospital staff now.</p>
              </div>
              <div className="space-y-3 p-4 bg-gray-50 rounded-md font-mono text-sm">
                <div>
                  <label className="text-xs text-gray-600">User ID</label>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{credentials.userId}</span>
                    <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(credentials.userId)}>Copy</Button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Email</label>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{credentials.email}</span>
                    <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(credentials.email)}>Copy</Button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Password</label>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{credentials.password}</span>
                    <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(credentials.password)}>Copy</Button>
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• Password format: {'{HospitalCode}@123'}</p>
                <p>• Hospital staff can change password after first login</p>
                <p>• Login at: <a href="/login" className="text-blue-600 underline">http://localhost:3000/login</a></p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => { setShowCredentials(false); setCredentials(null); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
