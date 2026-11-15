'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getErrorMessage } from '@/utils/format';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // 1. ADMIN LOGIN HANDLER
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // 1. Log the user in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // 2. Double-check they actually have the admin role!
      const appRole = data.user?.app_metadata?.role;
      const userRole = data.user?.user_metadata?.role;

      if (appRole !== 'admin' && userRole !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Access Denied: This account does not have administrator privileges.');
      }

      // 3. Force a session refresh to ensure the token is active, then redirect
      await supabase.auth.refreshSession();
      router.push('/admin');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // 2. ADMIN PASSWORD RESET REQUEST HANDLER
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (resetError) throw resetError;

      setSuccessMessage(
        'Password reset link sent! Please check your email inbox (and spam folder) for the recovery link.'
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-900/50 mb-4 shadow-sm">
            <span className="text-2xl">🛡️</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {isForgotPassword ? 'Reset Admin Password' : 'Master Admin Portal'}
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            {isForgotPassword
              ? 'Enter your registered admin email to receive a password reset link.'
              : 'Authorized personnel only.'}
          </p>
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div className="p-4 mb-6 rounded-lg text-sm bg-red-900/50 text-red-200 border border-red-800 animate-fade-in">
            {error}
          </div>
        )}

        {/* SUCCESS ALERT */}
        {successMessage && (
          <div className="p-4 mb-6 rounded-lg text-sm bg-green-900/50 text-green-200 border border-green-800 animate-fade-in">
            {successMessage}
          </div>
        )}

        {/* FORMS */}
        {isForgotPassword ? (
          /* =========================================================
              FORGOT PASSWORD VIEW
          ========================================================= */
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Admin Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-white placeholder-gray-600 text-sm"
                placeholder="admin@ggnagro.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-800 mt-4 cursor-pointer text-sm shadow-md"
            >
              {loading ? 'Sending Recovery Link...' : 'Send Password Reset Link'}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-xs text-green-400 hover:text-green-300 transition-colors font-medium cursor-pointer"
              >
                ← Back to Admin Login
              </button>
            </div>
          </form>
        ) : (
          /* =========================================================
              STANDARD LOGIN VIEW
          ========================================================= */
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Admin Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-white placeholder-gray-600 text-sm"
                placeholder="admin@ggnagro.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-300">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs text-green-400 hover:text-green-300 transition-colors font-medium cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-white placeholder-gray-600 text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-800 mt-4 cursor-pointer text-sm shadow-md"
            >
              {loading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>
        )}

        {/* RETURN TO STOREFRONT */}
        <div className="mt-8 text-center pt-4 border-t border-gray-700/60">
          <Link href="/" className="text-xs text-gray-500 hover:text-white transition-colors">
            ← Return to Storefront
          </Link>
        </div>
      </div>
    </main>
  );
}
