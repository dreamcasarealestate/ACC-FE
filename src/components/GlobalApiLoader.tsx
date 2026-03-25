'use client';

import { useEffect, useState } from 'react';
import { subscribeApiLoader } from '@/lib/apiLoader';

export function GlobalApiLoader() {
  const [activeRequests, setActiveRequests] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeApiLoader((count) => {
      setActiveRequests(count);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (activeRequests > 0) {
      setVisible(true);
      return;
    }

    const timeout = setTimeout(() => {
      setVisible(false);
    }, 250);

    return () => clearTimeout(timeout);
  }, [activeRequests]);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-[100] transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden
    >
      <div className="h-1.5 w-full bg-slate-200/50">
        <div className="api-loader-bar h-full w-1/3 rounded-r-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 shadow-[0_0_20px_rgba(59,130,246,0.7)]" />
      </div>
    </div>
  );
}
