'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, FlaskConical, Shield, FileText, Users, CheckCircle } from 'lucide-react';
import { UserRole } from '@/lib/permissions';
import { getDashboardRoute } from '@/lib/routing';

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function LoginPage() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Role-based redirection
        const userData = data.user;
        const redirectUrl = getDashboardRoute(userData.role as UserRole);
        router.push(redirectUrl);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const fillDemoCredentials = (email: string, password: string) => {
    setFormData(prev => ({ ...prev, email, password }));
    setError('');
  };

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Branding and Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white p-12 items-center">
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <FlaskConical className="h-10 w-10 mr-3" />
              <div>
                <h1 className="text-2xl font-bold">LIMS</h1>
                <p className="text-blue-100 text-sm">Laboratory Management System</p>
              </div>
            </div>
            <p className="text-blue-100 text-lg leading-relaxed">
              Secure, comprehensive laboratory management platform for healthcare professionals and patients.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <Shield className="h-6 w-6 text-blue-300 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white">Secure Patient Management</h3>
                <p className="text-blue-200 text-sm">HIPAA-compliant data handling with advanced security</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <FlaskConical className="h-6 w-6 text-blue-300 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white">Complete Lab Workflow</h3>
                <p className="text-blue-200 text-sm">From sample collection to report delivery</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <FileText className="h-6 w-6 text-blue-300 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white">Digital Reports</h3>
                <p className="text-blue-200 text-sm">Instant report generation with QR verification</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Users className="h-6 w-6 text-blue-300 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white">Role-based Access</h3>
                <p className="text-blue-200 text-sm">Customized interfaces for every user type</p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex items-center justify-center">
            <div className="relative">
              <div className="w-32 h-32 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <FlaskConical className="h-16 w-16 text-white" />
              </div>
              <div className="absolute -inset-4 border-2 border-white/20 rounded-3xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <div className="lg:hidden mb-4">
                <div className="flex items-center justify-center mb-2">
                  <FlaskConical className="h-8 w-8 text-blue-600 mr-2" />
                  <h1 className="text-xl font-bold text-gray-900">LIMS</h1>
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Welcome back
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Sign in to your Laboratory Management System
              </p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email address"
                    className={error ? 'border-red-300' : ''}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Enter your password"
                      className={`pr-10 ${error ? 'border-red-300' : ''}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="rememberMe"
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-gray-600">Don't have an account? </span>
                  <Link href="/register" className="text-blue-600 hover:text-blue-500 font-medium">
                    Register here
                  </Link>
                </div>
              </form>

              {/* Demo Accounts - Only in Development */}
              {isDevelopment && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center mb-3">
                    <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                    <p className="text-sm font-semibold text-blue-900">Demo Staff Accounts</p>
                  </div>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('admin@lims.com', 'Admin@123')}
                      className="w-full text-left p-2 text-xs bg-white rounded border hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-medium text-blue-900">Admin</div>
                      <div className="text-blue-700">admin@lims.com</div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('labadmin@lims.com', 'Admin@123')}
                      className="w-full text-left p-2 text-xs bg-white rounded border hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-medium text-blue-900">Lab Admin</div>
                      <div className="text-blue-700">labadmin@lims.com</div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('receptionist@lims.com', 'Admin@123')}
                      className="w-full text-left p-2 text-xs bg-white rounded border hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-medium text-blue-900">Receptionist</div>
                      <div className="text-blue-700">receptionist@lims.com</div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('technician@lims.com', 'Admin@123')}
                      className="w-full text-left p-2 text-xs bg-white rounded border hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-medium text-blue-900">Technician</div>
                      <div className="text-blue-700">technician@lims.com</div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('pathologist@lims.com', 'Admin@123')}
                      className="w-full text-left p-2 text-xs bg-white rounded border hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-medium text-blue-900">Pathologist</div>
                      <div className="text-blue-700">pathologist@lims.com</div>
                    </button>
                  </div>
                  
                  <p className="text-xs text-blue-600 mt-3 italic">
                    Click any account above to auto-fill credentials
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}