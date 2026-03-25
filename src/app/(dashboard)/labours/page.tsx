'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Eye, Power, Search, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { ConfirmModal } from '@/components/ConfirmModal';

type LabourForm = {
  fullName: string;
  phone: string;
  alternatePhone?: string;
  address?: string;
  workType: string;
  wageType: string;
  wageAmount: number | string;
  joiningDate?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  notes?: string;
};

type Labour = {
  id: number;
  fullName: string;
  phone: string;
  alternatePhone?: string;
  address?: string;
  workType: string;
  wageType: string;
  wageAmount: number;
  joiningDate?: string;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
};

const getStatusBadgeClass = (status: Labour['status']) =>
  status === 'ACTIVE'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
    : 'bg-rose-50 text-rose-700 border-rose-100';

const getWorkTypeBadgeClass = (workType: string) => {
  const key = (workType || '').trim().toLowerCase();
  switch (key) {
    case 'mason':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'helper':
      return 'bg-sky-50 text-sky-700 border-sky-100';
    case 'carpenter':
      return 'bg-orange-50 text-orange-700 border-orange-100';
    case 'electrician':
      return 'bg-yellow-50 text-yellow-700 border-yellow-100';
    case 'plumber':
      return 'bg-cyan-50 text-cyan-700 border-cyan-100';
    case 'painter':
      return 'bg-pink-50 text-pink-700 border-pink-100';
    case 'steel worker':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'tile worker':
      return 'bg-violet-50 text-violet-700 border-violet-100';
    default:
      return 'bg-indigo-50 text-indigo-700 border-indigo-100';
  }
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error && 'body' in error) {
    const body = (error as { body?: { message?: string } }).body;
    if (body?.message) return body.message;
  }
  return fallback;
};

