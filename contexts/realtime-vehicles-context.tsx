'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useRealtimeVehicles, RealtimeVehicleData, ConnectionStatus } from '@/hooks/use-realtime-vehicles';

interface RealtimeVehiclesContextType {
  vehicles: RealtimeVehicleData[];
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  reconnect: () => void;
  clearError: () => void;
  // Helper functions
  getVehicleByPlate: (plate: string) => RealtimeVehicleData | undefined;
  getVehiclesByBranch: (branch: string) => RealtimeVehicleData[];
  getActiveVehicles: () => RealtimeVehicleData[];
  getStationaryVehicles: () => RealtimeVehicleData[];
  getVehiclesWithLocation: () => RealtimeVehicleData[];
}

const RealtimeVehiclesContext = createContext<RealtimeVehiclesContextType | undefined>(undefined);

interface RealtimeVehiclesProviderProps {
  children: ReactNode;
}

export function RealtimeVehiclesProvider({ children }: RealtimeVehiclesProviderProps) {
  const {
    vehicles,
    connectionStatus,
    isConnected,
    reconnect,
    clearError
  } = useRealtimeVehicles();

  // Helper function to get vehicle by plate number
  const getVehicleByPlate = (plate: string): RealtimeVehicleData | undefined => {
    return vehicles.find(vehicle => 
      vehicle.plate?.toLowerCase() === plate.toLowerCase()
    );
  };

  // Helper function to get vehicles by branch
  const getVehiclesByBranch = (branch: string): RealtimeVehicleData[] => {
    return vehicles.filter(vehicle => 
      vehicle.branch?.toLowerCase().includes(branch.toLowerCase())
    );
  };

  // Helper function to get active/moving vehicles
  const getActiveVehicles = (): RealtimeVehicleData[] => {
    return vehicles.filter(vehicle => 
      vehicle.speed && vehicle.speed > 0
    );
  };

  // Helper function to get stationary vehicles
  const getStationaryVehicles = (): RealtimeVehicleData[] => {
    return vehicles.filter(vehicle => 
      !vehicle.speed || vehicle.speed === 0
    );
  };

  // Helper function to get vehicles with valid location data
  const getVehiclesWithLocation = (): RealtimeVehicleData[] => {
    return vehicles.filter(vehicle => 
      vehicle.latitude && vehicle.longitude &&
      vehicle.latitude !== '0' && vehicle.longitude !== '0'
    );
  };

  const value: RealtimeVehiclesContextType = {
    vehicles,
    connectionStatus,
    isConnected,
    reconnect,
    clearError,
    getVehicleByPlate,
    getVehiclesByBranch,
    getActiveVehicles,
    getStationaryVehicles,
    getVehiclesWithLocation
  };

  return (
    <RealtimeVehiclesContext.Provider value={value}>
      {children}
    </RealtimeVehiclesContext.Provider>
  );
}

export function useRealtimeVehiclesContext() {
  const context = useContext(RealtimeVehiclesContext);
  if (context === undefined) {
    throw new Error('useRealtimeVehiclesContext must be used within a RealtimeVehiclesProvider');
  }
  return context;
}

