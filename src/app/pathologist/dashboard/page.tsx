import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, AlertTriangle, CheckCircle, Clock, Microscope } from 'lucide-react';

export default function PathologistDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pathologist Dashboard</h1>
          <p className="text-gray-600">Review and verify laboratory test results</p>
        </div>
        <Link href="/pathologist/results">
          <Button size="lg">
            <Microscope className="h-5 w-5 mr-2" />
            Review Results
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Results</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">0</div>
            <p className="text-xs text-muted-foreground">Urgent attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Approved results</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Published reports</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common pathologist tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/pathologist/results?status=SUBMITTED">
              <button className="w-full p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors">
                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-900">Review Results</p>
              </button>
            </Link>
            
            <Link href="/pathologist/results?flag=CRITICAL">
              <button className="w-full p-4 bg-red-50 hover:bg-red-100 rounded-lg text-center transition-colors">
                <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-red-900">Critical Results</p>
              </button>
            </Link>
            
            <Link href="/pathologist/reports">
              <button className="w-full p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors">
                <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-900">Generate Reports</p>
              </button>
            </Link>
            
            <Link href="/pathologist/consultations">
              <button className="w-full p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors">
                <Microscope className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-purple-900">Consultations</p>
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Reviews</CardTitle>
          <CardDescription>Results waiting for pathologist review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-600 py-8">
            <Microscope className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm">No pending reviews</p>
            <Link href="/pathologist/results">
              <Button className="mt-4" variant="outline">
                View All Results
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
