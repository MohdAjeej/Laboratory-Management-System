'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';

export default function LabAdminOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
        <p className="text-gray-600 mt-1">Manage and track all laboratory orders</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Orders List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium">Orders Management</p>
            <p className="text-sm">Coming soon - Full orders management system</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
