'use client';

import React, { useState } from 'react';
import { ChevronDown, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useApp } from '@/contexts/app-context';
import { useBranches } from '@/contexts/branches-context';

export function BranchSelector() {
  const { selectedBranch, setSelectedBranch } = useApp();
  const { branches, loadBranches } = useBranches();
  const [isOpen, setIsOpen] = useState(false);

  React.useEffect(() => {
    if (isOpen && !branches.length) {
      loadBranches();
    }
  }, [isOpen, branches.length, loadBranches]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="justify-between gap-2 hover:bg-gray-50 w-full text-gray-700">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="truncate">{selectedBranch?.name || 'Select Branch'}</span>
          </div>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {branches.map((branch) => (
          <DropdownMenuItem
            key={branch.id}
            onClick={() => setSelectedBranch(branch)}
            className="flex flex-col items-start"
          >
            <span className="font-medium">{branch.name}</span>
            <span className="text-gray-500 text-sm">{branch.location}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}