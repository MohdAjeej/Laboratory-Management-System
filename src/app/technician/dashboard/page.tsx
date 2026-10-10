import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TestTube, Microscope, Clock, CheckCircle, ListChecks } from 'lucide-react';

export default function TechnicianDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laboratory Technician Dashboard</h1>
          <p className="text-gray-600">Sample processing and testing workflow</p>
        </div>
        <Link href="/technician/samples">
          <Button size="lg">
            <ListChecks className="h-5 w-5 mr-2" />
            View All Samples
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Samples to Process</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests in Progress</CardTitle>
            <Microscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Results</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Awaiting entry</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Tests completed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Laboratory workflow tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/technician/samples">
              <button className="w-full p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors">
                <TestTube className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-900">Process Samples</p>
              </button>
            </Link>
            
            <Link href="/technician/samples?status=RECEIVED">
              <button className="w-full p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors">
                <Microscope className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-900">Run Tests</p>
              </button>
            </Link>
            
            <Link href="/technician/results">
              <button className="w-full p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors">
                <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-purple-900">View Results</p>
              </button>
            </Link>
            
            <Link href="/technician/quality-control">
              <button className="w-full p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-center transition-colors">
                <CheckCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-orange-900">Quality Control</p>
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Samples</CardTitle>
          <CardDescription>Latest samples received for processing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-600 py-8">
            <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm">No samples to display</p>
            <Link href="/technician/samples">
              <Button className="mt-4" variant="outline">
                View All Samples
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}