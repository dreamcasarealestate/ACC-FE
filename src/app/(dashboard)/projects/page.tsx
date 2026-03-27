'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, Building2, Users2, Layers, Eye } from 'lucide-react';
import apiClient from '@/lib/api';
import { ConfirmModal } from '@/components/ConfirmModal';
import { TablePagination } from '@/components/TablePagination';
import { SectionLoader } from '@/components/SectionLoader';

type ProjectForm = {
  projectName: string;
  town: string;
  ownerName: string;
  ownerContact: string;
  siteAddress: string;
  description?: string;
  labourIds: string[];
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [labours, setLabours] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [townFilter, setTownFilter] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [projectLaboursView, setProjectLaboursView] = useState<{ projectName: string; labours: any[] } | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProjectForm>({
    defaultValues: { labourIds: [] },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectRes, labourRes] = await Promise.all([
        apiClient.get(apiClient.URLS.projects),
        apiClient.get(apiClient.URLS.labours),
      ]);
      setProjects(Array.isArray(projectRes.data) ? projectRes.data : []);
      setLabours(Array.isArray(labourRes.data) ? labourRes.data : []);
    } catch (e: any) {
      toast.error(e.body?.message || 'Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const submitProject = async (data: ProjectForm) => {
    try {
      setSubmitting(true);
      const payload = {
        ...data,
        labourIds: (data.labourIds || []).map(Number),
      };

      if (formMode === 'add') {
        await apiClient.post(apiClient.URLS.projects, payload);
        toast.success('Project created');
      } else {
        if (!selectedProject?.id) {
          toast.error('No project selected');
          return;
        }
        await apiClient.patch(`${apiClient.URLS.projects}/${selectedProject.id}`, payload);
        toast.success('Project updated');
      }

      setIsModalOpen(false);
      reset({ labourIds: [] });
      setSelectedProject(null);
      setFormMode('add');
      await fetchData();
    } catch (e: any) {
      toast.error(e.body?.message || 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const openCreate = () => {
    setFormMode('add');
    setSelectedProject(null);
    reset({
      projectName: '',
      town: '',
      ownerName: '',
      ownerContact: '',
      siteAddress: '',
      description: '',
      labourIds: [],
    });
    setIsModalOpen(true);
  };

  const openEdit = (project: any) => {
    setFormMode('edit');
    setSelectedProject(project);
    reset({
      projectName: project.projectName || '',
      town: project.town || '',
      ownerName: project.ownerName || '',
      ownerContact: project.ownerContact || '',
      siteAddress: project.siteAddress || '',
      description: project.description || '',
      labourIds: (project.labours || []).map((l: any) => String(l.id)),
    });
    setIsModalOpen(true);
  };

  const deleteProject = async () => {
    if (!deleteId) return;
    try {
      await apiClient.delete(`${apiClient.URLS.projects}/${deleteId}`);
      toast.success('Project deleted');
      setDeleteId(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.body?.message || 'Failed to delete project');
    }
  };

  const viewProjectLabours = async (project: any) => {
    try {
      const res = await apiClient.get(`${apiClient.URLS.projects}/${project.id}/labours`);
      setProjectLaboursView({
        projectName: project.projectName,
        labours: Array.isArray(res.data) ? res.data : [],
      });
    } catch (e: any) {
      toast.error(e.body?.message || 'Failed to load project labours');
    }
  };

  const filteredProjects = projects.filter((p: any) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.projectName?.toLowerCase().includes(q) ||
      p.town?.toLowerCase().includes(q) ||
      p.siteAddress?.toLowerCase().includes(q);
    const townKey = String(p.town || '').trim().toLowerCase();
    const matchesTown = !townFilter || townKey === townFilter;
    return matchesSearch && matchesTown;
  });

  const townOptions = Array.from(
    projects.reduce((acc: Map<string, string>, p: any) => {
      const rawTown = String(p.town || '').trim();
      if (!rawTown) return acc;
      const key = rawTown.toLowerCase();
      if (!acc.has(key)) {
        const label = rawTown.charAt(0).toUpperCase() + rawTown.slice(1).toLowerCase();
        acc.set(key, label);
      }
      return acc;
    }, new Map<string, string>()),
  ).map(([value, label]) => ({ value, label }));
  const tablePageSize = 10;
  const paginatedProjects = filteredProjects.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);

  useEffect(() => {
    setTablePage(1);
  }, [search, townFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Projects</h1>
          <p className="text-slate-500 mt-1">Create project sites and onboard labours.</p>
        </div>
        <button
          onClick={openCreate}
          className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2.5 rounded-xl inline-flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
        >
          <Plus size={18} />
          Add Project
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project name, town, address"
            className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg"
          />
        </div>
        <select value={townFilter} onChange={(e) => setTownFilter(e.target.value)} className="w-full md:w-auto px-3 py-2.5 border border-slate-200 rounded-lg bg-white">
          <option value="">All Towns</option>
          {townOptions.map((town) => (
            <option key={town.value} value={town.value}>{town.label}</option>
          ))}
        </select>
        <button onClick={() => { setSearch(''); setTownFilter(''); }} className="w-full md:w-auto px-3 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm">Clear Filters</button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[980px]">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-5 py-3 text-left">Project</th>
                <th className="px-5 py-3 text-left">Town</th>
                <th className="px-5 py-3 text-left">Owner Name</th>
                <th className="px-5 py-3 text-left">Owner Contact</th>
                <th className="px-5 py-3 text-left">Site Address</th>
                <th className="px-5 py-3 text-left">Onboarded Labours</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && paginatedProjects.map((p: any) => (
                <tr key={p.id} className="border-t">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-slate-800">{p.projectName}</div>
                    <div className="text-xs text-slate-500">{p.description || '-'}</div>
                  </td>
                  <td className="px-5 py-3">{p.town}</td>
                  <td className="px-5 py-3">{p.ownerName || '-'}</td>
                  <td className="px-5 py-3">{p.ownerContact || '-'}</td>
                  <td className="px-5 py-3">{p.siteAddress || '-'}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {(p.labours || []).length}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => viewProjectLabours(p)} className="inline-flex p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md mr-1" title="View project labours">
                      <Users2 size={16} />
                    </button>
                    <button onClick={() => openEdit(p)} className="inline-flex p-1.5 text-blue-600 hover:bg-blue-50 rounded-md mr-1">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => setDeleteId(p.id)} className="inline-flex p-1.5 text-rose-600 hover:bg-rose-50 rounded-md">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={7} className="px-5">
                    <SectionLoader label="Loading projects..." />
                  </td>
                </tr>
              )}
              {!loading && filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">No projects found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <TablePagination totalItems={filteredProjects.length} page={tablePage} pageSize={tablePageSize} onPageChange={setTablePage} itemLabel="projects" />

      {isModalOpen && (
        <ProjectModal
          title={formMode === 'add' ? 'Create Project' : 'Edit Project'}
          register={register}
          errors={errors}
          labours={labours}
          onSubmit={handleSubmit(submitProject)}
          submitting={submitting}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProject(null);
            setFormMode('add');
            reset({ labourIds: [] });
          }}
          submitText={formMode === 'add' ? 'Create Project' : 'Update Project'}
        />
      )}

      <ConfirmModal
        open={deleteId !== null}
        title="Delete Project"
        description="Are you sure you want to delete this project?"
        confirmText="Delete Project"
        onConfirm={deleteProject}
        onCancel={() => setDeleteId(null)}
      />
      {projectLaboursView && (
        <ProjectLaboursModal
          projectName={projectLaboursView.projectName}
          labours={projectLaboursView.labours}
          onClose={() => setProjectLaboursView(null)}
        />
      )}
    </div>
  );
}

