'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function LabAdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">Generate and manage laboratory reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reports List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium">Reports Management</p>
            <p className="text-sm">Coming soon - Full reports generation system</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
