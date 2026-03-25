'use client';

import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) return null;

  return (
    <div className="flex flex-col md:flex-row bg-slate-50 min-h-screen md:h-screen font-sans text-slate-900">
      <Sidebar />
      <main className="flex-1 min-w-0 w-full p-4 md:p-6 lg:p-8 md:ml-72 md:h-screen md:overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
