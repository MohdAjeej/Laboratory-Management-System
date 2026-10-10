'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileCheck } from 'lucide-react';

export default function LabAdminResultsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Test Results</h1>
        <p className="text-gray-600 mt-1">Review and manage test results</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Results List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <FileCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium">Test Results Management</p>
            <p className="text-sm">Coming soon - Full results management system</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