function ProjectModal({ title, register, errors, labours, onSubmit, onClose, submitText, submitting }: any) {
  const [labourSearch, setLabourSearch] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState('');
  const [labourPage, setLabourPage] = useState(1);
  const pageSize = 10;
  const filteredLabours = (labours || []).filter((l: any) => {
    const q = labourSearch.trim().toLowerCase();
    const searchMatch = !q || l.fullName?.toLowerCase().includes(q) || l.phone?.toLowerCase().includes(q);
    const typeMatch = !workTypeFilter || l.workType === workTypeFilter;
    return searchMatch && typeMatch;
  });
  const paginatedLabours = filteredLabours.slice((labourPage - 1) * pageSize, labourPage * pageSize);
  const workTypes = Array.from(new Set((labours || []).map((l: any) => l.workType).filter(Boolean)));

  useEffect(() => {
    setLabourPage(1);
  }, [labourSearch, workTypeFilter]);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="p-5 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="font-bold text-lg flex items-center gap-2"><Building2 size={18} className="text-indigo-600" />{title}</h2>
          <button onClick={onClose} className="text-slate-500">✕</button>
        </div>
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Project Name</label>
              <input {...register('projectName', { required: 'Project name is required' })} placeholder="e.g. Green Valley Residency" className="w-full mt-1 p-2.5 border rounded-lg" />
              {errors.projectName && <p className="text-xs text-rose-600 mt-1">{errors.projectName.message}</p>}
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Town</label>
              <input {...register('town', { required: 'Town is required' })} placeholder="e.g. Warangal" className="w-full mt-1 p-2.5 border rounded-lg" />
              {errors.town && <p className="text-xs text-rose-600 mt-1">{errors.town.message}</p>}
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Owner Name</label>
              <input {...register('ownerName', { required: 'Owner name is required' })} placeholder="e.g. Ravi Kumar" className="w-full mt-1 p-2.5 border rounded-lg" />
              {errors.ownerName && <p className="text-xs text-rose-600 mt-1">{errors.ownerName.message}</p>}
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Owner Contact Number</label>
              <input {...register('ownerContact', { required: 'Owner contact is required', pattern: { value: /^[0-9+\-\s]{8,15}$/, message: 'Enter valid contact number' } })} placeholder="+91 9876543210" className="w-full mt-1 p-2.5 border rounded-lg" />
              {errors.ownerContact && <p className="text-xs text-rose-600 mt-1">{errors.ownerContact.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Site Address</label>
              <textarea {...register('siteAddress', { required: 'Site address is required' })} rows={2} className="w-full mt-1 p-2.5 border rounded-lg" placeholder="e.g. Plot no 21, Near bus stand, Hanamkonda" />
              {errors.siteAddress && <p className="text-xs text-rose-600 mt-1">{errors.siteAddress.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Description</label>
              <textarea {...register('description')} rows={2} className="w-full mt-1 p-2.5 border rounded-lg" placeholder="Project notes (optional)" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Onboard Labours</label>
              <div className="mt-2 mb-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  value={labourSearch}
                  onChange={(e) => setLabourSearch(e.target.value)}
                  placeholder="Search labour name/phone"
                  className="md:col-span-2 p-2.5 border rounded-lg"
                />
                <select value={workTypeFilter} onChange={(e) => setWorkTypeFilter(e.target.value)} className="p-2.5 border rounded-lg bg-white">
                  <option value="">All Work Types</option>
                  {workTypes.map((wt: any) => <option key={wt} value={wt}>{wt}</option>)}
                </select>
              </div>
              <div className="mt-2 border rounded-lg p-3 max-h-52 overflow-y-auto space-y-2 bg-slate-50">
                {paginatedLabours.map((l: any) => (
                  <label key={l.id} className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" value={String(l.id)} {...register('labourIds')} />
                    <span>{l.fullName} <span className="text-slate-400">({l.workType})</span></span>
                  </label>
                ))}
                {filteredLabours.length === 0 && <p className="text-xs text-slate-400">No labours available</p>}
              </div>
              <TablePagination
                totalItems={filteredLabours.length}
                page={labourPage}
                pageSize={pageSize}
                onPageChange={setLabourPage}
                itemLabel="labours"
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg font-semibold text-slate-700 border border-slate-300/90 bg-gradient-to-b from-white to-slate-50 hover:from-slate-50 hover:to-slate-100 shadow-sm hover:shadow-md transition-all">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? 'Saving...' : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProjectLaboursModal({ projectName, labours, onClose }: { projectName: string; labours: any[]; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState('');
  const [wageTypeFilter, setWageTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
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
      case 'plastering':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'concrete work':
        return 'bg-stone-100 text-stone-700 border-stone-200';
      case 'shuttering':
        return 'bg-lime-50 text-lime-700 border-lime-100';
      case 'brick mason':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'steel worker':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'tile worker':
        return 'bg-violet-50 text-violet-700 border-violet-100';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    }
  };
  const getWageTypeBadgeClass = (wageType: string) => {
    const key = (wageType || '').trim().toUpperCase();
    switch (key) {
      case 'DAILY':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'WEEKLY':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'MONTHLY':
        return 'bg-violet-50 text-violet-700 border-violet-100';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filteredLabours = (labours || []).filter((l) => {
    const q = search.trim().toLowerCase();
    const searchMatch = !q || l.fullName?.toLowerCase().includes(q) || l.phone?.toLowerCase().includes(q);
    const typeMatch = !workTypeFilter || l.workType === workTypeFilter;
    const wageTypeMatch = !wageTypeFilter || l.wageType === wageTypeFilter;
    return searchMatch && typeMatch && wageTypeMatch;
  });
  const paginatedLabours = filteredLabours.slice((page - 1) * pageSize, page * pageSize);
  const workTypes = Array.from(new Set((labours || []).map((l) => l.workType).filter(Boolean)));
  const wageTypes = Array.from(new Set((labours || []).map((l) => l.wageType).filter(Boolean)));

  useEffect(() => {
    setPage(1);
  }, [search, workTypeFilter, wageTypeFilter]);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b flex justify-between items-center bg-slate-50/70">
          <div>
            <h2 className="font-bold text-xl text-slate-900 inline-flex items-center gap-2">
              <Users2 size={20} className="text-indigo-600" />
              {projectName}
            </h2>
            <p className="text-sm text-slate-500 mt-1">Onboarded labour list</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm border border-slate-100"
            aria-label="Close project labours modal"
          >
            ✕
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-2xl p-4 bg-indigo-600 text-white flex items-center justify-between">
              <div>
                <p className="text-xs/5 opacity-90">Total Labours</p>
                <p className="text-2xl font-extrabold mt-1">{labours.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/15">
                <Users2 size={22} className="text-white" />
              </div>
            </div>
            <div className="rounded-2xl p-4 bg-emerald-600 text-white flex items-center justify-between">
              <div>
                <p className="text-xs/5 opacity-90">Work Types</p>
                <p className="text-2xl font-extrabold mt-1">{workTypes.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/15">
                <Layers size={22} className="text-white" />
              </div>
            </div>
            <div className="rounded-2xl p-4 bg-slate-800 text-white flex items-center justify-between">
              <div>
                <p className="text-xs/5 opacity-90">Visible</p>
                <p className="text-2xl font-extrabold mt-1">{filteredLabours.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/15">
                <Eye size={22} className="text-white" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 max-w-full">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search labour name/phone"
              className="md:col-span-2 p-2.5 border rounded-lg"
            />
            <select value={workTypeFilter} onChange={(e) => setWorkTypeFilter(e.target.value)} className="p-2.5 border rounded-lg bg-white">
              <option value="">All Work Types</option>
              {workTypes.map((wt) => <option key={wt} value={wt}>{wt}</option>)}
            </select>
            <select value={wageTypeFilter} onChange={(e) => setWageTypeFilter(e.target.value)} className="p-2.5 border rounded-lg bg-white">
              <option value="">All Wage Types</option>
              {wageTypes.map((wt) => <option key={wt} value={wt}>{wt}</option>)}
            </select>
          </div>
          <div className="border rounded-xl overflow-hidden">
            <div className="max-h-[45vh] overflow-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Phone</th>
                  <th className="px-4 py-2 text-left">Work Type</th>
                  <th className="px-4 py-2 text-left">Wage Type</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLabours.map((l) => (
                  <tr key={l.id} className="border-t">
                    <td className="px-4 py-2 font-medium text-slate-800">{l.fullName}</td>
                    <td className="px-4 py-2 text-slate-600">{l.phone}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full border ${getWorkTypeBadgeClass(l.workType)}`}>
                        {l.workType}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full border ${getWageTypeBadgeClass(l.wageType)}`}>
                        {l.wageType}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredLabours.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No labours found.</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
          <TablePagination totalItems={filteredLabours.length} page={page} pageSize={pageSize} onPageChange={setPage} itemLabel="labours" />
        </div>
      </div>
    </div>
  );
}
