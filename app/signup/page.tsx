'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { notificationManager } from '@/components/NotificationManager';
import Link from 'next/link';
import type { UserRole } from '@/types';

// Dynamically import MapPicker to avoid SSR issues
const MapPicker = dynamic(() => import('@/components/MapPicker').then(mod => ({ default: mod.MapPicker })), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>Loading map...</p>
        </div>
      </div>
    </div>
  )
});

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode'); // 'login' or 'create'
  const isLoginMode = mode === 'login';
  
  const { signup, login } = useAuth();
  const [accountType, setAccountType] = useState<UserRole | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    birthdate: '',
    employeeId: '',
  });
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleAccountTypeSelect = (type: UserRole) => {
    setAccountType(type);
    
    // If in login mode, after selecting role, show login form
    if (isLoginMode) {
      // Stay on same page but will show login form now
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountType) {
      notificationManager.error('Please select an account type');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      notificationManager.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      notificationManager.error('Password must be at least 6 characters long');
      return;
    }

    if (accountType === 'admin' && !formData.employeeId) {
      notificationManager.error('Employee ID is required for admin accounts');
      return;
    }

    setLoading(true);
    try {
      await signup({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
        birthdate: formData.birthdate,
        employeeId: formData.employeeId,
        role: accountType,
      });
      notificationManager.success('Account created successfully!');
      router.push('/terms');
    } catch (error: unknown) {
      let errorMessage = 'Signup failed. ';
      const firebaseError = error as { code?: string; message?: string };
      switch (firebaseError.code) {
        case 'auth/email-already-in-use':
          errorMessage += 'Email already in use.';
          break;
        case 'auth/invalid-email':
          errorMessage += 'Invalid email address.';
          break;
        case 'auth/weak-password':
          errorMessage += 'Password is too weak.';
          break;
        default:
          errorMessage += firebaseError.message || 'Unknown error occurred';
      }
      notificationManager.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      notificationManager.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await login(loginData.email, loginData.password);
      notificationManager.success('Login successful!');
      router.push('/dashboard');
    } catch (error: unknown) {
      let errorMessage = 'Login failed. ';
      const firebaseError = error as { code?: string; message?: string };
      switch (firebaseError.code) {
        case 'auth/user-not-found':
          errorMessage += 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          errorMessage += 'Incorrect password.';
          break;
        case 'auth/invalid-email':
          errorMessage += 'Invalid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage += 'This account has been disabled.';
          break;
        default:
          errorMessage += firebaseError.message || 'Unknown error occurred';
      }
      notificationManager.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Determine what to show based on mode and accountType
  // Show login form if in login mode and account type is selected
  const showLoginForm = isLoginMode && accountType;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <Header />
      
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🚨</div>
            <h1 className="text-3xl font-bold mb-2">
              {showLoginForm ? 'Login to B-READY' : (isLoginMode ? 'Login Account' : 'Create Account')}
            </h1>
            <p className="text-gray-600">
              {showLoginForm ? 'Enter your credentials to continue' : 'Choose your account type'}
            </p>
          </div>

          {/* Show login form for login mode after role selection */}
          {showLoginForm ? (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Email Address</label>
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="mt-2 text-right">
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <button
                type="button"
                onClick={() => setAccountType(null)}
                className="w-full py-2 text-primary font-semibold"
              >
                ← Back to account type selection
              </button>
            </form>
          ) : !accountType ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => handleAccountTypeSelect('resident')}
                className="p-6 border-2 border-gray-300 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-center"
              >
                <div className="text-4xl mb-3">👨‍👩‍👧‍👦</div>
                <div className="text-xl font-semibold mb-2">Resident</div>
                <div className="text-sm text-gray-600">Report emergencies and view updates</div>
              </button>
              <button
                onClick={() => handleAccountTypeSelect('admin')}
                className="p-6 border-2 border-gray-300 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-center"
              >
                <div className="text-4xl mb-3">👨‍💼</div>
                <div className="text-xl font-semibold mb-2">Admin</div>
                <div className="text-sm text-gray-600">Manage reports and coordinate response</div>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Address</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.address}
                    readOnly
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50"
                    placeholder="Select your location"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    className="px-4 py-3 bg-primary text-white rounded-lg hover:opacity-90"
                  >
                    📍 Map
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Birthdate</label>
                <input
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                  required
                />
              </div>

              {accountType === 'admin' && (
                <div>
                  <label className="block text-sm font-semibold mb-2">Employee ID</label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>

              <button
                type="button"
                onClick={() => setAccountType(null)}
                className="w-full py-2 text-primary font-semibold"
              >
                ← Back to account type selection
              </button>
            </form>
          )}

          {/* Only show "Already have an account?" link when NOT in login mode */}
          {!isLoginMode && (
            <p className="text-center text-gray-600 mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Login here
              </Link>
            </p>
          )}
        </div>
      </div>

      {showMapPicker && (
        <MapPicker
          onSelect={(address) => {
            setFormData({ ...formData, address });
            setShowMapPicker(false);
          }}
          onClose={() => setShowMapPicker(false)}
        />
      )}
    </div>
  );
}

// Wrapper component to handle Suspense for useSearchParams
export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    }>
      <SignupPageContent />
    </Suspense>
  );
}
