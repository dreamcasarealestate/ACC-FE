'use client';

import { AlertTriangle } from 'lucide-react';

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl overflow-hidden border border-slate-200 bg-white text-slate-900 shadow-[0_24px_70px_rgba(2,6,23,0.45)]">
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-red-500 to-orange-400" />
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 flex items-center justify-center shadow-sm">
              <AlertTriangle size={30} />
            </div>
            <h3 className="mt-5 text-2xl font-extrabold tracking-tight">{title}</h3>
            <p className="text-sm text-slate-600 mt-2 max-w-[320px] leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="px-6 pb-6 flex justify-center gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl border border-slate-300 bg-gradient-to-b from-white to-slate-50 text-slate-700 hover:from-slate-50 hover:to-slate-100 transition-all font-semibold shadow-sm hover:shadow"
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white hover:from-rose-500 hover:to-red-500 transition-all shadow-lg shadow-rose-600/25 font-bold disabled:opacity-70"
            disabled={loading}
          >
            {loading ? 'Please wait...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
