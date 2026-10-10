import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileText, DollarSign, Calendar, Plus } from 'lucide-react';

export default function ReceptionistDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Receptionist Dashboard</h1>
          <p className="text-gray-600">Patient registration and billing management</p>
        </div>
        <Link href="/receptionist/orders/create">
          <Button size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Create New Order
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">New patients registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Waiting for processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹0</div>
            <p className="text-xs text-muted-foreground">Total collections today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Scheduled today</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common receptionist tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/receptionist/patients/register">
              <button className="w-full p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-900">Register Patient</p>
              </button>
            </Link>
            
            <Link href="/receptionist/orders/create">
              <button className="w-full p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors">
                <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-900">Create Order</p>
              </button>
            </Link>
            
            <Link href="/receptionist/payments">
              <button className="w-full p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors">
                <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-purple-900">Process Payment</p>
              </button>
            </Link>
            
            <Link href="/receptionist/appointments">
              <button className="w-full p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-center transition-colors">
                <Calendar className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-orange-900">Schedule Appointment</p>
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest test orders created</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-600 py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm">No recent orders to display</p>
            <Link href="/receptionist/orders/create">
              <Button className="mt-4" variant="outline">
                Create First Order
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}