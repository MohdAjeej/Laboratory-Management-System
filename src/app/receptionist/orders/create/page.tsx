'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Trash2, AlertCircle, CheckCircle, Hospital as HospitalIcon, Stethoscope } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CreateOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingPatient, setSearchingPatient] = useState(false);
  
  // Hospital and Doctor selection
  const [orderSource, setOrderSource] = useState<'WALK_IN' | 'HOSPITAL_REFERRAL' | 'DOCTOR_REFERRAL' | 'HOME_COLLECTION'>('WALK_IN');
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  
  const [selectedTests, setSelectedTests] = useState<any[]>([]);
  const [testSearch, setTestSearch] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [searchingTests, setSearchingTests] = useState(false);
  
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL');
  const [notes, setNotes] = useState('');

  // Load hospitals on mount
  useEffect(() => {
    loadHospitals();
  }, []);

  // Load doctors when hospital is selected
  useEffect(() => {
    if (selectedHospital) {
      loadDoctors(selectedHospital._id);
    } else {
      setDoctors([]);
      setSelectedDoctor(null);
    }
  }, [selectedHospital]);

  // Load hospitals
  const loadHospitals = async () => {
    setLoadingHospitals(true);
    try {
      const response = await fetch('/api/hospitals?page=1&limit=100&isActive=true');
      const data = await response.json();
      if (response.ok && data.success) {
        setHospitals(data.data.hospitals || []);
      }
    } catch (err) {
      console.error('Failed to load hospitals', err);
    } finally {
      setLoadingHospitals(false);
    }
  };

  // Load doctors for hospital
  const loadDoctors = async (hospitalId: string) => {
    setLoadingDoctors(true);
    try {
      const response = await fetch(`/api/doctors?hospitalId=${hospitalId}&isActive=true`);
      const data = await response.json();
      if (response.ok && data.success) {
        setDoctors(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load doctors', err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Search for patient
  const handlePatientSearch = async () => {
    if (!patientSearch.trim()) return;
    
    setSearchingPatient(true);
    setError('');
    
    try {
      const response = await fetch(`/api/receptionist/patients/search?q=${encodeURIComponent(patientSearch)}`);
      const data = await response.json();
      
      if (response.ok) {
        setSearchResults(data.data || []);
      } else {
        setError(data.error || 'Failed to search patients');
      }
    } catch (err) {
      setError('An error occurred while searching');
    } finally {
      setSearchingPatient(false);
    }
  };

  // Search for tests
  const handleTestSearch = async () => {
    if (!testSearch.trim()) return;
    
    setSearchingTests(true);
    setError('');
    
    try {
      const response = await fetch(`/api/receptionist/tests/search?q=${encodeURIComponent(testSearch)}`);
      const data = await response.json();
      
      if (response.ok) {
        setTestResults(data.data || []);
      } else {
        setError(data.error || 'Failed to search tests');
      }
    } catch (err) {
      setError('An error occurred while searching');
    } finally {
      setSearchingTests(false);
    }
  };

  // Add test to order
  const addTest = (test: any) => {
    if (selectedTests.find(t => t._id === test._id)) {
      setError('Test already added to order');
      return;
    }
    
    setSelectedTests([...selectedTests, { ...test, quantity: 1 }]);
    setTestSearch('');
    setTestResults([]);
    setError('');
  };

  // Remove test from order
  const removeTest = (testId: string) => {
    setSelectedTests(selectedTests.filter(t => t._id !== testId));
  };

  // Calculate totals
  const subtotal = selectedTests.reduce((sum, test) => sum + test.price, 0);
  const tax = subtotal * 0.05; // 5% tax
  const total = subtotal + tax;

  // Submit order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      setError('Please select a patient');
      return;
    }
    
    if (orderSource === 'HOSPITAL_REFERRAL' && !selectedHospital) {
      setError('Please select a hospital for hospital referral orders');
      return;
    }
    
    if (selectedTests.length === 0) {
      setError('Please add at least one test');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/receptionist/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient._id,
          hospitalId: selectedHospital?._id || null,
          doctorId: selectedDoctor?._id || null,
          items: selectedTests.map(test => ({
            testId: test._id,
            quantity: 1,
            price: test.price,
            discount: 0,
          })),
          priority,
          notes,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(`Order ${data.data.orderId} created successfully!`);
        setTimeout(() => {
          router.push('/receptionist/orders');
        }, 2000);
      } else {
        setError(data.error || 'Failed to create order');
      }
    } catch (err) {
      setError('An error occurred while creating order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Order</h1>
        <p className="text-gray-600">Register a new laboratory test order</p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-2 pt-6">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-2 pt-6">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800">{success}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Select Patient</CardTitle>
            <CardDescription>Search and select the patient for this order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedPatient ? (
              <>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by Patient ID, name, phone, or email..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handlePatientSearch())}
                  />
                  <Button 
                    type="button" 
                    onClick={handlePatientSearch}
                    disabled={searchingPatient}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {searchingPatient ? 'Searching...' : 'Search'}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((patient) => (
                      <div
                        key={patient._id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setSearchResults([]);
                          setPatientSearch('');
                        }}
                      >
                        <div>
                          <p className="font-medium">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {patient.patientId} • {patient.phone} • {patient.email}
                          </p>
                        </div>
                        <Button type="button" size="sm">Select</Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex justify-between items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="font-semibold text-green-900">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </p>
                  <p className="text-sm text-green-700">
                    {selectedPatient.patientId} • {selectedPatient.phone}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPatient(null)}
                >
                  Change
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Source & Hospital/Doctor Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Order Source</CardTitle>
            <CardDescription>Select the order source and referral details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Order Source */}
            <div>
              <Label>Order Source</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {[
                  { value: 'WALK_IN', label: 'Walk-in' },
                  { value: 'HOSPITAL_REFERRAL', label: 'Hospital Referral' },
                  { value: 'DOCTOR_REFERRAL', label: 'Doctor Referral' },
                  { value: 'HOME_COLLECTION', label: 'Home Collection' },
                ].map((source) => (
                  <Button
                    key={source.value}
                    type="button"
                    variant={orderSource === source.value ? 'default' : 'outline'}
                    onClick={() => {
                      setOrderSource(source.value as any);
                      if (source.value === 'WALK_IN') {
                        setSelectedHospital(null);
                        setSelectedDoctor(null);
                      }
                    }}
                    className="w-full"
                  >
                    {source.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Hospital Selection (for Hospital Referral) */}
            {(orderSource === 'HOSPITAL_REFERRAL' || orderSource === 'DOCTOR_REFERRAL') && (
              <div>
                <Label className="flex items-center gap-2">
                  <HospitalIcon className="h-4 w-4" />
                  Hospital {orderSource === 'HOSPITAL_REFERRAL' ? '*' : '(Optional)'}
                </Label>
                <Select
                  value={selectedHospital?._id || ''}
                  onValueChange={(value) => {
                    const hospital = hospitals.find(h => h._id === value);
                    setSelectedHospital(hospital || null);
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={loadingHospitals ? 'Loading hospitals...' : 'Select a hospital'} />
                  </SelectTrigger>
                  <SelectContent>
                    {hospitals.map((hospital) => (
                      <SelectItem key={hospital._id} value={hospital._id}>
                        {hospital.name} ({hospital.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Doctor Selection (when hospital is selected) */}
            {selectedHospital && (
              <div>
                <Label className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Referring Doctor (Optional)
                </Label>
                {loadingDoctors ? (
                  <p className="text-sm text-gray-500 mt-2">Loading doctors...</p>
                ) : doctors.length === 0 ? (
                  <p className="text-sm text-gray-500 mt-2">No doctors found for this hospital</p>
                ) : (
                  <Select
                    value={selectedDoctor?._id || ''}
                    onValueChange={(value) => {
                      const doctor = doctors.find(d => d._id === value);
                      setSelectedDoctor(doctor || null);
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a doctor (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor._id} value={doctor._id}>
                          Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Selected Hospital/Doctor Summary */}
            {selectedHospital && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <HospitalIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900">{selectedHospital.name}</p>
                    <p className="text-sm text-blue-700">Code: {selectedHospital.code}</p>
                    {selectedDoctor && (
                      <div className="mt-2 flex items-start gap-2">
                        <Stethoscope className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                          </p>
                          <p className="text-xs text-blue-700">{selectedDoctor.specialization}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Add Tests</CardTitle>
            <CardDescription>Search and add tests to this order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search tests by name or code..."
                value={testSearch}
                onChange={(e) => setTestSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTestSearch())}
              />
              <Button 
                type="button" 
                onClick={handleTestSearch}
                disabled={searchingTests}
              >
                <Search className="h-4 w-4 mr-2" />
                {searchingTests ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {testResults.length > 0 && (
              <div className="space-y-2">
                {testResults.map((test) => (
                  <div
                    key={test._id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{test.name}</p>
                      <p className="text-sm text-gray-600">
                        {test.code} • {test.category} • ₹{test.price}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addTest(test)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {selectedTests.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <h4 className="font-semibold">Selected Tests ({selectedTests.length})</h4>
                {selectedTests.map((test) => (
                  <div
                    key={test._id}
                    className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-blue-900">{test.name}</p>
                      <p className="text-sm text-blue-700">{test.code} • {test.category}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-blue-900">₹{test.price}</p>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeTest(test._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Order Details</CardTitle>
            <CardDescription>Set priority and add notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Priority</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={priority === 'NORMAL' ? 'default' : 'outline'}
                  onClick={() => setPriority('NORMAL')}
                >
                  Normal
                </Button>
                <Button
                  type="button"
                  variant={priority === 'URGENT' ? 'default' : 'outline'}
                  onClick={() => setPriority('URGENT')}
                  className={priority === 'URGENT' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  Urgent
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                className="w-full mt-1 p-2 border rounded-md"
                rows={3}
                placeholder="Add any special instructions or notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        {selectedTests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (5%):</span>
                <span className="font-medium">₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-3 border-t">
                <span>Total:</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="flex gap-4">
          <Button
            type="submit"
            size="lg"
            className="flex-1"
            disabled={loading || !selectedPatient || selectedTests.length === 0}
          >
            {loading ? 'Creating Order...' : 'Create Order'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
