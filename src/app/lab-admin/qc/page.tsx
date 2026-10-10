'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function LabAdminQCPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quality Control</h1>
        <p className="text-gray-600 mt-1">Manage quality control processes and standards</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            QC Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium">Quality Control System</p>
            <p className="text-sm">Coming soon - Full QC management system</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
