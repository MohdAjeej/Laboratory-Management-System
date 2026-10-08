import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Force dynamic rendering - disable static generation
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Force dynamic rendering by accessing cookies
  await cookies();
  
  // Check authentication
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.fullName || `${user.firstName} ${user.lastName}`}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{user.fullName || `${user.firstName} ${user.lastName}`}</div>
                <div className="text-xs text-gray-500">{user.role}</div>
              </div>
              <form action="/api/auth/logout" method="POST">
                <Button variant="outline" type="submit">
                  Logout
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div><span className="font-medium">ID:</span> {user.userId || user.id}</div>
                <div><span className="font-medium">Email:</span> {user.email}</div>
                <div><span className="font-medium">Role:</span> {user.role}</div>
                {user.hospitalId && (
                  <div><span className="font-medium">Hospital ID:</span> {user.hospitalId}</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current system information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div><span className="font-medium">Database:</span> <span className="text-green-600">Connected</span></div>
                <div><span className="font-medium">Authentication:</span> <span className="text-green-600">Active</span></div>
                <div><span className="font-medium">Version:</span> 1.0.0</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Overview of system data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div><span className="font-medium">Patients:</span> 4</div>
                <div><span className="font-medium">Hospitals:</span> 3</div>
                <div><span className="font-medium">Tests:</span> 5</div>
                <div><span className="font-medium">Users:</span> 8</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Manage patient records and information</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Create and manage test orders</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Samples</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Track sample collection and processing</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Generate and view lab reports</p>
            </CardContent>
          </Card>
        </div>

        {/* Development Note */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">🚀 Development Progress</h3>
          <p className="text-blue-800 text-sm">
            Authentication system is working! MongoDB connection established with seeded data. 
            Next steps include building the full dashboard navigation and module pages.
          </p>
        </div>
      </div>
    </div>
  );
}