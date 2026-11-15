'use client';

import React, { useState } from 'react';
import { FiShield, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { useToast } from '@/context/ToastContext';

interface SecurityViewProps {
  onUpdatePassword: (password: string) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
}

export default function SecurityView({
  onUpdatePassword,
  onDeleteAccount,
}: SecurityViewProps) {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setUpdating(true);
    try {
      await onUpdatePassword(newPassword);
      toast.success('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Failed to update password.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to deactivate your account? This action will disable access and sign you out.'
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await onDeleteAccount();
    } catch {
      toast.error('Failed to deactivate account.');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* CHANGE PASSWORD */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-2xs">
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-black text-gray-900">Account Security</h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Update your password to keep your farm orders and personal info secure
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#1A4331]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#1A4331]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={updating}
              className="bg-[#FA5400] hover:bg-[#E04B00] text-white text-xs font-bold py-2.5 px-6 rounded-full transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {updating ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* DANGER ZONE: DEACTIVATE ACCOUNT */}
      <div className="bg-red-50/50 rounded-2xl border border-red-200/80 p-6 md:p-8 shadow-2xs">
        <div className="flex items-center gap-2 mb-2 text-red-800">
          <FiAlertTriangle className="w-5 h-5" />
          <h3 className="text-lg font-black">Delete Your GGN Account</h3>
        </div>
        <p className="text-xs text-red-700 font-medium leading-relaxed max-w-xl mb-5">
          Deactivating your account disables your access immediately and clears active sessions.
          Completed order records are securely retained for financial and accounting compliance.
        </p>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 px-6 rounded-full transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
        >
          {deleting ? 'Deactivating...' : 'Deactivate My Account'}
        </button>
      </div>
    </div>
  );
}
