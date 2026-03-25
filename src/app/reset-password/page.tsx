'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Lock, Loader2, ArrowLeft } from 'lucide-react';
import apiClient from '@/lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!token) {
      toast.error('Invalid reset token');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post(
        apiClient.URLS.authResetPassword,
        { token, newPassword },
        false,
      );
      toast.success('Password reset successful. Please login.');
      router.replace('/login');
    } catch (e: any) {
      toast.error(e.body?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md bg-slate-800/70 backdrop-blur rounded-2xl border border-slate-700 p-6 space-y-5">
        <h1 className="text-2xl font-bold text-white">Reset Password</h1>
        <p className="text-sm text-slate-400">Set your new password for your account.</p>

        <div className="relative">
          <Lock className="h-5 w-5 text-slate-400 absolute left-3 top-3" />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700 text-white"
            placeholder="New password"
          />
        </div>
        <div className="relative">
          <Lock className="h-5 w-5 text-slate-400 absolute left-3 top-3" />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700 text-white"
            placeholder="Confirm password"
          />
        </div>

        <button
          onClick={submit}
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Reset Password'}
        </button>

        <button
          onClick={() => router.push('/login')}
          className="w-full inline-flex items-center justify-center gap-1 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft size={15} /> Back to login
        </button>
      </div>
    </div>
  );
}
