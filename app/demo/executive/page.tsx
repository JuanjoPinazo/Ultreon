'use client';

import React from 'react';
import Link from 'next/link';
import { useDemoData } from '@/lib/demo/DemoDataProvider';
import ExecutiveDashboardClient from '@/app/executive/ExecutiveDashboardClient';

export default function DemoExecutivePage() {
  const { data } = useDemoData();

  if (!data) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono">Loading demo data...</div>;
  }

  const executiveData = data.executive;

  return (
    <div className="relative">
      {/* Back button to Admin */}
      <div className="fixed top-4 left-4 z-50">
        <Link href="/admin/demo-center" className="bg-card/80 backdrop-blur border border-border dark:border-slate-700 text-muted-foreground hover:text-white px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider shadow-lg flex items-center gap-2">
          ← Volver a Admin
        </Link>
      </div>

      {/* Demo watermark */}
      <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
        <span className="bg-amber-500 text-black text-[10px] font-bold font-mono px-2 py-1 rounded uppercase tracking-widest shadow-lg">
          Demo Mode
        </span>
      </div>
      
      <ExecutiveDashboardClient 
        cases={executiveData.cases as any}
        hospitals={executiveData.hospitals}
        investigators={executiveData.investigators}
        profileName="Dr. Demo User"
      />
    </div>
  );
}
