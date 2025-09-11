'use client';

import React from 'react';
import { useLiveFeedContext } from '@/contexts/live-feed-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function LiveFeedDemo() {
  const { liveData, loading, error, lastUpdated, refresh, isConnected, retryCount, isPolling, startPolling, stopPolling } = useLiveFeedContext();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Live Feed Data
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-gray-100 text-gray-800">
              <WifiOff className="mr-1 w-3 h-3" />
              Disabled
            </Badge>
            <div className="flex gap-2">
              <Button onClick={refresh} size="sm" variant="outline" disabled>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" disabled className="bg-gray-50 text-gray-500">
                Live Feed Disabled
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="py-8 text-center">
          <div className="flex justify-center items-center bg-gray-100 mx-auto mb-4 rounded-full w-16 h-16">
            <WifiOff className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="mb-2 font-medium text-gray-900 text-lg">Live Feed Disabled</h3>
          <p className="mb-4 text-gray-600">
            The live feed functionality has been disabled. No data will be fetched from the external API.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg text-left">
            <h4 className="mb-2 font-medium text-gray-800">What was disabled:</h4>
            <ul className="space-y-1 text-gray-600 text-sm">
              <li>• Automatic polling of live vehicle data</li>
              <li>• Real-time updates from external API</li>
              <li>• Live feed data display in vehicle cards</li>
              <li>• Connection status monitoring</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
