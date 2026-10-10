'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  TestTube, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Barcode,
  Calendar
} from 'lucide-react';

interface Sample {
  _id: string;
  sampleId: string;
  orderId: any;
  patientId: any;
  sampleType: string;
  barcode: string;
  status: string;
  collectionDate?: string;
  receiptDate?: string;
  collectedBy?: string;
  createdAt: string;
}

export default function TechnicianSamplesPage() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchSamples();
  }, [statusFilter]);

  const fetchSamples = async () => {
    setLoading(true);
    setError('');
    
    try {
      let url = '/api/technician/samples';
      if (statusFilter) {
        url += `?status=${statusFilter}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setSamples(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch samples');
      }
    } catch (err) {
      setError('An error occurred while fetching samples');
    } finally {
      setLoading(false);
    }
  };

  const updateSampleStatus = async (sampleId: string, newStatus: string) => {
    setUpdating(sampleId);
    setError('');
    
    try {
      const response = await fetch(`/api/technician/samples/${sampleId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Refresh samples list
        await fetchSamples();
      } else {
        setError(data.error || 'Failed to update sample status');
      }
    } catch (err) {
      setError('An error occurred while updating status');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COLLECTED':
        return 'bg-blue-100 text-blue-800';
      case 'RECEIVED':
        return 'bg-green-100 text-green-800';
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />;
      case 'PROCESSING':
        return <Clock className="h-4 w-4" />;
      default:
        return <TestTube className="h-4 w-4" />;
    }
  };

  const filteredSamples = samples.filter(sample =>
    sample.sampleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sample.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sample.patientId?.patientId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sample Management</h1>
        <p className="text-gray-600">Track and process laboratory samples</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by Sample ID, Barcode, or Patient ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === '' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'COLLECTED' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('COLLECTED')}
              >
                Collected
              </Button>
              <Button
                variant={statusFilter === 'RECEIVED' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('RECEIVED')}
              >
                Received
              </Button>
              <Button
                variant={statusFilter === 'PROCESSING' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('PROCESSING')}
              >
                Processing
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-2 pt-6">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Samples List */}
      {loading ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">Loading samples...</p>
          </CardContent>
        </Card>
      ) : filteredSamples.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TestTube className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Samples Found</h3>
            <p className="text-gray-600 text-center max-w-sm">
              {searchTerm || statusFilter
                ? 'No samples match your search criteria'
                : 'No samples available for processing'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSamples.map((sample) => (
            <Card key={sample._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TestTube className="h-5 w-5" />
                      {sample.sampleId}
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Barcode className="h-3 w-3" />
                        {sample.barcode}
                      </span>
                      <span>•</span>
                      <span>{sample.sampleType}</span>
                    </CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(sample.status)} flex items-center gap-1`}>
                    {getStatusIcon(sample.status)}
                    {sample.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Sample Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Order ID</p>
                      <p className="font-medium text-sm">
                        {sample.orderId?.orderId || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Patient</p>
                      <p className="font-medium text-sm">
                        {sample.patientId?.patientId || 'N/A'}
                      </p>
                    </div>
                    {sample.collectionDate && (
                      <div>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Collected
                        </p>
                        <p className="font-medium text-sm">
                          {new Date(sample.collectionDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {sample.collectedBy && (
                      <div>
                        <p className="text-xs text-gray-600">Collected By</p>
                        <p className="font-medium text-sm">{sample.collectedBy}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    {sample.status === 'COLLECTED' && (
                      <Button
                        size="sm"
                        onClick={() => updateSampleStatus(sample._id, 'RECEIVED')}
                        disabled={updating === sample._id}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {updating === sample._id ? 'Updating...' : 'Mark Received'}
                      </Button>
                    )}
                    {sample.status === 'RECEIVED' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateSampleStatus(sample._id, 'PROCESSING')}
                          disabled={updating === sample._id}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          {updating === sample._id ? 'Updating...' : 'Start Processing'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateSampleStatus(sample._id, 'REJECTED')}
                          disabled={updating === sample._id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    {sample.status === 'PROCESSING' && (
                      <Button
                        size="sm"
                        onClick={() => updateSampleStatus(sample._id, 'COMPLETED')}
                        disabled={updating === sample._id}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {updating === sample._id ? 'Updating...' : 'Mark Completed'}
                      </Button>
                    )}
                    {sample.status === 'REJECTED' && (
                      <Badge variant="outline" className="text-red-600">
                        Sample Rejected
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
