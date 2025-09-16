'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Gauge, Navigation, X, ExternalLink } from 'lucide-react';
import { EnhancedVehicleMap } from './enhanced-vehicle-map';
import { RealtimeVehicleData } from '@/hooks/use-optimized-realtime-vehicles';

interface VehicleMapPopupProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: {
    plate: string;
    latitude: string | null;
    longitude: string | null;
    speed: number | null;
    loctime: string;
    address: string | null;
    branch: string | null;
    drivername: string | null;
    head: string | null;
  };
}

export function VehicleMapPopup({ isOpen, onClose, vehicle }: VehicleMapPopupProps) {
  // Convert the vehicle prop to match RealtimeVehicleData interface
  const realtimeVehicle: RealtimeVehicleData = {
    plate: vehicle.plate,
    latitude: vehicle.latitude,
    longitude: vehicle.longitude,
    speed: vehicle.speed?.toString() || '0',
    loctime: vehicle.loctime,
    address: vehicle.address,
    branch: vehicle.branch,
    status: vehicle.speed && vehicle.speed > 0 ? 'Moving' : 'Stopped',
    nameevent: '',
    timestamp: new Date().toISOString()
  };

  if (!isOpen) return null;

  return (
    <EnhancedVehicleMap 
      vehicle={realtimeVehicle}
      onClose={onClose}
    />
  );
}
