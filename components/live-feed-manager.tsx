'use client';

import React, { useEffect } from 'react';
import { useLiveFeedContext } from '@/contexts/live-feed-context';
import { useVehicles } from '@/contexts/vehicles-context';

interface LiveFeedManagerProps {
  children: React.ReactNode;
}

export function LiveFeedManager({ children }: LiveFeedManagerProps) {
  const { stopPolling, isPolling } = useLiveFeedContext();

  // Ensure polling is stopped when component mounts
  useEffect(() => {
    if (isPolling) {
      console.log('Live feed is disabled - stopping any active polling...');
      stopPolling();
    }
  }, [isPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return <>{children}</>;
}
