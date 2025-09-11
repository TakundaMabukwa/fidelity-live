'use client';

import React from 'react';
import { LiveFeedDemo } from '@/components/live-feed-demo';
import { LiveFeedProvider } from '@/contexts/live-feed-context';

export default function LiveFeedTestPage() {
  return (
    <LiveFeedProvider>
      <div className="space-y-6">
        <div>
          <h1 className="font-bold text-gray-900 text-3xl">Live Feed Test</h1>
          <p className="text-gray-600">Testing live feed integration with vehicle data</p>
        </div>
        
        <LiveFeedDemo />
        
        <div className="bg-red-50 p-4 border border-red-200 rounded-lg">
          <h3 className="mb-2 font-medium text-red-800">Live Feed Status: DISABLED</h3>
          <ul className="space-y-1 text-red-700 text-sm">
            <li>• Live feed functionality has been disabled</li>
            <li>• No data will be fetched from: <code className="bg-red-100 px-1 rounded">http://64.227.138.235:8003/latest</code></li>
            <li>• Automatic polling and real-time updates are turned off</li>
            <li>• Vehicle cards will not display live feed data</li>
            <li>• To re-enable, set <code className="bg-red-100 px-1 rounded">LIVE_FEED_ENABLED = true</code> in the hook</li>
          </ul>
        </div>
      </div>
    </LiveFeedProvider>
  );
}
