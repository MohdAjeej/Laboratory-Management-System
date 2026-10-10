import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, Shield, Settings } from 'lucide-react';

export default function AdminProfilePage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Profile</h1>
          <p className="text-gray-600">Manage your account settings</p>
        </div>
        <Button size="lg">
          <Settings className="h-5 w-5 mr-2" />
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Administrator</p>
                <p className="text-sm text-gray-600">System Administrator</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-gray-600">admin@lims.com</span>
              </div>
              <div className="flex items-center text-sm">
                <Shield className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-gray-600">Admin Role</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button variant="outline" className="w-full">
                Change Password
              </Button>
              <Button variant="outline" className="w-full">
                Notification Preferences
              </Button>
              <Button variant="outline" className="w-full">
                Security Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your recent actions in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-600 py-8">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