export default function LaboursPage() {
  const [labours, setLabours] = useState<Labour[]>([]);
  const [selectedLabour, setSelectedLabour] = useState<Labour | null>(null);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [selectedLabourForEdit, setSelectedLabourForEdit] = useState<Labour | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<LabourForm>({
    defaultValues: { status: 'ACTIVE', wageType: 'DAILY', workType: 'Mason' },
  });

  const fetchLabours = () => {
    apiClient
      .get(apiClient.URLS.labours)
      .then((res) => setLabours(res.data))
      .catch((e) => {
        console.error(e);
        toast.error('Failed to load labours');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLabours();
  }, []);

  const submitLabour = async (data: LabourForm) => {
    try {
      const payload = {
        ...data,
        wageAmount: Number(data.wageAmount),
        joiningDate: data.joiningDate || undefined,
      };

      if (formMode === 'add') {
        await apiClient.post(apiClient.URLS.labours, payload);
        toast.success('Labour added successfully!');
      } else {
        if (!selectedLabourForEdit?.id) return;
        await apiClient.patch(`${apiClient.URLS.labours}/${selectedLabourForEdit.id}`, payload);
        toast.success('Labour updated');
      }

      setIsModalOpen(false);
      setFormMode('add');
      setSelectedLabourForEdit(null);
      reset({ status: 'ACTIVE', wageType: 'DAILY', workType: 'Mason' });
      await fetchLabours();
    } catch (e: unknown) {
      console.error(e);
      toast.error(getApiErrorMessage(e, 'Failed to save labour'));
    }
  };

  const openCreate = () => {
    setFormMode('add');
    setSelectedLabourForEdit(null);
    reset({ status: 'ACTIVE', wageType: 'DAILY', workType: 'Mason' });
    setIsModalOpen(true);
  };

  const openEdit = (labour: Labour) => {
    setFormMode('edit');
    setSelectedLabourForEdit(labour);
    reset({
      ...labour,
      joiningDate: labour.joiningDate ? String(labour.joiningDate).slice(0, 10) : '',
    });
    setIsModalOpen(true);
  };

  const viewLabour = async (id: number) => {
    try {
      const res = await apiClient.get(`${apiClient.URLS.labours}/${id}`);
      setSelectedLabour(res.data);
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e, 'Failed to load labour details'));
    }
  };

  const toggleStatus = async (labour: Labour) => {
    try {
      const nextStatus = labour.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await apiClient.patch(`${apiClient.URLS.labours}/${labour.id}/status`, { status: nextStatus });
      toast.success(`Labour marked ${nextStatus}`);
      fetchLabours();
      if (selectedLabour?.id === labour.id) setSelectedLabour({ ...selectedLabour, status: nextStatus });
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e, 'Failed to update labour status'));
    }
  };

  const deleteLabour = async () => {
    if (!deleteId) return;
    try {
      await apiClient.delete(`${apiClient.URLS.labours}/${deleteId}`);
      toast.success('Labour deleted');
      if (selectedLabour?.id === deleteId) setSelectedLabour(null);
      setDeleteId(null);
      fetchLabours();
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e, 'Failed to delete labour'));
    }
  };

  const filteredLabours = labours.filter((l) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || l.fullName?.toLowerCase().includes(query) || l.phone?.toLowerCase().includes(query);
    const matchesStatus = !statusFilter || l.status === statusFilter;
    const matchesWorkType = !workTypeFilter || l.workType === workTypeFilter;
    return matchesSearch && matchesStatus && matchesWorkType;
  });

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setWorkTypeFilter('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manage Labours</h1>
          <p className="text-slate-500 font-medium mt-1">Add, edit, and organize your workforce.</p>
        </div>
        <button 
          onClick={openCreate}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium inline-flex items-center space-x-2 shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
        >
          <Plus size={20} />
          <span>Add Labour</span>
        </button>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone" className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 border border-slate-200 rounded-lg bg-white">
          <option value="">All Status</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
        <select value={workTypeFilter} onChange={(e) => setWorkTypeFilter(e.target.value)} className="px-3 py-2.5 border border-slate-200 rounded-lg bg-white">
          <option value="">All Work Types</option>
          <option value="Mason">Mason</option><option value="Helper">Helper</option><option value="Carpenter">Carpenter</option><option value="Electrician">Electrician</option><option value="Plumber">Plumber</option><option value="Painter">Painter</option><option value="Steel worker">Steel worker</option><option value="Tile worker">Tile worker</option><option value="Other">Other</option>
        </select>
        <button onClick={clearFilters} className="px-3 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm">Clear Filters</button>
        <button onClick={fetchLabours} className="px-3 py-2.5 rounded-lg bg-slate-900 text-white text-sm inline-flex items-center gap-1"><RefreshCw size={14}/>Refresh</button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Work Type</th>
                <th className="px-6 py-4">Wage</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && filteredLabours.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{l.fullName}</div>
                   
                  </td>
                  <td className="px-6 py-4">
                    <div>{l.phone}</div>
                    {l.alternatePhone && <div className="text-xs text-slate-400">{l.alternatePhone}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getWorkTypeBadgeClass(l.workType)}`}>
                      {l.workType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-700">₹{l.wageAmount}</span> 
                    <span className="text-xs text-slate-400">/{l.wageType.toLowerCase()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(l.status)}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{l.joiningDate || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => viewLabour(l.id)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-white hover:bg-indigo-50 rounded-lg border border-transparent hover:border-indigo-100 transition-colors">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => toggleStatus(l)} className="p-1.5 text-slate-400 hover:text-amber-600 bg-white hover:bg-amber-50 rounded-lg border border-transparent hover:border-amber-100 transition-colors">
                        <Power size={16} />
                      </button>
                      <button onClick={() => openEdit(l)} className="p-1.5 text-slate-400 hover:text-blue-600 bg-white hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100 transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => setDeleteId(l.id)} className="p-1.5 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">Loading labours...</td></tr>
              )}
              {!loading && filteredLabours.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No labours found. Click Add Labour to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">
                {formMode === 'add' ? 'Add New Labour' : 'Edit Labour'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setFormMode('add');
                  setSelectedLabourForEdit(null);
                  reset({ status: 'ACTIVE', wageType: 'DAILY', workType: 'Mason' });
                }}
                className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm border border-slate-100"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit(submitLabour)} className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                  <input {...register('fullName', { required: true })} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm" placeholder="e.g. Raju Kumar" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
                  <input {...register('phone', { required: true })} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm" placeholder="+91 9876543210" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Alternate Phone</label>
                  <input {...register('alternatePhone')} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm" placeholder="+91 9000000000" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Work Type</label>
                  <select {...register('workType', { required: true })} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm bg-white">
                    <option value="Mason">Mason</option>
                    <option value="Helper">Helper</option>
                    <option value="Carpenter">Carpenter</option>
                    <option value="Electrician">Electrician</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Painter">Painter</option>
                    <option value="Steel worker">Steel worker</option>
                    <option value="Tile worker">Tile worker</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Wage Type</label>
                  <select {...register('wageType', { required: true })} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm bg-white">
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Wage Amount (₹)</label>
                  <input {...register('wageAmount', { required: true })} type="number" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm" placeholder="700" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Joining Date</label>
                  <input type="date" {...register('joiningDate')} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                  <select {...register('status')} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm bg-white">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Address</label>
                  <textarea {...register('address')} rows={2} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm" placeholder="Address" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label>
                  <textarea {...register('notes')} rows={2} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm" placeholder="Special notes" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormMode('add');
                    setSelectedLabourForEdit(null);
                    reset({ status: 'ACTIVE', wageType: 'DAILY', workType: 'Mason' });
                  }}
                  className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">
                  {formMode === 'add' ? 'Save Labour' : 'Update Labour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {selectedLabour && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedLabour.fullName || 'Labour Details'}</h3>
                <p className="text-sm text-slate-500 mt-1">View full labour information</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLabour(null)}
                className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm border border-slate-100"
                aria-label="Close labour details"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-slate-50"><p className="text-xs text-slate-500">Name</p><p className="font-semibold">{selectedLabour.fullName || '-'}</p></div>
                <div className="p-3 rounded-lg bg-slate-50"><p className="text-xs text-slate-500">Phone</p><p className="font-semibold">{selectedLabour.phone || '-'}</p></div>
                <div className="p-3 rounded-lg bg-slate-50"><p className="text-xs text-slate-500">Alternate</p><p className="font-semibold">{selectedLabour.alternatePhone || '-'}</p></div>
                <div className="p-3 rounded-lg bg-slate-50"><p className="text-xs text-slate-500">Work Type</p><p className="font-semibold">{selectedLabour.workType || '-'}</p></div>
                <div className="p-3 rounded-lg bg-slate-50"><p className="text-xs text-slate-500">Wage Type</p><p className="font-semibold">{selectedLabour.wageType || '-'}</p></div>
                <div className="p-3 rounded-lg bg-slate-50"><p className="text-xs text-slate-500">Wage</p><p className="font-semibold">Rs. {selectedLabour.wageAmount || 0}</p></div>
                <div className="p-3 rounded-lg bg-slate-50"><p className="text-xs text-slate-500">Status</p><p className="font-semibold">{selectedLabour.status || '-'}</p></div>
                <div className="p-3 rounded-lg bg-slate-50"><p className="text-xs text-slate-500">Joining</p><p className="font-semibold">{selectedLabour.joiningDate || '-'}</p></div>
                <div className="md:col-span-2 p-3 rounded-lg bg-slate-50"><p className="text-xs text-slate-500">Address</p><p className="font-semibold">{selectedLabour.address || '-'}</p></div>
                <div className="md:col-span-2 p-3 rounded-lg bg-slate-50"><p className="text-xs text-slate-500">Notes</p><p className="font-semibold">{selectedLabour.notes || '-'}</p></div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedLabour(null)}
                  className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openEdit(selectedLabour);
                    setSelectedLabour(null);
                  }}
                  className="px-5 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Edit Labour
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        open={deleteId !== null}
        title="Delete Labour"
        description="Are you sure you want to delete this labour record? This action cannot be undone."
        confirmText="Delete Labour"
        onConfirm={deleteLabour}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}