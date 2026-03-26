'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Trash2, UserCog, Edit, Search, RefreshCw, Eye, EyeOff } from 'lucide-react';
import apiClient from '@/lib/api';
import { ConfirmModal } from '@/components/ConfirmModal';
import { TablePagination } from '@/components/TablePagination';
import { SectionLoader } from '@/components/SectionLoader';

type UserForm = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'ADMIN' | 'SUPERVISOR';
};

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserForm>({
    defaultValues: { role: 'SUPERVISOR' },
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(apiClient.URLS.users);
      setUsers(res.data);
    } catch (e: any) {
      toast.error(e.body?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const submitUser = async (data: UserForm) => {
    try {
      if (formMode === 'add') {
        await apiClient.post(apiClient.URLS.users, data);
        toast.success('User created');
      } else {
        if (!selectedUser?.id) return;
        const payload: Partial<UserForm> = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role,
        };
        if (data.password?.trim()) payload.password = data.password;
        await apiClient.patch(`${apiClient.URLS.users}/${selectedUser.id}`, payload);
        toast.success('User updated');
      }
      setIsModalOpen(false);
      setSelectedUser(null);
      setFormMode('add');
      reset({ role: 'SUPERVISOR' });
      await fetchUsers();
    } catch (e: any) {
      toast.error(e.body?.message || 'Failed to save user');
    }
  };

  const deleteUser = async (id: number) => {
    setDeleteId(id);
  };

  const confirmDeleteUser = async () => {
    if (!deleteId) return;
    try {
      await apiClient.delete(`${apiClient.URLS.users}/${deleteId}`);
      toast.success('User deleted');
      setDeleteId(null);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.body?.message || 'Failed to delete user');
    }
  };

  const openCreate = () => {
    setFormMode('add');
    setSelectedUser(null);
    reset({ name: '', email: '', phone: '', password: '', role: 'SUPERVISOR' });
    setIsModalOpen(true);
  };

  const openEdit = (user: any) => {
    setFormMode('edit');
    setSelectedUser(user);
    reset({ ...user, password: '' });
    setIsModalOpen(true);
  };

  const filteredUsers = users.filter((u) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });
  const tablePageSize = 10;
  const paginatedUsers = filteredUsers.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);

  const handleRefresh = async () => {
    setSearch('');
    setRoleFilter('');
    setIsModalOpen(false);
    setSelectedUser(null);
    setFormMode('add');
    setDeleteId(null);
    setShowPassword(false);
    reset({ role: 'SUPERVISOR' });
    setTablePage(1);
    await fetchUsers();
  };

  useEffect(() => {
    setTablePage(1);
  }, [search, roleFilter]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Users</h1>
          <p className="text-slate-500 mt-1">Manage admins and supervisors.</p>
        </div>
        <button
          onClick={openCreate}
          className="w-full sm:w-auto justify-center bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-lg shadow-indigo-500/30"
        >
          <Plus size={18} />
          Add User
        </button>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, phone" className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full sm:w-auto px-3 py-2.5 border border-slate-200 rounded-lg bg-white">
          <option value="">All Roles</option>
          <option value="ADMIN">ADMIN</option>
          <option value="SUPERVISOR">SUPERVISOR</option>
        </select>
        <button onClick={() => { setSearch(''); setRoleFilter(''); }} className="w-full sm:w-auto px-3 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm">Clear Filters</button>
        <button onClick={handleRefresh} className="w-full sm:w-auto px-3 py-2.5 rounded-lg bg-slate-900 text-white text-sm inline-flex items-center justify-center gap-1"><RefreshCw size={14}/>Refresh</button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="px-5 py-3 text-left">Name</th>
              <th className="px-5 py-3 text-left">Email</th>
              <th className="px-5 py-3 text-left">Phone</th>
              <th className="px-5 py-3 text-left">Role</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {!loading && paginatedUsers.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-5 py-3 font-medium text-slate-800">{u.name}</td>
                <td className="px-5 py-3">{u.email}</td>
                <td className="px-5 py-3">{u.phone}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md border text-xs font-semibold ${
                    u.role === 'ADMIN'
                      ? 'bg-rose-50 text-rose-700 border-rose-100'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                  }`}>
                    <UserCog size={14} className="mr-1" />
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => openEdit(u)} className="inline-flex p-1.5 text-blue-600 hover:bg-blue-50 rounded-md mr-1">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => deleteUser(u.id)} className="inline-flex p-1.5 text-rose-600 hover:bg-rose-50 rounded-md">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td className="px-5" colSpan={5}>
                  <SectionLoader label="Loading users..." />
                </td>
              </tr>
            )}
            {!loading && filteredUsers.length === 0 && (
              <tr>
                <td className="px-5 py-10 text-center text-slate-400" colSpan={5}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
      <TablePagination
        totalItems={filteredUsers.length}
        page={tablePage}
        pageSize={tablePageSize}
        onPageChange={setTablePage}
        itemLabel="users"
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="font-bold text-lg">{formMode === 'add' ? 'Create User' : 'Edit User'}</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedUser(null);
                  setFormMode('add');
                  setShowPassword(false);
                  reset({ role: 'SUPERVISOR' });
                }}
                className="text-slate-500"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit(submitUser)} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Name</label>
                <input {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Name should be at least 2 characters' } })} placeholder="e.g. kiran" className="w-full mt-1 p-2.5 border rounded-lg" />
                {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name.message}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Email</label>
                <input type="email" {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' } })} placeholder="name@example.com" className="w-full mt-1 p-2.5 border rounded-lg" />
                {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Phone</label>
                <input {...register('phone', { required: 'Phone is required', pattern: { value: /^[0-9+\-\s]{8,15}$/, message: 'Enter a valid phone number' } })} placeholder="+91 9876543210" className="w-full mt-1 p-2.5 border rounded-lg" />
                {errors.phone && <p className="text-xs text-rose-600 mt-1">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Role</label>
                <select {...register('role')} className="w-full mt-1 p-2.5 border rounded-lg bg-white">
                  <option value="" disabled>Select role</option>
                  <option value="SUPERVISOR">SUPERVISOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">
                  {formMode === 'add' ? 'Password' : 'Password (optional)'}
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', formMode === 'add'
                      ? { required: 'Password is required', minLength: { value: 4, message: 'Password should be at least 4 characters' } }
                      : { minLength: { value: 4, message: 'Password should be at least 4 characters' } })}
                    className="w-full p-2.5 pr-10 border rounded-lg"
                    placeholder={formMode === 'add' ? 'Enter password' : 'Leave empty to keep existing password'}
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-2 text-slate-500 hover:text-slate-700">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-rose-600 mt-1">{errors.password.message}</p>}
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedUser(null);
                    setFormMode('add');
                    setShowPassword(false);
                    reset({ role: 'SUPERVISOR' });
                  }}
                  className="px-4 py-2 rounded-lg font-semibold text-slate-700 border border-slate-300/90 bg-gradient-to-b from-white to-slate-50 hover:from-slate-50 hover:to-slate-100 shadow-sm hover:shadow-md transition-all"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                  {formMode === 'add' ? 'Create User' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        open={deleteId !== null}
        title="Delete User"
        description="Are you sure you want to delete this user account?"
        confirmText="Delete User"
        onConfirm={confirmDeleteUser}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
