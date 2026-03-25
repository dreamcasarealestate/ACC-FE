'use client';

import { useState, useEffect, type FocusEvent } from 'react';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Receipt, IndianRupee, CheckCircle, Eye, Trash2, Filter, Calculator, Search, Edit, CalendarDays } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useAuth } from '@/context/AuthContext';
import { TablePagination } from '@/components/TablePagination';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [labours, setLabours] = useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [selectedPaymentForEdit, setSelectedPaymentForEdit] = useState<any | null>(null);
  const [filters, setFilters] = useState({ labourId: '', status: '', from: '', to: '' });
  const [search, setSearch] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm();
  const { user } = useAuth();
  const selectOnFocus = (e: FocusEvent<HTMLInputElement>) => e.target.select();

  const getEmptyPaymentForm = () => ({
    labourId: '',
    paymentType: 'WEEKLY',
    periodStart: '',
    periodEnd: '',
    totalDaysPresent: 0,
    totalHalfDays: 0,
    overtimeAmount: 0,
    grossAmount: 0,
    advanceAmount: 0,
    paidAmount: 0,
    balanceAmount: '',
    status: 'PENDING',
    remarks: '',
  });
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPay, resLab] = await Promise.all([
        apiClient.get(apiClient.URLS.payments),
        apiClient.get(apiClient.URLS.labours)
      ]);
      setPayments(resPay.data);
      setLabours(resLab.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const submitPayment = async (data: any) => {
    try {
      data.labourId = Number(data.labourId);
      data.totalDaysPresent = Number(data.totalDaysPresent);
      data.totalHalfDays = Number(data.totalHalfDays);
      data.overtimeAmount = Number(data.overtimeAmount);
      data.grossAmount = Number(data.grossAmount);
      data.advanceAmount = Number(data.advanceAmount) || 0;
      data.paidAmount = Number(data.paidAmount) || 0;
      const hasManualBalance =
        data.balanceAmount !== '' &&
        data.balanceAmount !== null &&
        data.balanceAmount !== undefined &&
        Number.isFinite(Number(data.balanceAmount));

      // Keep manually entered balance; auto-calculate only when user leaves it empty.
      if (hasManualBalance) {
        data.balanceAmount = Number(data.balanceAmount);
      } else {
        data.balanceAmount = Math.max(0, data.grossAmount - data.advanceAmount - data.paidAmount);
      }

      if (formMode === 'add') {
        await apiClient.post(apiClient.URLS.payments, data);
        toast.success('Payment processed successfully!');
      } else {
        if (!selectedPaymentForEdit?.id) return;
        await apiClient.patch(`${apiClient.URLS.payments}/${selectedPaymentForEdit.id}`, data);
        toast.success('Payment updated successfully!');
      }
      setIsModalOpen(false);
      setFormMode('add');
      setSelectedPaymentForEdit(null);
      reset(getEmptyPaymentForm());
      await fetchData();
    } catch (e: any) {
      toast.error(e.body?.message || 'Error saving payment');
    }
  };

  const fetchPaymentById = async (id: number) => {
    try {
      const res = await apiClient.get(`${apiClient.URLS.payments}/${id}`);
      setSelectedPayment(res.data);
    } catch (e: any) {
      toast.error(e.body?.message || 'Failed to fetch payment details');
    }
  };

  const deletePayment = async () => {
    if (!deleteId) return;
    try {
      await apiClient.delete(`${apiClient.URLS.payments}/${deleteId}`);
      if (selectedPayment?.id === deleteId) setSelectedPayment(null);
      setDeleteId(null);
      toast.success('Payment deleted');
      fetchData();
    } catch (e: any) {
      toast.error(e.body?.message || 'Failed to delete payment');
    }
  };

  const calculateFromAttendance = async () => {
    const labourId = watch('labourId');
    const periodStart = watch('periodStart');
    const periodEnd = watch('periodEnd');
    if (!labourId || !periodStart || !periodEnd) {
      toast.error('Select labour and period first');
      return;
    }
    try {
      const res = await apiClient.get(`${apiClient.URLS.attendance}/labour/${labourId}`);
      const rows = (res.data || []).filter((r: any) => {
        const d = String(r.date).slice(0, 10);
        return d >= periodStart && d <= periodEnd;
      });
      const present = rows.filter((r: any) => r.status === 'PRESENT' || r.status === 'OVERTIME').length;
      const half = rows.filter((r: any) => r.status === 'HALF_DAY').length;
      const overtimeHours = rows.reduce((acc: number, r: any) => acc + Number(r.overtimeHours || 0), 0);
      const labour = labours.find((l) => String(l.id) === String(labourId));
      const dailyWage = Number(labour?.wageAmount || 0);
      const gross = present * dailyWage + half * (dailyWage / 2);
      const overtimeAmount = overtimeHours * (dailyWage / 8);

      setValue('totalDaysPresent', present);
      setValue('totalHalfDays', half);
      setValue('overtimeAmount', Math.round(overtimeAmount));
      setValue('grossAmount', Math.round(gross + overtimeAmount));
      toast.success('Calculated from attendance');
    } catch (e: any) {
      toast.error(e.body?.message || 'Failed to calculate from attendance');
    }
  };

  const filteredPayments = payments.filter((p) => {
    const start = String(p.periodStart).slice(0, 10);
    const labourMatch = !filters.labourId || String(p.labourId) === filters.labourId;
    const searchMatch = !search || p.labour?.fullName?.toLowerCase().includes(search.toLowerCase());
    const statusMatch = !filters.status || p.status === filters.status;
    const fromMatch = !filters.from || start >= filters.from;
    const toMatch = !filters.to || start <= filters.to;
    return labourMatch && searchMatch && statusMatch && fromMatch && toMatch;
  });
  const tablePageSize = 10;
  const paginatedPayments = filteredPayments.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);

  const openCreate = () => {
    setFormMode('add');
    setSelectedPaymentForEdit(null);
    reset(getEmptyPaymentForm());
    setIsModalOpen(true);
  };

  const openEdit = (p: any) => {
    setFormMode('edit');
    setSelectedPaymentForEdit(p);
    reset({
      labourId: p.labourId,
      paymentType: p.paymentType,
      periodStart: String(p.periodStart).slice(0, 10),
      periodEnd: String(p.periodEnd).slice(0, 10),
      totalDaysPresent: p.totalDaysPresent,
      totalHalfDays: p.totalHalfDays,
      overtimeAmount: p.overtimeAmount,
      grossAmount: p.grossAmount,
      advanceAmount: p.advanceAmount,
      paidAmount: p.paidAmount,
      balanceAmount: p.balanceAmount,
      status: p.status,
      remarks: p.remarks || '',
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    setTablePage(1);
  }, [search, filters.labourId, filters.status, filters.from, filters.to]);

  const createPeriodStart = watch('periodStart');

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Payments & Settlements</h1>
          <p className="text-slate-500 font-medium mt-1">Manage weekly/monthly payments and track balances.</p>
        </div>
        <button 
          onClick={openCreate}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl font-medium inline-flex items-center space-x-2 shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
        >
          <Receipt size={20} />
          <span>Settle Payment</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-wrap gap-2 items-center">
          <Filter size={16} className="text-slate-500" />
          <div className="relative min-w-[220px]">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search labour name" className="pl-9 pr-3 py-2 border rounded-lg bg-white text-sm" />
          </div>
          <select value={filters.labourId} onChange={(e) => setFilters({ ...filters, labourId: e.target.value })} className="p-2 border rounded-lg bg-white text-sm">
            <option value="">All Labours</option>
            {labours.map((l) => <option key={l.id} value={l.id}>{l.fullName}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="p-2 border rounded-lg bg-white text-sm">
            <option value="">All Status</option>
            <option value="PENDING">PENDING</option>
            <option value="PARTIAL">PARTIAL</option>
            <option value="SETTLED">SETTLED</option>
          </select>
          <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} className="p-2 border rounded-lg text-sm" />
          <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} className="p-2 border rounded-lg text-sm" />
          <button onClick={() => { setFilters({ labourId: '', status: '', from: '', to: '' }); setSearch(''); }} className="px-3 py-2 border rounded-lg text-sm">Clear Filters</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Labour</th>
                <th className="px-6 py-4">Period</th>
                <th className="px-6 py-4">Gross</th>
                <th className="px-6 py-4">Paid (Adv + Final)</th>
                <th className="px-6 py-4">Balance</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && paginatedPayments.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{p.labour?.fullName || 'Unknown'}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{p.paymentType}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium">
                    {format(new Date(p.periodStart), 'MMM d, yyyy')} <br/>
                    <span className="text-slate-400">to</span><br/>
                    {format(new Date(p.periodEnd), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700">₹{p.grossAmount}</td>
                  <td className="px-6 py-4 text-emerald-600 font-medium">
                    ₹{Number(p.advanceAmount) + Number(p.paidAmount)}
                  </td>
                  <td className="px-6 py-4 text-rose-600 font-bold">₹{p.balanceAmount}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border tracking-wider ${
                      p.status === 'SETTLED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      p.status === 'PARTIAL' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex gap-1">
                      <button
                        onClick={() => fetchPaymentById(p.id)}
                        title="View payment details"
                        className="p-1.5 rounded-md hover:bg-indigo-50 text-indigo-600 transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-md hover:bg-rose-50 text-rose-600">
                        <Trash2 size={16} />
                      </button>
                    </div> 
                  </td>
                </tr>
              ))}
              {loading && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">Loading payment records...</td></tr>
              )}
              {!loading && filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <TablePagination
        totalItems={filteredPayments.length}
        page={tablePage}
        pageSize={tablePageSize}
        onPageChange={setTablePage}
        itemLabel="payments"
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <IndianRupee className={formMode === 'add' ? 'text-emerald-500' : 'text-blue-500'} />
                {formMode === 'add' ? 'Process Payment' : 'Edit Payment'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setFormMode('add');
                  setSelectedPaymentForEdit(null);
                  reset(getEmptyPaymentForm());
                }}
                className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm border border-slate-100"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit(submitPayment)} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Select Labour</label>
                  <select {...register('labourId', { required: 'Labour is required' })} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                    <option value="">-- Select Labour --</option>
                    {labours.map((l: any) => (
                      <option key={l.id} value={l.id}>{l.fullName} (Wage: ₹{l.wageAmount}/{l.wageType.charAt(0)})</option>
                    ))}
                  </select>
                  {errors.labourId && <p className="text-xs text-rose-600 mt-1">{String(errors.labourId.message)}</p>}
                </div>
                <div className="md:col-span-2">
                  <button type="button" onClick={calculateFromAttendance} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100 text-sm font-medium">
                    <Calculator size={16} />
                    Auto Calculate From Attendance
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Payment Cycle</label>
                  <select {...register('paymentType', { required: 'Payment cycle is required' })} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                  {errors.paymentType && <p className="text-xs text-rose-600 mt-1">{String(errors.paymentType.message)}</p>}
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">From Date</label>
                    <input type="date" {...register('periodStart', { required: 'From date is required' })} className="w-full p-3 border border-slate-200 rounded-xl outline-none" />
                    {errors.periodStart && <p className="text-xs text-rose-600 mt-1">{String(errors.periodStart.message)}</p>}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">To Date</label>
                    <input
                      type="date"
                      {...register('periodEnd', {
                        required: 'To date is required',
                        validate: (value) => !createPeriodStart || value >= createPeriodStart || 'To date must be same or after from date',
                      })}
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                    />
                    {errors.periodEnd && <p className="text-xs text-rose-600 mt-1">{String(errors.periodEnd.message)}</p>}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 shadow-sm">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Days Present</label>
                    <input type="number" {...register('totalDaysPresent', { required: 'Days present is required', min: { value: 0, message: 'Cannot be negative' }, valueAsNumber: true })} onFocus={selectOnFocus} className="w-full p-2 border border-slate-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-emerald-500" placeholder="0" defaultValue="0"/>
                    {errors.totalDaysPresent && <p className="text-xs text-rose-600 mt-1">{String(errors.totalDaysPresent.message)}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Half Days</label>
                    <input type="number" {...register('totalHalfDays', { required: 'Half days is required', min: { value: 0, message: 'Cannot be negative' }, valueAsNumber: true })} onFocus={selectOnFocus} className="w-full p-2 border border-slate-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-emerald-500" placeholder="0" defaultValue="0"/>
                    {errors.totalHalfDays && <p className="text-xs text-rose-600 mt-1">{String(errors.totalHalfDays.message)}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Overtime (₹)</label>
                    <input type="number" {...register('overtimeAmount', { min: { value: 0, message: 'Cannot be negative' }, valueAsNumber: true })} onFocus={selectOnFocus} className="w-full p-2 border border-slate-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-emerald-500" placeholder="0" defaultValue="0"/>
                    {errors.overtimeAmount && <p className="text-xs text-rose-600 mt-1">{String(errors.overtimeAmount.message)}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">Gross Amount (₹)</label>
                    <input type="number" {...register('grossAmount', { required: 'Gross amount is required', min: { value: 0, message: 'Cannot be negative' }, valueAsNumber: true })} onFocus={selectOnFocus} className="w-full p-2 border border-emerald-300 bg-emerald-50 rounded-lg outline-none text-emerald-700 font-bold focus:ring-2 focus:ring-emerald-500" placeholder="Required"/>
                    {errors.grossAmount && <p className="text-xs text-rose-600 mt-1">{String(errors.grossAmount.message)}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Advance Paid (₹)</label>
                  <input type="number" {...register('advanceAmount', { min: { value: 0, message: 'Cannot be negative' }, valueAsNumber: true })} onFocus={selectOnFocus} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0" defaultValue="0" />
                  {errors.advanceAmount && <p className="text-xs text-rose-600 mt-1">{String(errors.advanceAmount.message)}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Payment Now (₹)</label>
                  <input type="number" {...register('paidAmount', { min: { value: 0, message: 'Cannot be negative' }, valueAsNumber: true })} onFocus={selectOnFocus} className="w-full p-3 border border-blue-200 rounded-xl outline-none bg-blue-50 focus:ring-2 focus:ring-emerald-500" placeholder="0" defaultValue="0" />
                  {errors.paidAmount && <p className="text-xs text-rose-600 mt-1">{String(errors.paidAmount.message)}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Balance Amount (₹)</label>
                  <input type="number" {...register('balanceAmount', { min: { value: 0, message: 'Cannot be negative' }, valueAsNumber: true })} onFocus={selectOnFocus} className="w-full p-3 border border-slate-200 rounded-xl outline-none" placeholder="Auto-calculated if empty" />
                  {errors.balanceAmount && <p className="text-xs text-rose-600 mt-1">{String(errors.balanceAmount.message)}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                  <select {...register('status')} className="w-full p-3 border border-slate-200 rounded-xl outline-none bg-white">
                    <option value="PENDING">PENDING</option>
                    <option value="PARTIAL">PARTIAL</option>
                    <option value="SETTLED">SETTLED</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Remarks</label>
                  <textarea {...register('remarks', { maxLength: { value: 1000, message: 'Remarks cannot exceed 1000 characters' } })} rows={2} className="w-full p-3 border border-slate-200 rounded-xl outline-none" placeholder="Optional remarks" />
                  {errors.remarks && <p className="text-xs text-rose-600 mt-1">{String(errors.remarks.message)}</p>}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormMode('add');
                    setSelectedPaymentForEdit(null);
                    reset(getEmptyPaymentForm());
                  }}
                  className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl font-medium text-white transition-all flex items-center gap-2 ${
                    formMode === 'add'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/30'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30'
                  }`}
                >
                  <CheckCircle size={18}/> {formMode === 'add' ? 'Process Payment' : 'Update Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {selectedPayment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-3xl rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
            <div className="px-4 md:px-6 py-4 md:py-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white flex justify-between items-start gap-3 sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-lg md:text-xl text-slate-900">Payment Details</h3>
                <p className="text-sm text-slate-500 mt-0.5">Detailed settlement information for this cycle.</p>
              </div>
              <button onClick={() => setSelectedPayment(null)} className="text-slate-500 hover:text-slate-700 bg-white p-2 rounded-full border border-slate-200 shrink-0">✕</button>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs uppercase font-bold border tracking-wide ${
                  selectedPayment.status === 'SETTLED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  selectedPayment.status === 'PARTIAL' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {selectedPayment.status}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs border border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold">
                  <CalendarDays size={13} />
                  {selectedPayment.paymentType}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-slate-50"><p className="text-xs text-slate-500">Labour</p><p className="font-semibold">{selectedPayment.labour?.fullName || selectedPayment.labourId}</p></div>
                <div className="p-3 rounded-lg bg-slate-50"><p className="text-xs text-slate-500">Period</p><p className="font-semibold">{selectedPayment.periodStart} to {selectedPayment.periodEnd}</p></div>
                <div className="p-3 rounded-lg bg-slate-50"><p className="text-xs text-slate-500">Attendance Days</p><p className="font-semibold">{selectedPayment.totalDaysPresent} + {selectedPayment.totalHalfDays} half</p></div>
                <div className="p-3 rounded-lg bg-slate-50"><p className="text-xs text-slate-500">Overtime</p><p className="font-semibold">₹{selectedPayment.overtimeAmount}</p></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <p className="text-xs text-slate-500">Gross</p>
                  <p className="text-base md:text-lg font-bold text-slate-900">₹{selectedPayment.grossAmount}</p>
                </div>
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50">
                  <p className="text-xs text-emerald-600">Paid (Adv + Final)</p>
                  <p className="text-base md:text-lg font-bold text-emerald-700 break-all">₹{Number(selectedPayment.advanceAmount) + Number(selectedPayment.paidAmount)}</p>
                </div>
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50">
                  <p className="text-xs text-rose-600">Balance</p>
                  <p className="text-base md:text-lg font-bold text-rose-700">₹{selectedPayment.balanceAmount}</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 text-sm">
                <p className="text-xs text-slate-500">Remarks</p>
                <p className="font-semibold">{selectedPayment.remarks || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        open={deleteId !== null}
        title="Delete Payment"
        description="Are you sure you want to delete this payment entry?"
        confirmText="Delete Payment"
        onConfirm={deletePayment}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
