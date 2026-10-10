import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Mail, Phone, MapPin, Shield, AlertCircle, Calendar, Heart, Pill, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import connectToDatabase from '@/lib/mongodb';
import Patient from '@/models/Patient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

async function getPatientProfile(userEmail: string) {
  try {
    await connectToDatabase();

    // Find patient record by user email and populate user details
    const patient = await Patient.findOne({ email: userEmail })
      .populate('userId', 'firstName lastName email phoneNumber')
      .lean();
    
    if (!patient) {
      return null;
    }

    return JSON.parse(JSON.stringify(patient));
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    return null;
  }
}

export default async function PatientProfilePage() {
  await cookies();
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  const patient = await getPatientProfile(user.email);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600">Manage your personal information</p>
      </div>

      {/* Info Alert - Show only if no patient record */}
      {!patient && (
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
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        {patient && (
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <User className="h-6 w-6" />
                    {patient.firstName} {patient.lastName}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Patient ID: {patient.patientId}
                    {patient.isActive && (
                      <Badge className="ml-2 bg-green-100 text-green-800">Active</Badge>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date of Birth
                  </label>
                  <p className="mt-1 text-base">
                    {new Date(patient.dateOfBirth).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-gray-600">Age: {patient.age || 'N/A'} years</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Gender</label>
                  <p className="mt-1 text-base">{patient.gender}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </label>
                  <p className="mt-1 text-base">{patient.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>Your registered account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input value={userAccount?.email || user.email} disabled className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">User ID</label>
              <Input value={user.id} disabled className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Role</label>
              <Input value={userAccount?.role || user.role} disabled className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Account Status</label>
              <div className="mt-1">
                {userAccount?.isActive ? (
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        {patient?.address ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>Your registered address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Address</label>
                <p className="mt-1 text-sm">{patient.address.street}</p>
                <p className="text-sm">
                  {patient.address.city}, {patient.address.state} {patient.address.zipCode}
                </p>
                <p className="text-sm">{patient.address.country}</p>
              </div>
              {patient.email && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Email (Alternative)</label>
                  <p className="mt-1 text-sm">{patient.email}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
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
        )}

        {/* Emergency Contact */}
        {patient?.emergencyContact && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Emergency Contact
              </CardTitle>
              <CardDescription>In case of emergency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-base">{patient.emergencyContact.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-base">{patient.emergencyContact.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Relationship</label>
                <p className="mt-1 text-base">{patient.emergencyContact.relationship}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Medical History */}
        {patient?.medicalHistory ? (
          <Card className={!patient?.emergencyContact ? 'md:col-span-2' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-600" />
                Medical History
              </CardTitle>
              <CardDescription>Your recorded medical background</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{patient.medicalHistory}</p>
            </CardContent>
          </Card>
        ) : !patient?.emergencyContact && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Medical History
              </CardTitle>
              <CardDescription>Not yet provided</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Medical history will be recorded during your hospital visit.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Allergies */}
        {patient?.allergies && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Allergies
              </CardTitle>
              <CardDescription className="text-orange-600 font-medium">
                Important medical alert
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-orange-50 border border-orange-200 p-3 rounded">
                <p className="text-sm whitespace-pre-wrap text-orange-900">{patient.allergies}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Medications */}
        {patient?.currentMedications && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-blue-600" />
                Current Medications
              </CardTitle>
              <CardDescription>Medications you are currently taking</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{patient.currentMedications}</p>
            </CardContent>
          </Card>
        )}

        {/* Account Security */}
        <Card className={patient ? '' : 'md:col-span-2'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Security
            </CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button variant="outline" disabled>
                Change Password
              </Button>
              <Button variant="outline" disabled>
                Two-Factor Authentication
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Security features coming soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Disclaimer */}
      {patient && (
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> If you need to update any personal or medical information, please contact 
              the hospital reception desk or speak with your healthcare provider. Some information can only be 
              updated by authorized medical staff for accuracy and compliance purposes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
