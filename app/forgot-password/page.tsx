'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { notificationManager } from '@/components/NotificationManager';
import { Header } from '@/components/Header';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      notificationManager.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
      notificationManager.success('Password reset email sent! Please check your inbox.');
    } catch (error: unknown) {
      let errorMessage = 'Failed to send password reset email. ';
      const firebaseError = error as { code?: string; message?: string };
      
      switch (firebaseError.code) {
        case 'auth/invalid-email':
          errorMessage += 'The email address is not valid.';
          break;
        case 'auth/user-not-found':
          errorMessage += 'No account found with this email address.';
          break;
        case 'auth/missing-email':
          errorMessage += 'Please enter your email address.';
          break;
        default:
          errorMessage += firebaseError.message || 'An unexpected error occurred.';
      }
      
      notificationManager.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{
      backgroundImage: 'url("/Blurred blue blended background.jpg")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <Header />
      
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔑</div>
            <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
            <p className="text-gray-600">Enter your email to receive a password reset link</p>
          </div>

          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="your@email.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  We'll send a password reset link to this email address
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <div className="text-center">
                <Link href="/login" className="text-sm text-primary hover:underline">
                  Back to Login
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-green-600 mb-2">✅</div>
                <p className="text-green-800 font-semibold">Reset email sent!</p>
                <p className="text-green-600 text-sm mt-1">
                  Please check your email inbox and follow the instructions to reset your password.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setEmailSent(false)}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Try Again
                  </button>
                  <Link
                    href="/login"
                    className="flex-1 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity text-center"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}