import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Download, Calendar, CheckCircle, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import connectToDatabase from '@/lib/mongodb';
import Report from '@/models/Report';
import Patient from '@/models/Patient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

async function getPatientReports(userEmail: string) {
  try {
    await connectToDatabase();

    // Find patient record by user email
    const patient = await Patient.findOne({ email: userEmail });
    
    if (!patient) {
      return [];
    }

    // Fetch all reports for this patient
    const reports = await Report.find({ patientId: patient._id })
      .populate('testResultId', 'testId')
      .populate('generatedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(reports));
  } catch (error) {
    console.error('Error fetching patient reports:', error);
    return [];
  }
}

export default async function PatientReportsPage() {
  await cookies();
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  const reports = await getPatientReports(user.email);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">Download and view your medical reports</p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Available</h3>
            <p className="text-gray-600 text-center max-w-sm">
              Your consolidated medical reports will be available here once your test results are finalized.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report: any) => (
            <Card key={report._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Report {report.reportId}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Order: {report.orderId?.orderId || 'N/A'}
                      {report.version > 1 && (
                        <span className="ml-2 text-orange-600">• Version {report.version}</span>
                      )}
                    </CardDescription>
                  </div>
                  <Badge className="bg-green-50 text-green-700 border-green-300">
                    {report.status === 'DOWNLOADED' ? 'Downloaded' : 'Published'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Report Dates */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-4 border-b">
                    {report.generatedAt && (
                      <div>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Generated
                        </p>
                        <p className="font-medium text-sm">
                          {new Date(report.generatedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                    {report.verifiedAt && (
                      <div>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </p>
                        <p className="font-medium text-sm">
                          {new Date(report.verifiedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                    {report.publishedAt && (
                      <div>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          Published
                        </p>
                        <p className="font-medium text-sm">
                          {new Date(report.publishedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Test Results Included */}
                  {report.testResults && report.testResults.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">
                        Included Tests ({report.testResults.length}):
                      </h4>
                      <div className="space-y-2">
                        {report.testResults.map((result: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 bg-gray-50 p-3 rounded">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {result.testId?.name || 'Unknown Test'}
                              </p>
                              <p className="text-xs text-gray-600">
                                {result.testId?.code || 'N/A'} • {result.testId?.category || 'N/A'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Signatures */}
                  {report.signatures && report.signatures.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-sm text-blue-900 mb-2 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Verified & Signed By:
                      </h4>
                      <div className="space-y-2">
                        {report.signatures.map((sig: any, index: number) => (
                          <div key={index} className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm text-blue-900">{sig.name}</p>
                              <p className="text-xs text-blue-700">{sig.role}</p>
                            </div>
                            <p className="text-xs text-blue-700">
                              {new Date(sig.signedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Amendment Information */}
                  {report.amendmentReason && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <p className="font-semibold text-sm text-orange-900 mb-1">
                        Report Amended
                      </p>
                      <p className="text-sm text-orange-800">
                        Reason: {report.amendmentReason}
                      </p>
                    </div>
                  )}

                  {/* Notes */}
                  {report.notes && (
                    <div className="text-sm">
                      <p className="text-gray-600 font-semibold">Additional Notes:</p>
                      <p className="text-gray-700 italic">{report.notes}</p>
                    </div>
                  )}

                  {/* Download Button */}
                  <div className="pt-4 border-t">
                    {report.pdfUrl ? (
                      <Button className="w-full" asChild>
                        <a href={report.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF Report
                        </a>
                      </Button>
                    ) : (
                      <Button className="w-full" disabled>
                        <Download className="h-4 w-4 mr-2" />
                        PDF Generation Pending
                      </Button>
                    )}
                  </div>

                  {/* Download History */}
                  {report.downloadedAt && report.downloadedAt.length > 0 && (
                    <div className="text-xs text-gray-500">
                      <p>
                        Last downloaded: {new Date(report.downloadedAt[report.downloadedAt.length - 1]).toLocaleString()}
                      </p>
                      {report.downloadedAt.length > 1 && (
                        <p>Total downloads: {report.downloadedAt.length}</p>
                      )}
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div className="text-xs text-gray-500 italic pt-2 border-t">
                    <p>
                      This is an official medical report. Please keep it secure and share only with authorized healthcare providers.
                      For any questions about your results, please consult with your physician.
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
