import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import connectToDatabase from '@/lib/mongodb';
import TestResult from '@/models/TestResult';
import Patient from '@/models/Patient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

async function getPatientResults(userEmail: string) {
  try {
    await connectToDatabase();

    // Find patient record by user email
    const patient = await Patient.findOne({ email: userEmail });
    
    if (!patient) {
      return [];
    }

    // Fetch all results for this patient
    const results = await TestResult.find({ patientId: patient._id })
      .populate('testId', 'name code category normalRange')
      .populate('orderId', 'orderId')
      .populate('verifiedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(results));
  } catch (error) {
    console.error('Error fetching patient results:', error);
    return [];
  }
}

function getFlagIcon(flag?: string) {
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
}

function getFlagColor(flag?: string) {
  switch (flag) {
    case 'CRITICAL':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'HIGH':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'LOW':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'ABNORMAL':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'NORMAL':
      return 'bg-green-50 text-green-700 border-green-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

export default async function PatientResultsPage() {
  await cookies();
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  const results = await getPatientResults(user.email);
  
  // Count critical results
  const criticalCount = results.filter((r: any) => 
    r.parameters?.some((p: any) => p.flag === 'CRITICAL')
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Test Results</h1>
        <p className="text-gray-600">Access your laboratory test results</p>
      </div>

      {criticalCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="h-5 w-5" />
              Critical Results Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-800">
              You have {criticalCount} test result{criticalCount > 1 ? 's' : ''} with critical values. 
              Please consult with your healthcare provider immediately.
            </p>
          </CardContent>
        </Card>
      )}

      {results.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Available</h3>
            <p className="text-gray-600 text-center max-w-sm">
              Your test results will appear here once they are ready and verified by our laboratory staff.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {results.map((result: any) => (
            <Card key={result._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      {result.testId?.name || 'Unknown Test'}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Result ID: {result.resultId} • Order: {result.orderId?.orderId || 'N/A'}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    Verified
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Test Information */}
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                    <div>
                      <p className="text-xs text-gray-600">Test Code</p>
                      <p className="font-medium text-sm">{result.testId?.code || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Category</p>
                      <p className="font-medium text-sm">{result.testId?.category || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Verified Date</p>
                      <p className="font-medium text-sm">
                        {result.verifiedAt ? new Date(result.verifiedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Verified By</p>
                      <p className="font-medium text-sm">
                        {result.verifiedBy ? `${result.verifiedBy.firstName} ${result.verifiedBy.lastName}` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Parameters */}
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-3">Test Parameters:</h4>
                    <div className="space-y-2">
                      {result.parameters?.map((param: any, index: number) => (
                        <div 
                          key={index} 
                          className={`p-4 rounded-lg border ${getFlagColor(param.flag)}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm">{param.name}</p>
                                {getFlagIcon(param.flag)}
                                {param.flag && param.flag !== 'NORMAL' && (
                                  <Badge className={`text-xs ${getFlagColor(param.flag)}`}>
                                    {param.flag}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 mt-2">
                            <div>
                              <p className="text-xs text-gray-600">Value</p>
                              <p className="font-bold text-base">
                                {param.value} {param.unit && <span className="text-sm font-normal text-gray-600">{param.unit}</span>}
                              </p>
                            </div>
                            
                            {param.referenceRange && (
                              <div>
                                <p className="text-xs text-gray-600">Reference Range</p>
                                <p className="text-sm font-medium">{param.referenceRange}</p>
                              </div>
                            )}
                            
                            {param.flag && (
                              <div>
                                <p className="text-xs text-gray-600">Status</p>
                                <div className="flex items-center gap-1 text-sm font-medium">
                                  {getFlagIcon(param.flag)}
                                  <span>{param.flag}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {param.notes && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-xs text-gray-600">Notes:</p>
                              <p className="text-sm italic">{param.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Comments */}
                  {(result.technicalComments || result.clinicalSignificance) && (
                    <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                      {result.technicalComments && (
                        <div>
                          <p className="text-xs font-semibold text-blue-900">Technical Comments:</p>
                          <p className="text-sm text-blue-800">{result.technicalComments}</p>
                        </div>
                      )}
                      {result.clinicalSignificance && (
                        <div>
                          <p className="text-xs font-semibold text-blue-900">Clinical Significance:</p>
                          <p className="text-sm text-blue-800">{result.clinicalSignificance}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div className="text-xs text-gray-500 italic pt-2 border-t">
                    <p>
                      These results should be interpreted in the context of your clinical presentation. 
                      Please consult with your healthcare provider for proper interpretation and next steps.
                    </p>
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
