'use client';

import React from 'react';
import { 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOptimizedRealtimeVehicles } from '@/hooks/use-optimized-realtime-vehicles';
import { CONNECTION_STATUS } from '@/lib/config/realtime';

interface ConnectionStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function ConnectionStatusIndicator({ 
  className = '', 
  showDetails = true 
}: ConnectionStatusIndicatorProps) {
  const { connectionStatus, refresh, clearError, isConnected } = useOptimizedRealtimeVehicles();

  const getStatusInfo = () => {
    switch (connectionStatus.status) {
      case CONNECTION_STATUS.CONNECTED:
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          text: 'Connected',
          description: 'Real-time data streaming'
        };
      case CONNECTION_STATUS.CONNECTING:
        return {
          icon: RefreshCw,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          text: 'Connecting',
          description: 'Establishing connection...'
        };
      case CONNECTION_STATUS.DISCONNECTED:
        return {
          icon: WifiOff,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          text: 'Disconnected',
          description: 'No connection to tracking server'
        };
      case CONNECTION_STATUS.ERROR:
        const isUsingFallback = connectionStatus.error?.includes('HTTP fallback');
        return {
          icon: isUsingFallback ? RefreshCw : XCircle,
          color: isUsingFallback ? 'text-orange-500' : 'text-red-500',
          bgColor: isUsingFallback ? 'bg-orange-50' : 'bg-red-50',
          borderColor: isUsingFallback ? 'border-orange-200' : 'border-red-200',
          text: isUsingFallback ? 'Fallback Mode' : 'Error',
          description: connectionStatus.error || 'Connection error'
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          text: 'Unknown',
          description: 'Unknown connection status'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const formatLastUpdate = () => {
    if (!connectionStatus.lastUpdate) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - connectionStatus.lastUpdate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  };

  if (!showDetails) {
    // Compact version - just a badge
    return (
      <Badge 
        variant={isConnected ? 'default' : 'secondary'}
        className={`${className} ${statusInfo.color} ${statusInfo.bgColor} ${statusInfo.borderColor}`}
      >
        <StatusIcon className={`w-3 h-3 mr-1 ${connectionStatus.status === CONNECTION_STATUS.CONNECTING ? 'animate-spin' : ''}`} />
        {statusInfo.text}
      </Badge>
    );
  }

  return (
    <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-4 ${className}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <StatusIcon 
            className={`w-5 h-5 ${statusInfo.color} ${connectionStatus.status === CONNECTION_STATUS.CONNECTING ? 'animate-spin' : ''}`} 
          />
          <div>
            <div className="font-medium text-gray-900">
              {statusInfo.text}
            </div>
            <div className="text-gray-600 text-sm">
              {statusInfo.description}
            </div>
            {connectionStatus.lastUpdate && (
              <div className="mt-1 text-gray-500 text-xs">
                Last update: {formatLastUpdate()}
              </div>
            )}
            {connectionStatus.reconnectAttempts > 0 && (
              <div className="mt-1 text-orange-600 text-xs">
                Reconnect attempts: {connectionStatus.reconnectAttempts}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {connectionStatus.status === CONNECTION_STATUS.ERROR && (
            <Button
              size="sm"
              variant="outline"
              onClick={clearError}
              className="hover:bg-red-50 border-red-200 text-red-600"
            >
              Clear Error
            </Button>
          )}
          
          {!isConnected && (
            <Button
              size="sm"
              variant="outline"
              onClick={refresh}
              disabled={connectionStatus.status === CONNECTION_STATUS.CONNECTING}
              className="hover:bg-blue-50 border-blue-200 text-blue-600"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${connectionStatus.status === CONNECTION_STATUS.CONNECTING ? 'animate-spin' : ''}`} />
              Reconnect
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact version for headers/toolbars
export function ConnectionStatusBadge({ className = '' }: { className?: string }) {
  return <ConnectionStatusIndicator className={className} showDetails={false} />;
}
