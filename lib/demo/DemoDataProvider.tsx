'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { clinicalDemoCase } from '@/data/demo/clinical-demo-case';
import { executiveDemoData } from '@/data/demo/executive-demo-data';
import { congressDemoFlow } from '@/data/demo/congress-demo-flow';

export type DemoData = {
  clinical: typeof clinicalDemoCase;
  executive: typeof executiveDemoData;
  congress: typeof congressDemoFlow;
};

interface DemoContextValue {
  isDemoMode: boolean;
  data: DemoData | null;
}

const DemoContext = createContext<DemoContextValue>({
  isDemoMode: true,
  data: null,
});

export function DemoDataProvider({ children }: { children: React.ReactNode }) {
  const [data] = useState<DemoData>({
    clinical: clinicalDemoCase,
    executive: executiveDemoData,
    congress: congressDemoFlow
  });

  return (
    <DemoContext.Provider value={{ isDemoMode: true, data }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoData() {
  return useContext(DemoContext);
}
