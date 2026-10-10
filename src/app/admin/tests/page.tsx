'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TestTube, Plus, Search, Edit2, Trash2, RotateCcw, DollarSign, Clock, Eye } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface TestParameter {
  name: string;
  unit?: string;
  referenceRange?: { min?: number; max?: number; text?: string };
  criticalRange?: { min?: number; max?: number };
  displayOrder: number;
  isActive: boolean;
}

interface TestData {
  _id: string;
  testId: string;
  name: string;
  code: string;
  category: string;
  department: string;
  sampleType: string;
  turnaroundTime: number;
  price: number;
  parameters: TestParameter[];
  isActive: boolean;
  createdAt: string;
}

export default function TestsPage() {
  const [tests, setTests] = useState<TestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [editing, setEditing] = useState<TestData | null>(null);
  const [viewingTest, setViewingTest] = useState<TestData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    department: '',
    sampleType: '',
    turnaroundTime: 24,
    price: 0,
    parameters: [] as TestParameter[],
  });
  const [newParam, setNewParam] = useState({
    name: '',
    unit: '',
    referenceMin: '',
    referenceMax: '',
    referenceText: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchTests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
      });
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }

      const res = await fetch(`/api/tests?${params}`);
      const data = await res.json();
      if (data.success) {
        setTests(data.data.tests || []);
        setTotalPages(data.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error('Failed to load tests:', err);
      setError('Failed to load tests');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTests();
  }, [page, search, categoryFilter]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.code || !formData.category || formData.parameters.length === 0) {
      setError('Please fill in all required fields and add at least one parameter');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const url = editing ? `/api/tests/${editing._id}` : '/api/tests';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save test');
      setShowDialog(false);
      setEditing(null);
      resetForm();
      fetchTests();
    } catch (err: any) {
      setError(err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this test? It will no longer be available for orders.')) return;
    try {
      await fetch(`/api/tests/${id}`, { method: 'DELETE' });
      fetchTests();
    } catch (err) {
      console.error('Failed to delete test:', err);
      setError('Failed to delete test');
    }
  };

  const openEdit = (test: TestData) => {
    setEditing(test);
    setFormData({
      name: test.name,
      code: test.code,
      category: test.category,
      department: test.department,
      sampleType: test.sampleType,
      turnaroundTime: test.turnaroundTime,
      price: test.price,
      parameters: test.parameters.map(p => ({ ...p })),
    });
    setShowDialog(true);
  };

  const openDetails = (test: TestData) => {
    setViewingTest(test);
    setShowDetailsDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      category: '',
      department: '',
      sampleType: '',
      turnaroundTime: 24,
      price: 0,
      parameters: [],
    });
    setNewParam({ name: '', unit: '', referenceMin: '', referenceMax: '', referenceText: '' });
    setEditing(null);
    setError('');
  };

  const addParameter = () => {
    if (!newParam.name) {
      alert('Parameter name is required');
      return;
    }

    const parameter: TestParameter = {
      name: newParam.name,
      unit: newParam.unit || undefined,
      referenceRange: {},
      displayOrder: formData.parameters.length,
      isActive: true,
    };

    if (newParam.referenceMin || newParam.referenceMax) {
      parameter.referenceRange = {
        min: newParam.referenceMin ? parseFloat(newParam.referenceMin) : undefined,
        max: newParam.referenceMax ? parseFloat(newParam.referenceMax) : undefined,
      };
    }

    if (newParam.referenceText) {
      parameter.referenceRange!.text = newParam.referenceText;
    }

    setFormData({
      ...formData,
      parameters: [...formData.parameters, parameter],
    });

    setNewParam({ name: '', unit: '', referenceMin: '', referenceMax: '', referenceText: '' });
  };

  const removeParameter = (index: number) => {
    setFormData({
      ...formData,
      parameters: formData.parameters.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Test Catalog Management</h1>
          <p className="text-gray-600">Manage laboratory tests, parameters, and pricing</p>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Test</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Test' : 'Add New Test'}</DialogTitle>
              <DialogDescription>Define test details, parameters, and reference ranges</DialogDescription>
            </DialogHeader>
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">{error}</div>
            )}

            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700">Test Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Complete Blood Count"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Test Code *</label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="CBC"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Category *</label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Hematology"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Department *</label>
                    <Input
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Clinical Pathology"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Sample Type *</label>
                    <Input
                      value={formData.sampleType}
                      onChange={(e) => setFormData({ ...formData, sampleType: e.target.value })}
                      placeholder="Blood (EDTA)"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Turnaround Time (hours) *</label>
                    <Input
                      type="number"
                      value={formData.turnaroundTime}
                      onChange={(e) => setFormData({ ...formData, turnaroundTime: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Price (₹) *</label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              {/* Parameters */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Test Parameters *</h3>

                {/* Add Parameter Form */}
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-base">Add Parameter</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Parameter Name *</label>
                        <Input
                          value={newParam.name}
                          onChange={(e) => setNewParam({ ...newParam, name: e.target.value })}
                          placeholder="Hemoglobin"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Unit</label>
                        <Input
                          value={newParam.unit}
                          onChange={(e) => setNewParam({ ...newParam, unit: e.target.value })}
                          placeholder="g/dL"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Reference Min</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newParam.referenceMin}
                          onChange={(e) => setNewParam({ ...newParam, referenceMin: e.target.value })}
                          placeholder="12.0"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Reference Max</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newParam.referenceMax}
                          onChange={(e) => setNewParam({ ...newParam, referenceMax: e.target.value })}
                          placeholder="16.0"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-gray-700">Reference Text</label>
                        <Input
                          value={newParam.referenceText}
                          onChange={(e) => setNewParam({ ...newParam, referenceText: e.target.value })}
                          placeholder="Normal range (optional)"
                        />
                      </div>
                    </div>
                    <Button type="button" onClick={addParameter} size="sm" className="mt-3">
                      <Plus className="h-4 w-4 mr-1" />Add Parameter
                    </Button>
                  </CardContent>
                </Card>

                {/* Parameters List */}
                {formData.parameters.length > 0 && (
                  <div className="space-y-2">
                    {formData.parameters.map((param, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{param.name}</div>
                          <div className="text-sm text-gray-600">
                            {param.unit && <span className="mr-3">Unit: {param.unit}</span>}
                            {param.referenceRange?.min !== undefined && param.referenceRange?.max !== undefined && (
                              <span>Range: {param.referenceRange.min} - {param.referenceRange.max}</span>
                            )}
                            {param.referenceRange?.text && (
                              <span className="ml-2 text-gray-500">({param.referenceRange.text})</span>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParameter(index)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSubmit} disabled={saving || !formData.name || !formData.code}>
                {saving ? 'Saving...' : editing ? 'Update Test' : 'Create Test'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search tests by name or code..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={categoryFilter} onValueChange={(value) => { setCategoryFilter(value); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Hematology">Hematology</SelectItem>
                <SelectItem value="Biochemistry">Biochemistry</SelectItem>
                <SelectItem value="Microbiology">Microbiology</SelectItem>
                <SelectItem value="Serology">Serology</SelectItem>
                <SelectItem value="Immunology">Immunology</SelectItem>
                <SelectItem value="Molecular">Molecular</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchTests}>
              <RotateCcw className="h-4 w-4 mr-1" />Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tests ({tests.length})</CardTitle>
          <CardDescription>Laboratory test catalog with parameters and pricing</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading tests...</div>
          ) : tests.length === 0 ? (
            <div className="text-center py-12">
              <TestTube className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No tests found</p>
              <p className="text-sm text-gray-400 mt-1">Create your first test to get started</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test Code</TableHead>
                    <TableHead>Test Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Sample Type</TableHead>
                    <TableHead>Parameters</TableHead>
                    <TableHead>TAT</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((test) => (
                    <TableRow key={test._id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">{test.code}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{test.name}</TableCell>
                      <TableCell>
                        <Badge className="bg-purple-100 text-purple-800">{test.category}</Badge>
                      </TableCell>
                      <TableCell><span className="text-sm">{test.sampleType}</span></TableCell>
                      <TableCell>
                        <Badge variant="secondary">{test.parameters.length} params</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Clock className="h-3 w-3 mr-1 text-gray-400" />
                          {test.turnaroundTime}h
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center font-medium">
                          <DollarSign className="h-3 w-3" />₹{test.price}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={test.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {test.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openDetails(test)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(test)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(test._id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Test Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Test Details</DialogTitle>
            <DialogDescription>Complete test information and parameters</DialogDescription>
          </DialogHeader>
          {viewingTest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Test Name</label>
                  <p className="text-lg font-semibold">{viewingTest.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Test Code</label>
                  <p className="text-lg font-mono font-semibold">{viewingTest.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p>{viewingTest.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Department</label>
                  <p>{viewingTest.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Sample Type</label>
                  <p>{viewingTest.sampleType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Turnaround Time</label>
                  <p>{viewingTest.turnaroundTime} hours</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Price</label>
                  <p className="text-lg font-semibold">₹{viewingTest.price}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge className={viewingTest.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {viewingTest.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Parameters ({viewingTest.parameters.length})</h4>
                <div className="space-y-2">
                  {viewingTest.parameters.map((param, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium">{param.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {param.unit && <span className="mr-4">Unit: {param.unit}</span>}
                        {param.referenceRange?.min !== undefined && param.referenceRange?.max !== undefined && (
                          <span>Reference Range: {param.referenceRange.min} - {param.referenceRange.max}</span>
                        )}
                        {param.referenceRange?.text && (
                          <div className="text-gray-500 mt-1">{param.referenceRange.text}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
