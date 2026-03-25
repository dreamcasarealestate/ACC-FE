'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';
import { format, isWithinInterval, startOfMonth, startOfWeek } from 'date-fns';
import { CheckCircle2, XCircle, Clock, Plane, Trash2, Edit, Search } from 'lucide-react';
import { ConfirmModal } from '@/components/ConfirmModal';
import { TablePagination } from '@/components/TablePagination';

export default function AttendancePage() {
  const [labours, setLabours] = useState([]);
  const [users, setUsers] = useState<any[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<any[]>([]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [overtimeHours, setOvertimeHours] = useState('0');
  const [remarks, setRemarks] = useState('');
  const [selectedLabourId, setSelectedLabourId] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [recordsPage, setRecordsPage] = useState(1);

  const fetchAttendance = async (labourId?: string, workDate?: string) => {
    try {
      setTableLoading(true);
      const url = labourId ? `${apiClient.URLS.attendance}/labour/${labourId}` : apiClient.URLS.attendance;
      const res = await apiClient.get(url);
      const rows = workDate ? res.data.filter((r: any) => String(r.date).slice(0, 10) === workDate) : res.data;
      setAttendanceRows(rows);
    } catch (e: any) {
      toast.error(e.body?.message || 'Failed to load attendance');
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    apiClient.get(apiClient.URLS.labours).then(res => setLabours(res.data)).catch(console.error);
    apiClient.get(apiClient.URLS.users).then(res => setUsers(res.data)).catch(console.error);
    fetchAttendance(undefined, date);
  }, []);

  const markAttendance = async (labourId: number, status: string) => {
    try {
      setLoading(true);
      await apiClient.post(apiClient.URLS.attendance, {
        labourId,
        date,
        status,
        overtimeHours: Number(overtimeHours) || 0,
        remarks: remarks || undefined,
      });
      toast.success(`Marked ${status} successfully.`);
      setOvertimeHours('0');
      setRemarks('');
    } catch (e: any) {
      toast.error(e.body?.message || 'Error marking attendance');
    } finally {
      setLoading(false);
      fetchAttendance(selectedLabourId || undefined, date);
    }
  };

  const deleteAttendance = async () => {
    if (!deleteId) return;
    try {
      await apiClient.delete(`${apiClient.URLS.attendance}/${deleteId}`);
      setDeleteId(null);
      toast.success('Attendance deleted');
      fetchAttendance(selectedLabourId || undefined, date);
    } catch (e: any) {
      toast.error(e.body?.message || 'Failed to delete attendance');
    }
  };

  const updateAttendance = async (payload: any) => {
    if (!editingRow?.id) return;
    try {
      await apiClient.patch(`${apiClient.URLS.attendance}/${editingRow.id}`, {
        ...payload,
        labourId: Number(payload.labourId),
        overtimeHours: Number(payload.overtimeHours) || 0,
      });
      toast.success('Attendance updated');
      setEditingRow(null);
      fetchAttendance(selectedLabourId || undefined, date);
    } catch (e: any) {
      toast.error(e.body?.message || 'Failed to update attendance');
    }
  };

  const dailyCount = attendanceRows.length;
  const weeklyCount = attendanceRows.filter((r) => {
    const d = new Date(r.date);
    return isWithinInterval(d, { start: startOfWeek(new Date(date), { weekStartsOn: 1 }), end: new Date(date) });
  }).length;
  const monthlyCount = attendanceRows.filter((r) => {
    const d = new Date(r.date);
    return isWithinInterval(d, { start: startOfMonth(new Date(date)), end: new Date(date) });
  }).length;
  const filteredLabours = (labours as any[]).filter((l: any) => l.fullName?.toLowerCase().includes(search.toLowerCase()));
  const filteredRows = attendanceRows.filter((r: any) => !statusFilter || r.status === statusFilter);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredLabours.length / pageSize));
  const paginatedLabours = filteredLabours.slice((page - 1) * pageSize, page * pageSize);
  const getMarkedByName = (markedBy: number | null | undefined) => {
    if (!markedBy) return '-';
    const user = users.find((u) => Number(u.id) === Number(markedBy));
    return user?.name || `User #${markedBy}`;
  };
  const attendanceMap = new Map<number, any>((attendanceRows || []).map((r: any) => [Number(r.labourId), r]));

  useEffect(() => {
    setPage(1);
  }, [search]);
  useEffect(() => {
    setRecordsPage(1);
  }, [statusFilter, selectedLabourId, date]);
  const recordsPageSize = 10;
  const paginatedRows = filteredRows.slice((recordsPage - 1) * recordsPageSize, recordsPage * recordsPageSize);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Attendance</h1>
          <p className="text-slate-500 font-medium mt-1">Record daily presence for your workforce.</p>
        </div>
        <div className="w-full md:w-auto flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
          <span className="text-sm font-semibold text-slate-500 ml-1 sm:ml-3">Date</span>
          <input 
            type="date" 
            value={date} 
            onChange={e => {
              const nextDate = e.target.value;
              setDate(nextDate);
              fetchAttendance(selectedLabourId || undefined, nextDate);
            }}
            className="w-full sm:w-auto p-2 sm:border-l border-slate-200 bg-transparent text-slate-700 outline-none font-medium sm:ml-2 sm:pl-4 focus:ring-0"
          />
          <select value={selectedLabourId} onChange={(e) => { setSelectedLabourId(e.target.value); fetchAttendance(e.target.value || undefined, date); }} className="w-full sm:w-auto p-2 border border-slate-200 rounded-lg text-sm">
            <option value="">All Labours</option>
            {labours.map((l: any) => <option key={l.id} value={l.id}>{l.fullName}</option>)}
          </select>
          <button onClick={() => { setDate(format(new Date(), 'yyyy-MM-dd')); setSelectedLabourId(''); setSearch(''); setStatusFilter(''); setOvertimeHours('0'); setRemarks(''); fetchAttendance(undefined, format(new Date(), 'yyyy-MM-dd')); }} className="w-full sm:w-auto px-3 py-2 rounded-lg border border-slate-200 text-sm">Clear Filters</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4"><p className="text-xs text-slate-500 uppercase">Daily Records</p><p className="text-2xl font-bold">{dailyCount}</p></div>
        <div className="bg-white border border-slate-200 rounded-xl p-4"><p className="text-xs text-slate-500 uppercase">Weekly Records</p><p className="text-2xl font-bold">{weeklyCount}</p></div>
        <div className="bg-white border border-slate-200 rounded-xl p-4"><p className="text-xs text-slate-500 uppercase">Monthly Records</p><p className="text-2xl font-bold">{monthlyCount}</p></div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-wrap gap-2 items-center mb-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search labour to mark attendance" className="w-full pl-9 pr-3 py-2.5 border rounded-lg" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-auto px-3 py-2.5 border rounded-lg bg-white">
            <option value="">All Record Status</option>
            <option value="PRESENT">PRESENT</option><option value="ABSENT">ABSENT</option><option value="HALF_DAY">HALF_DAY</option><option value="OVERTIME">OVERTIME</option><option value="LEAVE">LEAVE</option>
          </select>
          <button onClick={() => { setSearch(''); setStatusFilter(''); }} className="w-full sm:w-auto px-3 py-2.5 border rounded-lg text-sm">Clear</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500">Overtime Hours</label>
            <input value={overtimeHours} onChange={(e) => setOvertimeHours(e.target.value)} type="number" step="0.5" className="w-full mt-1 p-2 border rounded-lg" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Remarks</label>
            <input value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full mt-1 p-2 border rounded-lg" placeholder="Optional remarks" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {paginatedLabours.map((l: any) => (
          <div
            key={l.id}
            className={`bg-white p-6 rounded-2xl shadow-sm border transition-all group flex flex-col justify-between ${
              attendanceMap.has(Number(l.id))
                ? 'border-slate-200 opacity-80'
                : 'border-slate-100 hover:border-blue-200 hover:shadow-md'
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1 truncate">{l.fullName}</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">{l.workType}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center font-bold text-slate-400 border border-slate-100 flex-shrink-0 ml-2">
                  {l.fullName.substring(0, 2).toUpperCase()}
                </div>
              </div>
              
              <div className="my-3 text-sm text-slate-500">
                <p>Wage: ₹{l.wageAmount}/{l.wageType.charAt(0)}</p>
              </div>
              {attendanceMap.has(Number(l.id)) && (
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border tracking-wider ${
                    attendanceMap.get(Number(l.id))?.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    attendanceMap.get(Number(l.id))?.status === 'ABSENT' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    attendanceMap.get(Number(l.id))?.status === 'HALF_DAY' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    attendanceMap.get(Number(l.id))?.status === 'OVERTIME' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    Marked: {attendanceMap.get(Number(l.id))?.status}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex justify-between space-x-2 pt-4 border-t border-slate-100">
              <button 
                onClick={() => markAttendance(l.id, 'PRESENT')}
                title="Mark Present"
                disabled={loading || attendanceMap.has(Number(l.id))}
                className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-medium text-sm transition-colors border border-emerald-100 disabled:opacity-50 flex justify-center items-center gap-1 shadow-sm"
              >
                <CheckCircle2 size={18}/>
              </button>
              <button 
                onClick={() => markAttendance(l.id, 'ABSENT')}
                title="Mark Absent"
                disabled={loading || attendanceMap.has(Number(l.id))}
                className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-medium text-sm transition-colors border border-rose-100 disabled:opacity-50 flex justify-center items-center gap-1 shadow-sm"
              >
                <XCircle size={18}/>
              </button>
              <button 
                onClick={() => markAttendance(l.id, 'HALF_DAY')}
                title="Mark Half Day"
                disabled={loading || attendanceMap.has(Number(l.id))}
                className="flex-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-medium text-sm transition-colors border border-amber-100 disabled:opacity-50 flex justify-center items-center gap-1 shadow-sm"
              >
                <Clock size={18}/>
              </button>
              <button 
                onClick={() => markAttendance(l.id, 'LEAVE')}
                title="Mark Leave"
                disabled={loading || attendanceMap.has(Number(l.id))}
                className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-medium text-sm transition-colors border border-indigo-100 disabled:opacity-50 flex justify-center items-center gap-1 shadow-sm"
              >
                <Plane size={18}/>
              </button>
            </div>
          </div>
        ))}

        {filteredLabours.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white border border-slate-200 border-dashed rounded-2xl">
            No active labours to mark attendance.
          </div>
        )}
      </div>
      {filteredLabours.length > pageSize && (
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3">
          <p className="text-sm text-slate-500">Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredLabours.length)} of {filteredLabours.length} labours</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1.5 border rounded-lg disabled:opacity-50">Prev</button>
            <span className="px-3 py-1.5 text-sm text-slate-600">Page {page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1.5 border rounded-lg disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-semibold text-slate-700">Attendance Records</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Labour</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">OT Hrs</th>
                <th className="px-4 py-3 text-left">Marked By</th>
                <th className="px-4 py-3 text-left">Remarks</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {!tableLoading && paginatedRows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-3">{row.labour?.fullName || row.labourId}</td>
                  <td className="px-4 py-3">{row.date}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border tracking-wider ${
                      row.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      row.status === 'ABSENT' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      row.status === 'HALF_DAY' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      row.status === 'OVERTIME' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{row.overtimeHours}</td>
                  <td className="px-4 py-3">{getMarkedByName(row.markedBy)}</td>
                  <td className="px-4 py-3">{row.remarks || '-'}</td>
                  <td className="px-4 py-3 text-right flex items-center gap-2">
                    <button onClick={() => setEditingRow(row)} className="inline-flex p-1.5 rounded-md hover:bg-blue-50 text-blue-500 mr-1">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => setDeleteId(row.id)} className="inline-flex p-1.5 rounded-md hover:bg-rose-50 text-rose-500">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {tableLoading && (
                <tr><td className="px-4 py-8 text-center text-slate-400" colSpan={7}>Loading attendance records...</td></tr>
              )}
              {!tableLoading && filteredRows.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-400" colSpan={7}>No attendance records</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <TablePagination
        totalItems={filteredRows.length}
        page={recordsPage}
        pageSize={recordsPageSize}
        onPageChange={setRecordsPage}
        itemLabel="attendance records"
      />
      {editingRow && (
        <EditAttendanceModal row={editingRow} onClose={() => setEditingRow(null)} onSave={updateAttendance} labours={labours} />
      )}
      <ConfirmModal
        open={deleteId !== null}
        title="Delete Attendance"
        description="Do you really want to delete this attendance record?"
        confirmText="Delete Record"
        onConfirm={deleteAttendance}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

function EditAttendanceModal({ row, onClose, onSave, labours }: { row: any; onClose: () => void; onSave: (payload: any) => void; labours: any[] }) {
  const [form, setForm] = useState({
    labourId: String(row.labourId),
    date: String(row.date).slice(0, 10),
    status: row.status,
    overtimeHours: String(row.overtimeHours ?? 0),
    remarks: row.remarks || '',
  });

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b flex justify-between"><h3 className="font-bold">Edit Attendance</h3><button onClick={onClose}>✕</button></div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><label className="text-xs font-semibold text-slate-500">Labour</label><select value={form.labourId} onChange={(e) => setForm({ ...form, labourId: e.target.value })} className="w-full mt-1 p-2.5 border rounded-lg bg-white">{labours.map((l) => <option key={l.id} value={l.id}>{l.fullName}</option>)}</select></div>
          <div><label className="text-xs font-semibold text-slate-500">Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full mt-1 p-2.5 border rounded-lg" /></div>
          <div><label className="text-xs font-semibold text-slate-500">Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full mt-1 p-2.5 border rounded-lg bg-white"><option value="PRESENT">PRESENT</option><option value="ABSENT">ABSENT</option><option value="HALF_DAY">HALF_DAY</option><option value="OVERTIME">OVERTIME</option><option value="LEAVE">LEAVE</option></select></div>
          <div><label className="text-xs font-semibold text-slate-500">Overtime Hours</label><input value={form.overtimeHours} onChange={(e) => setForm({ ...form, overtimeHours: e.target.value })} type="number" step="0.5" className="w-full mt-1 p-2.5 border rounded-lg" /></div>
          <div className="md:col-span-2"><label className="text-xs font-semibold text-slate-500">Remarks</label><input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Remarks" className="w-full mt-1 p-2.5 border rounded-lg" /></div>
        </div>
        <div className="p-5 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-600">Cancel</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Save</button>
        </div>
      </div>
    </div>
  );
}
