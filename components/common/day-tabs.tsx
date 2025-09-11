'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface DayTabsProps {
  selectedDay: string;
  onDayChange: (day: string) => void;
}

const days = [
  { key: 'Monday', label: 'Monday', short: 'Mon' },
  { key: 'Tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'Wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'Thursday', label: 'Thursday', short: 'Thu' },
  { key: 'Friday', label: 'Friday', short: 'Fri' },
  { key: 'Saturday', label: 'Saturday', short: 'Sat' },
  { key: 'Sunday', label: 'Sunday', short: 'Sun' },
];

export function DayTabs({ selectedDay, onDayChange }: DayTabsProps) {
  return (
    <div className="border-gray-200 border-b">
      <nav className="flex space-x-8 -mb-px" aria-label="Tabs">
        {days.map((day) => (
          <button
            key={day.key}
            onClick={() => onDayChange(day.key)}
            className={cn(
              'px-1 py-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors',
              selectedDay === day.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <span className="hidden sm:inline">{day.label}</span>
            <span className="sm:hidden">{day.short}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}



