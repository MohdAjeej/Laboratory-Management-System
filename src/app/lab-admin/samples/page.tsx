'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TestTube } from 'lucide-react';

export default function LabAdminSamplesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Samples Management</h1>
        <p className="text-gray-600 mt-1">Track and manage laboratory samples</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Samples List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <TestTube className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium">Samples Management</p>
            <p className="text-sm">Coming soon - Full samples tracking system</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
