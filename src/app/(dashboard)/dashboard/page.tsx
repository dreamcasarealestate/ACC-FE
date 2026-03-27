'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { Users, UserX, UserCheck, Activity, CalendarDays, CalendarRange, RefreshCw } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { SectionLoader } from '@/components/SectionLoader';

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const loadSummary = (selectedDate = date) => {
    setLoading(true);
    setLoadFailed(false);
    Promise.all([
      apiClient.get(apiClient.URLS.dashboardSummary, { date: selectedDate }),
      apiClient.get(apiClient.URLS.attendance),
      apiClient.get(apiClient.URLS.payments),
      apiClient.get(apiClient.URLS.labours),
    ])
      .then(([summaryRes, attendanceRes, paymentRes, labourRes]) => {
        const allAttendance = attendanceRes.data || [];
        const allPayments = paymentRes.data || [];
        const allLabours = labourRes.data || [];
        const selectedDateAttendance = allAttendance.filter((a: any) => String(a.date).slice(0, 10) === selectedDate);

        const statusCounts = selectedDateAttendance.reduce((acc: any, a: any) => {
            acc[a.status] = (acc[a.status] || 0) + 1;
            return acc;
          }, { PRESENT: 0, ABSENT: 0, HALF_DAY: 0, OVERTIME: 0, LEAVE: 0 });

        const trend = Array.from({ length: 7 }, (_, i) => {
          const day = format(subDays(new Date(selectedDate), 6 - i), 'yyyy-MM-dd');
          const rows = allAttendance.filter((a: any) => String(a.date).slice(0, 10) === day);
          return {
            day: format(new Date(day), 'EEE'),
            present: rows.filter((r: any) => r.status === 'PRESENT' || r.status === 'OVERTIME').length,
            total: rows.length,
          };
        });

        const paymentStatus = allPayments
          .filter((p: any) => String(p.periodStart).slice(0, 10) <= selectedDate)
          .reduce((acc: any, p: any) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        }, { PENDING: 0, PARTIAL: 0, SETTLED: 0 });

        const topWageLabours = [...allLabours]
          .sort((a: any, b: any) => Number(b.wageAmount) - Number(a.wageAmount))
          .slice(0, 100);

        setSummary(summaryRes.data);
        setAnalytics({
          statusCounts,
          trend,
          paymentStatus,
          topWageLabours,
          workedToday: statusCounts.PRESENT + statusCounts.OVERTIME,
        });
      })
      .catch((e) => {
        console.error(e);
        setSummary(null);
        setAnalytics(null);
        setLoadFailed(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSummary(date);
  }, []);

  if (loading && !summary) return <div className="min-h-[50vh]"><SectionLoader label="Loading dashboard insights..." /></div>;
  if (!summary) {
    return (
      <div className="max-w-6xl mx-auto py-20">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <p className="text-lg font-semibold text-slate-800">Dashboard data is not available right now.</p>
          <p className="text-slate-500 mt-1">{loadFailed ? 'API request failed. Please try again.' : 'Please refresh to load summary.'}</p>
          <button onClick={() => loadSummary(date)} className="mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Overview</h1>
        <p className="text-slate-500 mt-1 font-medium">Today's workforce metrics and impending settlements.</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
        <span className="text-sm font-semibold text-slate-600">As of Date</span>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            const nextDate = e.target.value;
            setDate(nextDate);
            loadSummary(nextDate);
          }}
          className="w-full sm:w-auto px-3 py-2 border rounded-lg"
        />
        <button
          onClick={() => {
            const today = format(new Date(), 'yyyy-MM-dd');
            setDate(today);
            loadSummary(today);
          }}
          className="w-full sm:w-auto px-3 py-2 bg-slate-900 text-white rounded-lg text-sm inline-flex justify-center items-center gap-1"
        >
          <RefreshCw size={14}/>
          Refresh
        </button>
        <button onClick={() => { const today = format(new Date(), 'yyyy-MM-dd'); setDate(today); loadSummary(today); }} className="w-full sm:w-auto px-3 py-2 border rounded-lg text-sm">Reset Today</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Today Present Count" value={summary.todayPresent} icon={<UserCheck size={24} className="text-white"/>} cardClass="bg-emerald-600 border-emerald-500 text-white" />
        <StatCard title="Today Absent Count" value={summary.todayAbsent} icon={<UserX size={24} className="text-white"/>} cardClass="bg-rose-600 border-rose-500 text-white" />
        <StatCard title="Total Labour" value={summary.totalLabour} icon={<Users size={24} className="text-white"/>} cardClass="bg-blue-600 border-blue-500 text-white" />
        <StatCard title="Pending Settlements" value={summary.pendingSettlementsCount} icon={<Activity size={24} className="text-white"/>} subtitle={`Outstanding ₹${summary.payableAmount || 0}`} cardClass="bg-amber-500 border-amber-400 text-white" />
        <StatCard title="Weekly Payable Amount" value={`₹${summary.weeklyPayableAmount || 0}`} icon={<CalendarDays size={24} className="text-white"/>} cardClass="bg-indigo-600 border-indigo-500 text-white" />
        <StatCard title="Monthly Payable Amount" value={`₹${summary.monthlyPayableAmount || 0}`} icon={<CalendarRange size={24} className="text-white"/>} cardClass="bg-violet-600 border-violet-500 text-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100/60 p-6">
          <h3 className="font-bold text-slate-800 mb-4">Attendance Status Mix ({date})</h3>
          <div className="space-y-3">
            {[
              { key: 'PRESENT', color: 'bg-emerald-500' },
              { key: 'ABSENT', color: 'bg-rose-500' },
              { key: 'HALF_DAY', color: 'bg-amber-500' },
              { key: 'OVERTIME', color: 'bg-indigo-500' },
              { key: 'LEAVE', color: 'bg-slate-500' },
            ].map(({ key, color }) => {
              const value = analytics?.statusCounts?.[key] || 0;
              const total = Object.values(analytics?.statusCounts || {}).reduce((s: number, v: any) => s + Number(v), 0) || 1;
              const pct = Math.round((value / total) * 100);
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{key}</span>
                    <span>{value} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`${color} h-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100/60 p-6">
          <h3 className="font-bold text-slate-800 mb-4">7-Day Present Trend</h3>
          <div className="flex items-end gap-2 md:gap-3 h-44 overflow-x-auto pb-1">
            {(analytics?.trend || []).map((d: any) => {
              const max = Math.max(...(analytics?.trend || []).map((x: any) => x.present), 1);
              const h = Math.max(8, Math.round((d.present / max) * 140));
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center">
                  <div className="text-[10px] text-slate-500 mb-1">{d.present}</div>
                  <div className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-400" style={{ height: `${h}px` }} />
                  <div className="text-[10px] text-slate-500 mt-1">{d.day}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100/60 p-6">
          <h3 className="font-bold text-slate-800 mb-4">Payment Status Overview</h3>
          <p className="text-xs text-slate-500 mb-3">As of {date}</p>
          <div className="grid grid-cols-3 gap-3">
            <MiniStat title="Pending" value={analytics?.paymentStatus?.PENDING || 0} cls="text-rose-600 bg-rose-50" />
            <MiniStat title="Partial" value={analytics?.paymentStatus?.PARTIAL || 0} cls="text-amber-600 bg-amber-50" />
            <MiniStat title="Settled" value={analytics?.paymentStatus?.SETTLED || 0} cls="text-emerald-600 bg-emerald-50" />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100/60 p-6">
          <h3 className="font-bold text-slate-800 mb-1">Top Wage Labours</h3>
          <p className="text-xs text-slate-500 mb-3">Showing up to 100 labours ranked by wage.</p>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {(analytics?.topWageLabours || []).map((l: any) => (
              <div key={l.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/60">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{l.fullName}</p>
                      <p className="text-xs text-slate-500">{l.workType}</p>
                </div>
                <div className="font-bold text-blue-600">₹{l.wageAmount}</div>
              </div>
            ))}
            {(analytics?.topWageLabours || []).length === 0 && (
                  <div className="text-sm text-slate-500 py-6 text-center">No labour records found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, subtitle, trend, cardClass = '' }: any) {
  return (
    <div className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-between hover:shadow-md transition-all group ${cardClass || 'bg-white border-slate-100/60'}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-white/85">{title}</p>
          <h3 className="text-4xl font-extrabold text-white mt-3">{value}</h3>
          {subtitle && <p className="text-sm text-white/90 mt-1 font-medium">{subtitle}</p>}
        </div>
        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform">{icon}</div>
      </div>
      {trend && (
        <div className="mt-5 text-xs font-semibold text-white bg-white/20 border border-white/30 inline-flex items-center px-2.5 py-1 rounded-md self-start">
          {trend}
        </div>
      )}
    </div>
  );
}

function MiniStat({ title, value, cls }: { title: string; value: number; cls: string }) {
  return (
    <div className={`rounded-xl p-3 ${cls}`}>
      <p className="text-xs font-semibold uppercase">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
