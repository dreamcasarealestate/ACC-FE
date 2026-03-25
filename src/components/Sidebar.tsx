'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Home, Users, CalendarCheck, CreditCard, LogOut, Menu, X, Building2, ShieldCheck, UserCog, BriefcaseBusiness } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export function Sidebar() {
  const { logout, user } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const roleLabel = useMemo(() => String(user?.role || '').toUpperCase(), [user?.role]);
  const isAdmin = roleLabel === 'ADMIN';
  const roleBadgeClass = isAdmin
    ? 'bg-violet-500/15 text-violet-200 border-violet-400/30'
    : 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30';
  const RoleIcon = isAdmin ? ShieldCheck : UserCog;

  if (!user) return null;

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Labours', href: '/labours', icon: Users },
    { name: 'Projects', href: '/projects', icon: BriefcaseBusiness },
    { name: 'Attendance', href: '/attendance', icon: CalendarCheck },
    { name: 'Payments', href: '/payments', icon: CreditCard },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col">
      <div className="px-5 py-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Building2 size={22} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-lg leading-tight truncate">ACC Constructions</p>
            <p className="text-slate-300 text-xs tracking-wide">Workforce & Settlements</p>
          </div>
        </div>
      </div>
      
      <div className="p-5 text-sm text-slate-400 border-b border-slate-800 bg-slate-800/20">
        <p className="text-xs uppercase tracking-wider text-slate-500 mb-1 font-semibold">Logged in as</p>
        <p className="text-white font-medium text-base truncate">{user.name || 'Admin'}</p>
        <span className="inline-block mt-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium border border-blue-500/30">
          {user.role}
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 group ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon
                size={20}
                className={`transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`}
              />
              <span className="font-medium tracking-wide text-sm">{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/60">
        <button
          onClick={() => {
            setMobileOpen(false);
            logout();
          }}
          className="flex items-center justify-center space-x-2.5 p-3 w-full rounded-xl text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all duration-300"
        >
          <LogOut size={18} />
          <span className="font-medium tracking-wide text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="md:hidden sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <Building2 size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">ACC Constructions</p>
            <p className="text-[11px] text-slate-500 truncate">{user.name || 'Admin User'}</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="p-2 rounded-lg border border-slate-200 text-slate-700"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 w-72 bg-slate-900 border-r border-slate-800 text-white h-screen shadow-2xl z-30">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-slate-900/55 z-40" onClick={() => setMobileOpen(false)} />
          <aside className="md:hidden fixed top-0 left-0 h-full w-80 max-w-[88vw] bg-slate-900 border-r border-slate-800 text-white z-50 shadow-2xl">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
