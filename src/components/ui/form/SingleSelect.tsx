'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { createPortal } from 'react-dom';

export type SelectOption = { label: string; value: string; disabled?: boolean };

type DropdownPlacement = 'auto' | 'top' | 'bottom';

type SingleSelectProps = {
  value?: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  leftIcon?: React.ReactNode;
  placement?: DropdownPlacement;
  searchable?: boolean;
  searchPlaceholder?: string;
  noResultsText?: string;
};

export function SingleSelect({
  value,
  onChange,
  options,
  placeholder = 'Select',
  disabled,
  error,
  leftIcon,
  placement = 'auto',
  searchable = false,
  searchPlaceholder = 'Search...',
  noResultsText = 'No results',
}: SingleSelectProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [autoDir, setAutoDir] = useState<'top' | 'bottom'>('bottom');
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [query, setQuery] = useState('');
  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);
  const dir: 'top' | 'bottom' = placement === 'auto' ? autoDir : placement;

  const filteredOptions = useMemo(() => {
    if (!searchable) return options;
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  const updateMenuPosition = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const gap = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    let calculatedDir: 'top' | 'bottom' = 'bottom';

    if (placement === 'auto') {
      calculatedDir = spaceBelow < 280 && spaceAbove > spaceBelow ? 'top' : 'bottom';
    } else {
      calculatedDir = placement;
    }

    const top = calculatedDir === 'top' ? rect.top - gap : rect.bottom + gap;
    const maxHeight =
      calculatedDir === 'top'
        ? Math.min(rect.top - gap, 420)
        : Math.min(window.innerHeight - rect.bottom - gap, 420);

    setMenuPos({
      top,
      left: rect.left,
      width: rect.width,
      maxHeight,
    });

    if (placement === 'auto') setAutoDir(calculatedDir);
  };

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    updateMenuPosition();
  }, [open, value, options.length, placement]);

  useEffect(() => {
    if (!open) return;
    const onReflow = () => updateMenuPosition();
    window.addEventListener('resize', onReflow);
    window.addEventListener('scroll', onReflow, true);
    return () => {
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('scroll', onReflow, true);
    };
  }, [open, placement]);

  useEffect(() => {
    if (!open) {
      setActiveIndex(-1);
      setQuery('');
      return;
    }
    const idx = filteredOptions.findIndex((o) => o.value === value && !o.disabled);
    setActiveIndex(idx >= 0 ? idx : firstEnabledIndex(filteredOptions));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      if (!open) {
        e.preventDefault();
        setOpen(true);
        return;
      }
      e.preventDefault();
      const opt = filteredOptions[activeIndex];
      if (opt && !opt.disabled) {
        onChange(opt.value);
        setOpen(false);
      }
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => nextEnabledIndex(filteredOptions, prev, +1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => nextEnabledIndex(filteredOptions, prev, -1));
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((s) => !s)}
        onKeyDown={onKeyDown}
        className={`w-full rounded-xl border px-3 py-3 text-left transition ${
          error ? 'border-rose-300' : 'border-slate-200'
        } ${disabled ? 'bg-slate-100 text-slate-400' : 'bg-white hover:border-slate-300'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {leftIcon}
            <span className={`text-sm truncate ${selected ? 'text-slate-800' : 'text-slate-500'}`}>
              {selected?.label ?? placeholder}
            </span>
          </div>
          <ChevronDown size={18} className={`text-slate-500 transition ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {mounted &&
        open &&
        menuPos &&
        createPortal(
          <>
            <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setOpen(false)} />
            <div
              className="fixed rounded-xl border border-slate-200 bg-white shadow-2xl"
              style={{
                zIndex: 9999,
                top: dir === 'top' ? 'auto' : `${menuPos.top}px`,
                bottom: dir === 'top' ? `${window.innerHeight - menuPos.top}px` : 'auto',
                left: `${menuPos.left}px`,
                width: `${menuPos.width}px`,
                maxHeight: `${menuPos.maxHeight}px`,
              }}
              role="listbox"
              onClick={(e) => e.stopPropagation()}
            >
              {searchable && (
                <div className="border-b border-slate-200 p-2">
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                    <Search size={16} className="text-slate-500" />
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={searchPlaceholder}
                      className="w-full bg-transparent text-sm outline-none text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              )}
              <div className="overflow-y-auto p-1" style={{ maxHeight: `${menuPos.maxHeight - (searchable ? 60 : 0)}px` }}>
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-slate-400">{noResultsText}</div>
                ) : (
                  filteredOptions.map((opt, idx) => {
                    const isSelected = opt.value === value;
                    const isActive = idx === activeIndex;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={opt.disabled}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => {
                          if (opt.disabled) return;
                          onChange(opt.value);
                          setOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                          isSelected ? 'bg-indigo-50 text-indigo-700' : isActive ? 'bg-slate-100 text-slate-800' : 'text-slate-700 hover:bg-slate-50'
                        } ${opt.disabled ? 'pointer-events-none opacity-50' : ''}`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span className="truncate">{opt.label}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

function firstEnabledIndex(opts: SelectOption[]) {
  return opts.findIndex((o) => !o.disabled);
}

function nextEnabledIndex(opts: SelectOption[], current: number, step: 1 | -1) {
  if (opts.length === 0) return -1;
  let i = current;
  for (let tries = 0; tries < opts.length; tries++) {
    i = i + step;
    if (i >= opts.length) i = 0;
    if (i < 0) i = opts.length - 1;
    if (!opts[i]?.disabled) return i;
  }
  return current;
}
