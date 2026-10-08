import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function PatientResultsPage() {
  await cookies();
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  // TODO: Fetch actual results from database
  const results: any[] = [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Test Results</h1>
        <p className="text-gray-600">Access your laboratory test results</p>
      </div>

      {results.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Available</h3>
            <p className="text-gray-600 text-center max-w-sm">
              Your test results will appear here once they are ready and verified by our laboratory staff.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {/* Results will be displayed here when fetched from database */}
        </div>
      )}
    </div>
  );
}
