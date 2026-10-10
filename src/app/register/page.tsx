'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Check, X, FlaskConical, Shield, FileText, Users } from 'lucide-react';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: string;
  general?: string;
}

interface PasswordRequirement {
  label: string;
  check: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', check: (pwd) => pwd.length >= 8 },
  { label: 'One uppercase letter', check: (pwd) => /[A-Z]/.test(pwd) },
  { label: 'One lowercase letter', check: (pwd) => /[a-z]/.test(pwd) },
  { label: 'One number', check: (pwd) => /\d/.test(pwd) },
  { label: 'One special character', check: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
];

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const failedRequirements = passwordRequirements.filter(req => !req.check(formData.password));
      if (failedRequirements.length > 0) {
        newErrors.password = 'Password does not meet requirements';
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms agreement validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms of Service and Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          agreeToTerms: formData.agreeToTerms,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful - redirect to success page or login
        router.push('/register/success');
      } else {
        setErrors({ general: data.error || 'Registration failed' });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const getPasswordStrength = () => {
    if (!formData.password) return 0;
    const metRequirements = passwordRequirements.filter(req => req.check(formData.password)).length;
    return (metRequirements / passwordRequirements.length) * 100;
  };

  const getPasswordStrengthColor = () => {
    const strength = getPasswordStrength();
    if (strength < 40) return 'bg-red-500';
    if (strength < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    const strength = getPasswordStrength();
    if (strength < 40) return 'Weak';
    if (strength < 80) return 'Good';
    return 'Strong';
  };

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
              Manage patients, laboratory tests, samples, results and reports securely from one platform.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <Shield className="h-6 w-6 text-blue-300 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white">Secure Patient Management</h3>
                <p className="text-blue-200 text-sm">HIPAA-compliant patient data handling with role-based access control</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <FlaskConical className="h-6 w-6 text-blue-300 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white">Laboratory Workflow Tracking</h3>
                <p className="text-blue-200 text-sm">Complete sample lifecycle from collection to results</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <FileText className="h-6 w-6 text-blue-300 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white">Digital Reports</h3>
                <p className="text-blue-200 text-sm">Generate, verify, and deliver lab reports with QR verification</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Users className="h-6 w-6 text-blue-300 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white">Role-based Access</h3>
                <p className="text-blue-200 text-sm">Customized interfaces for different user types and permissions</p>
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 bg-white/10 rounded-lg backdrop-blur-sm">
            <div className="flex items-center justify-center">
              <div className="relative w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <FlaskConical className="h-12 w-12 text-white" />
                <div className="absolute inset-0 border-4 border-white/30 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
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
                Create your account
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Register to access the Laboratory Management System
              </p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {errors.general && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {errors.general}
                  </div>
                )}

                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className={errors.fullName ? 'border-red-500 focus:border-red-500' : ''}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && (
                    <p className="text-red-600 text-sm mt-1">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={errors.email ? 'border-red-500 focus:border-red-500' : ''}
                    placeholder="Enter your email address"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={errors.phone ? 'border-red-500 focus:border-red-500' : ''}
                    placeholder="Enter your phone number"
                  />
                  {errors.phone && (
                    <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
                  )}
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
                      className={`pr-10 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                      placeholder="Create a strong password"
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
                  
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Password strength:</span>
                        <span className={`font-medium ${
                          getPasswordStrength() < 40 ? 'text-red-600' : 
                          getPasswordStrength() < 80 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full transition-all ${getPasswordStrengthColor()}`}
                          style={{ width: `${getPasswordStrength()}%` }}
                        ></div>
                      </div>
                      <div className="mt-2 space-y-1">
                        {passwordRequirements.map((req, index) => (
                          <div key={index} className="flex items-center text-xs">
                            {req.check(formData.password) ? (
                              <Check className="h-3 w-3 text-green-500 mr-1" />
                            ) : (
                              <X className="h-3 w-3 text-red-500 mr-1" />
                            )}
                            <span className={req.check(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {errors.password && (
                    <p className="text-red-600 text-sm mt-1">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`pr-10 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="agreeToTerms"
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="agreeToTerms" className="text-gray-700">
                      I agree to the{' '}
                      <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                        Terms of Service
                      </Link>
                      {' '}and{' '}
                      <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                </div>
                {errors.agreeToTerms && (
                  <p className="text-red-600 text-sm">{errors.agreeToTerms}</p>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-gray-600">Already have an account? </span>
                  <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                    Sign in
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}