import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, FlaskConical } from 'lucide-react';

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md text-center shadow-xl border-0">
        <CardHeader className="pb-6">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <FlaskConical className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Account created successfully
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Your account has been created. You can now sign in to access the Laboratory Management System.
          </p>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>What's next?</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1 text-left">
                <li>• Sign in with your email and password</li>
                <li>• Access your patient dashboard</li>
                <li>• View lab orders and reports</li>
              </ul>
            </div>
            
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
              <Link href="/login">
                Go to Login
              </Link>
            </Button>
            
            <div className="text-center">
              <Link 
                href="/" 
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Return to home page
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}