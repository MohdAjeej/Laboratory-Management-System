import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Mail, Phone, MapPin, Shield, AlertCircle } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function PatientProfilePage() {
  await cookies();
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  // TODO: Fetch actual patient data from database
  // For now, showing only authenticated user data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600">Manage your personal information</p>
      </div>

      {/* Info Alert */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900 font-medium">Complete Your Profile</p>
            <p className="text-sm text-blue-800">
              Please visit a reception desk to complete your patient profile with medical history and contact details.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>Your registered account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <Input value={user.email} disabled className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">User ID</label>
              <Input value={user.id} disabled className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Role</label>
              <Input value={user.role} disabled className="mt-1" />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information - Empty State */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>Not yet provided</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Your phone number and address details need to be registered at the hospital reception.
            </p>
          </CardContent>
        </Card>

        {/* Medical Information - Empty State */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Medical Information
            </CardTitle>
            <CardDescription>Not yet provided</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Medical history, allergies, and other health information will be recorded during your hospital visit.
            </p>
          </CardContent>
        </Card>

        {/* Account Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Security
            </CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button variant="outline">Change Password</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
