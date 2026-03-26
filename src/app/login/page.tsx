'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import { User, Lock, ArrowRight, Loader2, Eye, EyeOff, Mail, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';

export default function LoginPage() {
  const { login, user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [showForgotView, setShowForgotView] = useState(false);
  const { register, handleSubmit, setValue } = useForm();
  const {
    register: registerForgot,
    handleSubmit: handleSubmitForgot,
    reset: resetForgot,
    formState: { errors: forgotErrors },
  } = useForm();

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.post(apiClient.URLS.authLogin, data);
      toast.success('Successfully logged in!');
      login(response.data.access_token, response.data.user);
      router.push('/dashboard');
    } catch (err: any) {
      const backendMessage = err?.body?.message || err?.response?.data?.message;
      const errorMsg =
        backendMessage === 'Invalid credentials'
          ? 'Invalid email or password'
          : backendMessage || 'Invalid email or password';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitForgot = async (data: any) => {
    if (!data?.newPassword || String(data.newPassword).length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.post(
        apiClient.URLS.authForgotPassword,
        { email: data.email, newPassword: data.newPassword },
        false,
      );
      toast.success(res.data?.message || 'Password updated successfully');
      resetForgot();
      setValue('email', String(data.email || ''));
      setShowForgotView(false);
    } catch (err: any) {
      const errorMsg = err.body?.message || 'Failed to request password reset';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && token) {
      router.replace('/dashboard');
    }
  }, [authLoading, user, token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-slate-900 overflow-hidden relative">
      
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-md mx-4 p-6 md:p-8 bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50">
        <div className="text-center mb-8 md:mb-10">
          <div className="mb-3 inline-flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Building2 size={22} className="text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight">
              ACC Constructions
            </h1>
          </div>
          <p className="text-slate-400 font-medium">
            {showForgotView ? 'Reset your account password' : 'Sign in to manage your workforce'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center">
            {error}
          </div>
        )}

        {!showForgotView ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  {...register('email', { required: true })}
                  type="email"
                  className="w-full pl-11 pr-4 py-4 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white placeholder-slate-500 transition-all outline-none shadow-inner"
                  placeholder="Email address"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  {...register('password', { required: true })}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-11 pr-12 py-4 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white placeholder-slate-500 transition-all outline-none shadow-inner"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotView(true)}
                className="text-sm text-blue-300 hover:text-blue-200"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent rounded-xl text-white font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 shadow-lg shadow-blue-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5 text-white" />
              ) : (
                <span className="flex items-center">
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}

              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmitForgot(onSubmitForgot)} className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
              </div>
              <input
                {...registerForgot('email', { required: 'Email is required' })}
                type="email"
                className="w-full pl-11 pr-4 py-4 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white placeholder-slate-500 transition-all outline-none shadow-inner"
                placeholder="Enter your account email"
              />
            </div>
            {forgotErrors.email && <p className="text-xs text-rose-400">{String(forgotErrors.email.message)}</p>}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
              </div>
              <input
                {...registerForgot('newPassword', { required: 'Password is required' })}
                type={showForgotPassword ? 'text' : 'password'}
                className="w-full pl-11 pr-12 py-4 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white placeholder-slate-500 transition-all outline-none shadow-inner"
                placeholder="New password"
              />
              <button
                type="button"
                onClick={() => setShowForgotPassword((v) => !v)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-300 transition-colors"
              >
                {showForgotPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {forgotErrors.newPassword && <p className="text-xs text-rose-400">{String(forgotErrors.newPassword.message)}</p>}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
              </div>
              <input
                {...registerForgot('confirmPassword', { required: 'Confirm password is required' })}
                type={showForgotConfirmPassword ? 'text' : 'password'}
                className="w-full pl-11 pr-12 py-4 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white placeholder-slate-500 transition-all outline-none shadow-inner"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowForgotConfirmPassword((v) => !v)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-300 transition-colors"
              >
                {showForgotConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {forgotErrors.confirmPassword && <p className="text-xs text-rose-400">{String(forgotErrors.confirmPassword.message)}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5 text-white mx-auto" /> : 'Update Password'}
            </button>

            <button
              type="button"
              onClick={() => {
                setError('');
                setShowForgotView(false);
              }}
              className="w-full py-2 text-sm text-slate-300 hover:text-white"
            >
              Back to sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
