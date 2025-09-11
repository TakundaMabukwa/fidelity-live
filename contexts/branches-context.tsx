'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { BranchDetail } from '@/lib/types';

interface BranchesContextType {
  branches: BranchDetail[];
  loading: boolean;
  loadBranches: () => void;
  isLoaded: boolean;
}

const BranchesContext = createContext<BranchesContextType | undefined>(undefined);

export function BranchesProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<BranchDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadBranches = async () => {
    if (isLoaded) return;
    
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockBranches: BranchDetail[] = [
      {
        id: '1',
        branch: 'Aliwal North',
        branchCode: '567',
        footprint: 'Eastern Cape',
        physicalAddress: '16 Grey Street, Aliwal North, 9750',
        gpsCoordinates: '-30.6901, 26.7067'
      },
      {
        id: '2',
        branch: 'Bethlehem',
        branchCode: '968',
        footprint: 'Freestate',
        physicalAddress: 'CNR Lindley & Pretorius Street, Bethlehem, 9701',
        gpsCoordinates: '-28.2279, 28.3091'
      },
      {
        id: '3',
        branch: 'Bloemfontein',
        branchCode: '871',
        footprint: 'Freestate',
        physicalAddress: '60 Fitte Stockenstroom Str., New East End, Bloemfontein, 9300',
        gpsCoordinates: '-29.1315, 26.2541'
      },
      {
        id: '4',
        branch: 'Burgersfort',
        branchCode: '615',
        footprint: 'Limpopo',
        physicalAddress: 'No 1 Station Street, Portion 12, Building No 1, Burgersfort, 1150',
        gpsCoordinates: '-24.6795, 30.3336'
      }
    ];
    
    setBranches(mockBranches);
    setLoading(false);
    setIsLoaded(true);
  };

  return (
    <BranchesContext.Provider value={{ branches, loading, loadBranches, isLoaded }}>
      {children}
    </BranchesContext.Provider>
  );
}

export function useBranches() {
  const context = useContext(BranchesContext);
  if (context === undefined) {
    throw new Error('useBranches must be used within a BranchesProvider');
  }
  return context;
}