'use client';

type SectionLoaderProps = {
  label?: string;
  compact?: boolean;
};

export function SectionLoader({ label = 'Loading data...', compact = false }: SectionLoaderProps) {
  return (
    <div className={`w-full flex flex-col items-center justify-center ${compact ? 'py-6' : 'py-12'}`}>
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-indigo-500 animate-spin" />
        <div className="absolute inset-[10px] rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-100" />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}
