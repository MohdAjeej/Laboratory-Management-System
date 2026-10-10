'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Microscope, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  FileText
} from 'lucide-react';

interface TestResult {
  _id: string;
  resultId: string;
  orderId: any;
  sampleId: any;
  patientId: any;
  testId: any;
  parameters: any[];
  status: string;
  enteredBy?: any;
  enteredAt?: string;
  technicalComments?: string;
  clinicalSignificance?: string;
  createdAt: string;
}

export default function PathologistResultsPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('SUBMITTED');
  const [error, setError] = useState('');
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState('');

  useEffect(() => {
    fetchResults();
  }, [statusFilter]);

  const fetchResults = async () => {
    setLoading(true);
    setError('');
    
    try {
      let url = '/api/pathologist/results';
      if (statusFilter) {
        url += `?status=${statusFilter}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setResults(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch results');
      }
    } catch (err) {
      setError('An error occurred while fetching results');
    } finally {
      setLoading(false);
    }
  };

  const verifyResult = async (resultId: string, approve: boolean) => {
    setVerifying(true);
    setError('');
    
    try {
      const response = await fetch(`/api/pathologist/results/${resultId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          approve,
          clinicalSignificance: clinicalNotes 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Refresh results list
        await fetchResults();
        setSelectedResult(null);
        setClinicalNotes('');
      } else {
        setError(data.error || 'Failed to verify result');
      }
    } catch (err) {
      setError('An error occurred while verifying result');
    } finally {
      setVerifying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-800';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'ABNORMAL':
        return 'bg-orange-100 text-orange-800';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800';
      case 'REJECTED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFlagIcon = (flag?: string) => {
    switch (flag) {
      case 'HIGH':
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'LOW':
        return <TrendingDown className="h-4 w-4 text-blue-600" />;
      case 'CRITICAL':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'ABNORMAL':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'NORMAL':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
  };

  const filteredResults = results.filter(result =>
    result.resultId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.patientId?.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.testId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Results Review</h1>
        <p className="text-gray-600">Review and verify laboratory test results</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by Result ID, Patient ID, or Test Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'SUBMITTED' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('SUBMITTED')}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'CRITICAL' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('CRITICAL')}
              >
                Critical
              </Button>
              <Button
                variant={statusFilter === 'ABNORMAL' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('ABNORMAL')}
              >
                Abnormal
              </Button>
              <Button
                variant={statusFilter === 'VERIFIED' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('VERIFIED')}
              >
                Verified
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

      {/* Results List */}
      {loading ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">Loading results...</p>
          </CardContent>
        </Card>
      ) : filteredResults.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Microscope className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
            <p className="text-gray-600 text-center max-w-sm">
              {searchTerm || statusFilter
                ? 'No results match your search criteria'
                : 'No results available for review'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredResults.map((result) => (
            <Card key={result._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Microscope className="h-5 w-5" />
                      {result.testId?.name || 'Unknown Test'}
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-3">
                      <span>Result ID: {result.resultId}</span>
                      <span>•</span>
                      <span>Patient: {result.patientId?.patientId || 'N/A'}</span>
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(result.status)}>
                    {result.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Test Information */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b">
                    <div>
                      <p className="text-xs text-gray-600">Test Code</p>
                      <p className="font-medium text-sm">{result.testId?.code || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Category</p>
                      <p className="font-medium text-sm">{result.testId?.category || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Sample ID</p>
                      <p className="font-medium text-sm">{result.sampleId?.sampleId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Entered By</p>
                      <p className="font-medium text-sm">
                        {result.enteredBy ? `${result.enteredBy.firstName} ${result.enteredBy.lastName}` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Parameters */}
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Test Parameters:</h4>
                    <div className="space-y-2">
                      {result.parameters?.map((param: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm">{param.name}</p>
                              {getFlagIcon(param.flag)}
                              {param.flag && param.flag !== 'NORMAL' && (
                                <Badge variant="outline" className="text-xs">
                                  {param.flag}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Value: </span>
                              <span className="font-semibold">{param.value} {param.unit}</span>
                            </div>
                            {param.referenceRange && (
                              <div>
                                <span className="text-gray-600">Reference: </span>
                                <span>{param.referenceRange}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Technical Comments */}
                  {result.technicalComments && (
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-xs font-semibold text-blue-900">Technical Comments:</p>
                      <p className="text-sm text-blue-800 mt-1">{result.technicalComments}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {result.status !== 'VERIFIED' && result.status !== 'REJECTED' && (
                    <div className="pt-4 border-t">
                      {selectedResult?._id === result._id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-1">
                              Clinical Significance / Notes (Optional)
                            </label>
                            <Textarea
                              placeholder="Add clinical interpretation or notes..."
                              value={clinicalNotes}
                              onChange={(e) => setClinicalNotes(e.target.value)}
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => verifyResult(result._id, true)}
                              disabled={verifying}
                              className="flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {verifying ? 'Verifying...' : 'Approve & Verify'}
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => verifyResult(result._id, false)}
                              disabled={verifying}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedResult(null);
                                setClinicalNotes('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setSelectedResult(result)}
                          className="w-full"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Review & Verify Result
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
