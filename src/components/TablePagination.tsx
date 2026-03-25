'use client';

type TablePaginationProps = {
  totalItems: number;
  page: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
};

export function TablePagination({
  totalItems,
  page,
  pageSize = 10,
  onPageChange,
  itemLabel = 'records',
}: TablePaginationProps) {
  if (totalItems <= pageSize) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3">
      <p className="text-sm text-slate-500">
        Showing {start} - {end} of {totalItems} {itemLabel}
      </p>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="px-3 py-1.5 border rounded-lg disabled:opacity-50"
        >
          Prev
        </button>
        <span className="px-3 py-1.5 text-sm text-slate-600">
          Page {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className="px-3 py-1.5 border rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
