'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Branch } from '@/lib/types';

interface AppContextType {
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>({
    id: '1',
    name: 'Randburg',
    location: 'Randburg, Gauteng',
    manager: 'N/A',
    contact: '63 Aimee Street, Rand...',
    status: 'active'
  });
  const [activeTab, setActiveTab] = useState('routing-dashboard');

  return (
    <AppContext.Provider value={{
      selectedBranch,
      setSelectedBranch,
      activeTab,
      setActiveTab
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}