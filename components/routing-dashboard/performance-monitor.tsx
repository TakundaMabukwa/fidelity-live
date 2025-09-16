'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Database, Wifi } from 'lucide-react';
import { backgroundDataService } from '@/lib/services/background-data-service';

export function PerformanceMonitor() {
  const [status, setStatus] = useState<any>(null);
  const [performance, setPerformance] = useState({
    renderCount: 0,
    lastRender: Date.now(),
    avgRenderTime: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const serviceStatus = backgroundDataService.getStatus();
      setStatus(serviceStatus);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Track render performance (only on mount)
  useEffect(() => {
    const now = Date.now();
    setPerformance(prev => ({
      renderCount: prev.renderCount + 1,
      lastRender: now,
      avgRenderTime: prev.avgRenderTime
    }));
  }, []);

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Performance Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-center">
            Loading performance data...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Performance Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Service Status */}
        <div className="gap-4 grid grid-cols-2">
          <div className="flex justify-between items-center">
            <span className="font-medium text-sm">Service Status</span>
            <Badge variant={status.isRunning ? 'default' : 'destructive'}>
              {status.isRunning ? 'Running' : 'Stopped'}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium text-sm">Data Count</span>
            <span className="font-mono text-sm">{status.dataCount}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium text-sm">Active Listeners</span>
            <span className="font-mono text-sm">{status.listenerCount}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium text-sm">Retry Count</span>
            <span className="font-mono text-sm">{status.retryCount}</span>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="pt-4 border-t">
          <h4 className="flex items-center gap-2 mb-3 font-medium">
            <Zap className="w-4 h-4" />
            Performance Metrics
          </h4>
          
          <div className="gap-4 grid grid-cols-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">Render Count</span>
              <span className="font-mono text-sm">{performance.renderCount}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">Avg Render Time</span>
              <span className="font-mono text-sm">{performance.avgRenderTime.toFixed(1)}ms</span>
            </div>
          </div>
        </div>

        {/* Optimization Benefits */}
        <div className="pt-4 border-t">
          <h4 className="flex items-center gap-2 mb-3 font-medium">
            <Database className="w-4 h-4" />
            Optimization Benefits
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="bg-green-500 rounded-full w-2 h-2"></div>
              <span>Background data fetching (non-blocking)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-green-500 rounded-full w-2 h-2"></div>
              <span>10-second API response caching</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-green-500 rounded-full w-2 h-2"></div>
              <span>Throttled requests (5s minimum interval)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-green-500 rounded-full w-2 h-2"></div>
              <span>Smart re-render prevention</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-green-500 rounded-full w-2 h-2"></div>
              <span>Automatic retry with exponential backoff</span>
            </div>
          </div>
        </div>

        {/* Last Update */}
        {status.lastFetchTime > 0 && (
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">Last Data Fetch</span>
              <span className="font-mono text-sm">
                {new Date(status.lastFetchTime).toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
