"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  User, 
  Calendar,
  Download
} from 'lucide-react'

interface VerifiedReport {
  reportId: string
  reportDate: string
  status: string
  patient: {
    name: string
    patientId: string
    age: number
    gender: string
  }
  hospital: {
    name: string
    address: any
  } | null
  tests: Array<{
    name: string
    code: string
  }>
  results: any[]
  observations: string
  verifiedBy: {
    name: string
    qualification: string
  } | null
  verifiedAt: string
  pdfUrl?: string
}

export default function VerifyReportPage() {
  const [reportId, setReportId] = useState('')
  const [patientDOB, setPatientDOB] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState<VerifiedReport | null>(null)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reportId || !patientDOB) {
      setError('Please enter both Report ID and Date of Birth')
      return
    }

    try {
      setLoading(true)
      setError('')
      setReport(null)

      const res = await fetch('/api/reports/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: reportId.trim(),
          patientDOB
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to verify report')
        return
      }

      if (data.success) {
        setReport(data.data)
      }
    } catch (err: any) {
      console.error('Verification error:', err)
      setError('Failed to verify report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setReportId('')
    setPatientDOB('')
    setError('')
    setReport(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 rounded-full p-4">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Report Verification</h1>
          <p className="text-gray-600">Verify the authenticity of your laboratory reports</p>
        </div>

        {!report ? (
          /* Verification Form */
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Verify Your Report</CardTitle>
              <CardDescription>
                Enter your report ID and date of birth to verify your laboratory report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-6">
                <div>
                  <Label htmlFor="reportId">Report ID *</Label>
                  <Input
                    id="reportId"
                    value={reportId}
                    onChange={(e) => setReportId(e.target.value)}
                    placeholder="e.g., RPT-20241008-001"
                    className="mt-1"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    You can find the Report ID on your report document
                  </p>
                </div>

                <div>
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={patientDOB}
                    onChange={(e) => setPatientDOB(e.target.value)}
                    className="mt-1"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter the patient's date of birth as registered
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Verify Report
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleReset}
                  >
                    Clear
                  </Button>
                </div>
              </form>

              {/* Information */}
              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-2">How to verify:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Locate the Report ID on your laboratory report</li>
                      <li>Enter the Report ID in the field above</li>
                      <li>Enter the patient's date of birth</li>
                      <li>Click "Verify Report" to check authenticity</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Verified Report Display */
          <div className="space-y-6">
            {/* Success Message */}
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-900 font-medium">
                Report verified successfully! This is an authentic report.
              </AlertDescription>
            </Alert>

            {/* Report Details */}
            <Card className="shadow-xl">
              <CardHeader className="bg-green-50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Shield className="h-6 w-6 text-green-600" />
                      Verified Report
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Report ID: <span className="font-mono font-semibold">{report.reportId}</span>
                    </CardDescription>
                  </div>
                  <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    VERIFIED
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Patient Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-600" />
                    Patient Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{report.patient.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Patient ID</p>
                      <p className="font-medium font-mono">{report.patient.patientId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Age</p>
                      <p className="font-medium">{report.patient.age} years</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Gender</p>
                      <p className="font-medium capitalize">{report.patient.gender}</p>
                    </div>
                  </div>
                </div>

                {/* Report Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    Report Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Report Date</p>
                      <p className="font-medium">
                        {new Date(report.reportDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Verified By</p>
                      <p className="font-medium">
                        {report.verifiedBy?.name || 'Not specified'}
                        {report.verifiedBy?.qualification && (
                          <span className="text-sm text-gray-600"> ({report.verifiedBy.qualification})</span>
                        )}
                      </p>
                    </div>
                    {report.hospital && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Laboratory</p>
                        <p className="font-medium">{report.hospital.name}</p>
                        {report.hospital.address && (
                          <p className="text-sm text-gray-600">
                            {report.hospital.address.city}, {report.hospital.address.state}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tests Performed */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Tests Performed</h3>
                  <div className="space-y-2">
                    {report.tests.map((test, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{test.name}</span>
                        <span className="text-sm text-gray-600">({test.code})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  {report.pdfUrl && (
                    <Button className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleReset}>
                    Verify Another Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Security Notice</p>
                    <p>
                      This report has been verified against our secure database. 
                      The information displayed is authentic and matches our records.
                      If you notice any discrepancies, please contact the laboratory immediately.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
