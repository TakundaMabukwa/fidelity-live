'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, Clock, Users, Route, ArrowRight, TurnLeft, TurnRight, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import { getVehicleAssignedCustomersWithCoordinates } from '@/lib/actions/route-assignments';
import { RealtimeVehicleData } from '@/hooks/use-optimized-realtime-vehicles';

// Import Mapbox GL JS
import mapboxgl from 'mapbox-gl';

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface AssignedCustomer {
  id: number;
  customerName: string;
  customerCode: string;
  sequenceOrder: number;
  status: string;
  estimatedArrivalTime: string | null;
  estimatedDurationMinutes: number | null;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  direction: string | null;
  avgSeconds: number | null;
  avgMinutes: number | null;
}

interface EnhancedVehicleMapProps {
  vehicle: RealtimeVehicleData;
  onClose: () => void;
}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper function to calculate ETA based on distance and speed
function calculateETA(distanceKm: number, speedKmh: number): string {
  if (speedKmh <= 0) return 'N/A';
  const timeHours = distanceKm / speedKmh;
  const timeMinutes = Math.round(timeHours * 60);
  
  if (timeMinutes < 60) {
    return `${timeMinutes} min`;
  } else {
    const hours = Math.floor(timeMinutes / 60);
    const minutes = timeMinutes % 60;
    return `${hours}h ${minutes}m`;
  }
}

// Helper function to calculate bearing between two points
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
}

// Helper function to get direction icon based on bearing
function getDirectionIcon(bearing: number): React.ReactNode {
  if (bearing >= 337.5 || bearing < 22.5) return <ArrowUp className="w-4 h-4" />;
  if (bearing >= 22.5 && bearing < 67.5) return <ArrowUp className="w-4 h-4 rotate-45" />;
  if (bearing >= 67.5 && bearing < 112.5) return <ArrowRight className="w-4 h-4" />;
  if (bearing >= 112.5 && bearing < 157.5) return <ArrowDown className="w-4 h-4 rotate-45" />;
  if (bearing >= 157.5 && bearing < 202.5) return <ArrowDown className="w-4 h-4" />;
  if (bearing >= 202.5 && bearing < 247.5) return <ArrowDown className="w-4 h-4 -rotate-45" />;
  if (bearing >= 247.5 && bearing < 292.5) return <ArrowRight className="w-4 h-4 rotate-180" />;
  if (bearing >= 292.5 && bearing < 337.5) return <ArrowUp className="w-4 h-4 -rotate-45" />;
  return <ArrowUp className="w-4 h-4" />;
}

// Helper function to get direction text
function getDirectionText(bearing: number): string {
  if (bearing >= 337.5 || bearing < 22.5) return 'North';
  if (bearing >= 22.5 && bearing < 67.5) return 'Northeast';
  if (bearing >= 67.5 && bearing < 112.5) return 'East';
  if (bearing >= 112.5 && bearing < 157.5) return 'Southeast';
  if (bearing >= 157.5 && bearing < 202.5) return 'South';
  if (bearing >= 202.5 && bearing < 247.5) return 'Southwest';
  if (bearing >= 247.5 && bearing < 292.5) return 'West';
  if (bearing >= 292.5 && bearing < 337.5) return 'Northwest';
  return 'North';
}

export function EnhancedVehicleMap({ vehicle, onClose }: EnhancedVehicleMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [assignedCustomers, setAssignedCustomers] = useState<AssignedCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate closest customer and distances
  const { closestCustomer, customerDistances } = useMemo(() => {
    if (!assignedCustomers.length || !vehicle.latitude || !vehicle.longitude) {
      return { closestCustomer: null, customerDistances: [] };
    }

    const vehicleLat = parseFloat(vehicle.latitude);
    const vehicleLon = parseFloat(vehicle.longitude);

    const distances = assignedCustomers.map(customer => {
      const distance = calculateDistance(
        vehicleLat,
        vehicleLon,
        customer.coordinates.latitude,
        customer.coordinates.longitude
      );
      return {
        customer,
        distance,
        eta: calculateETA(distance, parseFloat(vehicle.speed || '0'))
      };
    });

    // Sort by distance to find closest
    distances.sort((a, b) => a.distance - b.distance);
    const closest = distances[0];

    return {
      closestCustomer: closest,
      customerDistances: distances
    };
  }, [assignedCustomers, vehicle.latitude, vehicle.longitude, vehicle.speed]);

  // Calculate next stop only (GPS-style)
  const nextStop = useMemo(() => {
    if (!assignedCustomers.length || !vehicle.latitude || !vehicle.longitude) {
      return null;
    }

    const vehicleLat = parseFloat(vehicle.latitude);
    const vehicleLon = parseFloat(vehicle.longitude);
    
    // Sort customers by sequence order and find the next one
    const sortedCustomers = [...assignedCustomers].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    
    // Find the closest customer (next stop)
    let nextCustomer = null;
    let minDistance = Infinity;
    
    sortedCustomers.forEach((customer) => {
      const distance = calculateDistance(
        vehicleLat,
        vehicleLon,
        customer.coordinates.latitude,
        customer.coordinates.longitude
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nextCustomer = customer;
      }
    });

    if (!nextCustomer) return null;

    const distance = minDistance;
    const bearing = calculateBearing(
      vehicleLat,
      vehicleLon,
      nextCustomer.coordinates.latitude,
      nextCustomer.coordinates.longitude
    );
    const eta = calculateETA(distance, parseFloat(vehicle.speed || '0'));
    
    return {
      type: 'next_stop',
      title: `Go to ${nextCustomer.customerName}`,
      description: `${nextCustomer.customerCode} - Stop ${nextCustomer.sequenceOrder}`,
      distance: distance,
      eta: eta,
      coordinates: [nextCustomer.coordinates.longitude, nextCustomer.coordinates.latitude],
      bearing: bearing,
      icon: <MapPin className="w-5 h-5 text-green-600" />,
      customer: nextCustomer
    };
  }, [assignedCustomers, vehicle.latitude, vehicle.longitude, vehicle.speed]);

  // Load assigned customers
  useEffect(() => {
    const loadAssignedCustomers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await getVehicleAssignedCustomersWithCoordinates(vehicle.plate);
        
        if (result.success && result.data) {
          setAssignedCustomers(result.data.assigned_route_customers || []);
        } else {
          setAssignedCustomers([]);
        }
      } catch (err) {
        console.error('Error loading assigned customers:', err);
        setError('Failed to load assigned customers');
        setAssignedCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    loadAssignedCustomers();
  }, [vehicle.plate]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !vehicle.latitude || !vehicle.longitude) return;

    const vehicleLat = parseFloat(vehicle.latitude);
    const vehicleLon = parseFloat(vehicle.longitude);

    if (map.current) {
      // Update existing map
      map.current.setCenter([vehicleLon, vehicleLat]);
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [vehicleLon, vehicleLat],
      zoom: 12,
    });

    map.current.on('load', () => {
      setLoaded(true);
      
      // Add vehicle marker
      const vehicleMarker = new mapboxgl.Marker({ color: '#3b82f6' })
        .setLngLat([vehicleLon, vehicleLat])
        .setPopup(
          new mapboxgl.Popup().setHTML(`
            <div class="p-2">
              <h3 class="font-semibold text-blue-600">${vehicle.plate}</h3>
              <p class="text-gray-600 text-sm">Speed: ${vehicle.speed} km/h</p>
              <p class="text-gray-600 text-sm">Status: ${vehicle.status || 'Active'}</p>
            </div>
          `)
        )
        .addTo(map.current!);

      // Add customer markers and route path when data is loaded
      if (assignedCustomers.length > 0) {
        // Sort customers by sequence order for proper route visualization
        const sortedCustomers = [...assignedCustomers].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
        
        // Create route coordinates array
        const routeCoordinates: [number, number][] = [];
        
        // Add vehicle position as starting point
        routeCoordinates.push([vehicleLon, vehicleLat]);
        
        // Add customer coordinates in sequence order
        sortedCustomers.forEach(customer => {
          routeCoordinates.push([customer.coordinates.longitude, customer.coordinates.latitude]);
        });
        
        // Add vehicle position as ending point (return to start)
        routeCoordinates.push([vehicleLon, vehicleLat]);

        // Add route path to map
        if (routeCoordinates.length > 2) {
          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: routeCoordinates
              }
            }
          });

          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 4,
              'line-opacity': 0.8
            }
          });

          // Add arrow markers along the route
          map.current.addLayer({
            id: 'route-arrows',
            type: 'symbol',
            source: 'route',
            layout: {
              'symbol-placement': 'line',
              'symbol-spacing': 50,
              'icon-image': 'arrow',
              'icon-size': 0.8,
              'icon-rotate': 0,
              'icon-rotation-alignment': 'map',
              'icon-allow-overlap': true,
              'icon-ignore-placement': true
            }
          });
        }

        // Add customer markers
        sortedCustomers.forEach((customer, index) => {
          const isClosest = closestCustomer?.customer.id === customer.id;
          const color = isClosest ? '#ef4444' : '#10b981'; // Red for closest, green for others
          const size = isClosest ? 1.2 : 0.8;

          const customerMarker = new mapboxgl.Marker({ 
            color,
            scale: size
          })
            .setLngLat([customer.coordinates.longitude, customer.coordinates.latitude])
            .setPopup(
              new mapboxgl.Popup().setHTML(`
                <div class="p-2">
                  <h3 class="font-semibold ${isClosest ? 'text-red-600' : 'text-green-600'}">
                    ${customer.customerName}
                  </h3>
                  <p class="text-gray-600 text-sm">Code: ${customer.customerCode}</p>
                  <p class="text-gray-600 text-sm">Sequence: ${customer.sequenceOrder}</p>
                  ${isClosest ? `<p class="font-medium text-red-600 text-sm">CLOSEST CUSTOMER</p>` : ''}
                </div>
              `)
            )
            .addTo(map.current!);
        });

        // Fit map to show all markers and route
        const bounds = new mapboxgl.LngLatBounds();
        
        // Add vehicle to bounds
        bounds.extend([vehicleLon, vehicleLat]);
        
        // Add all customers to bounds
        sortedCustomers.forEach(customer => {
          bounds.extend([customer.coordinates.longitude, customer.coordinates.latitude]);
        });
        
        map.current.fitBounds(bounds, { padding: 50 });
      }
    });

    return () => {
      if (map.current) {
        // Clean up route layers
        if (map.current.getLayer('route')) {
          map.current.removeLayer('route');
        }
        if (map.current.getLayer('route-arrows')) {
          map.current.removeLayer('route-arrows');
        }
        if (map.current.getSource('route')) {
          map.current.removeSource('route');
        }
        map.current.remove();
        map.current = null;
      }
    };
  }, [vehicle.latitude, vehicle.longitude, vehicle.plate, vehicle.speed, assignedCustomers, closestCustomer]);

  const formatAddress = () => {
    return vehicle.address || 'Address not available';
  };

  const formatCoordinates = () => {
    if (!vehicle.latitude || !vehicle.longitude) return 'Coordinates not available';
    return `${parseFloat(vehicle.latitude).toFixed(6)}, ${parseFloat(vehicle.longitude).toFixed(6)}`;
  };

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 p-4">
      <Card className="flex flex-col w-full max-w-7xl max-h-[95vh] overflow-hidden">
        <CardHeader className="flex flex-row flex-shrink-0 justify-between items-center space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 font-semibold text-xl">
              <MapPin className="w-5 h-5 text-blue-600" />
              Vehicle Location & Route
            </CardTitle>
            <p className="text-gray-600 text-sm">
              {vehicle.plate} - {formatAddress()}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </CardHeader>

        <CardContent className="flex-1 space-y-4 overflow-y-auto">
          {/* Vehicle Info */}
          <div className="gap-4 grid grid-cols-1 md:grid-cols-3">
            <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg">
              <Navigation className="w-4 h-4 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900 text-sm">Speed</p>
                <p className="font-bold text-blue-600 text-lg">{vehicle.speed} km/h</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-green-50 p-3 rounded-lg">
              <Users className="w-4 h-4 text-green-600" />
              <div>
                <p className="font-medium text-green-900 text-sm">Assigned Customers</p>
                <p className="font-bold text-green-600 text-lg">
                  {loading ? '...' : assignedCustomers.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-orange-50 p-3 rounded-lg">
              <Route className="w-4 h-4 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900 text-sm">Status</p>
                <p className="font-bold text-orange-600 text-lg">{vehicle.status || 'Active'}</p>
              </div>
            </div>
          </div>

           {/* Route Summary */}
           {assignedCustomers.length > 0 && (
             <div className="bg-blue-50 p-4 border border-blue-200 rounded-lg">
               <div className="flex items-center gap-2 mb-3">
                 <Route className="w-4 h-4 text-blue-600" />
                 <h3 className="font-semibold text-blue-900">Route Summary</h3>
               </div>
               <div className="gap-4 grid grid-cols-1 md:grid-cols-4">
                 <div>
                   <p className="text-gray-600 text-sm">Total Customers</p>
                   <p className="font-medium text-lg">{assignedCustomers.length}</p>
                 </div>
                 <div>
                   <p className="text-gray-600 text-sm">Route Type</p>
                   <p className="font-medium">Round Trip</p>
                 </div>
                 <div>
                   <p className="text-gray-600 text-sm">Sequence Order</p>
                   <p className="font-medium">
                     {assignedCustomers.length > 0 ? 
                       `1 → ${assignedCustomers.length} → 1` : 
                       'N/A'
                     }
                   </p>
                 </div>
                 <div>
                   <p className="text-gray-600 text-sm">Status</p>
                   <p className="font-medium text-green-600">Active Route</p>
                 </div>
               </div>
             </div>
           )}

           {/* GPS Navigation Panel - Next Stop Only */}
           {nextStop && (
             <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border border-blue-200 rounded-lg">
               <div className="flex items-center gap-2 mb-3">
                 <Navigation className="w-5 h-5 text-blue-600" />
                 <h3 className="font-semibold text-blue-900">Next Stop</h3>
                 <Badge variant="secondary" className="text-xs">
                   {assignedCustomers.length} stops remaining
                 </Badge>
               </div>
               
               {/* Next Stop */}
               <div className="bg-white mb-3 p-4 border border-blue-100 rounded-lg">
                 <div className="flex items-center gap-3">
                   <div className="flex-shrink-0">
                     {nextStop.icon}
                   </div>
                   <div className="flex-1">
                     <h4 className="font-semibold text-gray-900">
                       {nextStop.title}
                     </h4>
                     <p className="text-gray-600 text-sm">
                       {nextStop.description}
                     </p>
                   </div>
                   <div className="text-right">
                     <p className="font-bold text-blue-600 text-lg">
                       {nextStop.distance.toFixed(2)} km
                     </p>
                     <p className="text-gray-500 text-sm">
                       ETA: {nextStop.eta}
                     </p>
                   </div>
                 </div>
                 
                 {/* Direction Arrow */}
                 {nextStop.bearing > 0 && (
                   <div className="flex items-center gap-2 mt-3">
                     <div className="flex items-center gap-1 text-blue-600">
                       {getDirectionIcon(nextStop.bearing)}
                       <span className="font-medium text-sm">
                         {getDirectionText(nextStop.bearing)}
                       </span>
                     </div>
                   </div>
                 )}
               </div>
               
               {/* Navigation Controls */}
               <div className="flex gap-2">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => {
                     if (nextStop.coordinates) {
                       map.current?.flyTo({
                         center: nextStop.coordinates,
                         zoom: 16,
                         duration: 1000
                       });
                     }
                   }}
                   className="flex items-center gap-1"
                 >
                   <MapPin className="w-3 h-3" />
                   Focus on Next Stop
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => {
                     if (nextStop.coordinates) {
                       // Open in external maps
                       const url = `https://www.google.com/maps/dir/?api=1&destination=${nextStop.customer.coordinates.latitude},${nextStop.customer.coordinates.longitude}`;
                       window.open(url, '_blank');
                     }
                   }}
                   className="flex items-center gap-1"
                 >
                   <Navigation className="w-3 h-3" />
                   Open in Maps
                 </Button>
               </div>
             </div>
           )}

           {/* Closest Customer Info */}
           {closestCustomer && (
             <div className="bg-red-50 p-4 border border-red-200 rounded-lg">
               <div className="flex items-center gap-2 mb-2">
                 <MapPin className="w-4 h-4 text-red-600" />
                 <h3 className="font-semibold text-red-900">Closest Customer</h3>
                 <Badge variant="destructive">CLOSEST</Badge>
               </div>
               <div className="gap-4 grid grid-cols-1 md:grid-cols-3">
                 <div>
                   <p className="text-gray-600 text-sm">Customer</p>
                   <p className="font-medium">{closestCustomer.customer.customerName}</p>
                   <p className="text-gray-500 text-sm">{closestCustomer.customer.customerCode}</p>
                 </div>
                 <div>
                   <p className="text-gray-600 text-sm">Distance</p>
                   <p className="font-medium">{closestCustomer.distance.toFixed(2)} km</p>
                 </div>
                 <div>
                   <p className="text-gray-600 text-sm">ETA</p>
                   <p className="font-medium">{closestCustomer.eta}</p>
                 </div>
               </div>
             </div>
           )}

           {/* Map */}
           <div className="space-y-2">
             <div className="flex justify-between items-center">
               <h3 className="flex items-center gap-2 font-semibold">
                 <Route className="w-4 h-4" />
                 Route Visualization
               </h3>
               <div className="flex gap-2 text-gray-500 text-xs">
                 <div className="flex items-center gap-1">
                   <div className="bg-blue-500 rounded-full w-3 h-3"></div>
                   <span>Vehicle</span>
                 </div>
                 <div className="flex items-center gap-1">
                   <div className="bg-red-500 rounded-full w-3 h-3"></div>
                   <span>Closest</span>
                 </div>
                 <div className="flex items-center gap-1">
                   <div className="bg-green-500 rounded-full w-3 h-3"></div>
                   <span>Customers</span>
                 </div>
                 <div className="flex items-center gap-1">
                   <div className="bg-blue-500 w-4 h-0.5"></div>
                   <span>Route</span>
                 </div>
               </div>
             </div>
             
             <div className="relative border border-gray-300 rounded-lg overflow-hidden">
               <div 
                 ref={mapContainer} 
                 className="w-full h-[500px]"
                 style={{ minHeight: '500px' }}
               />
               {!loaded && (
                 <div className="absolute inset-0 flex justify-center items-center bg-gray-100">
                   <div className="text-center">
                     <div className="mx-auto mb-2 border-b-2 border-blue-600 rounded-full w-8 h-8 animate-spin"></div>
                     <p className="text-gray-600 text-sm">Loading map...</p>
                   </div>
                 </div>
               )}
             </div>
           </div>


          {/* Customer List */}
          {assignedCustomers.length > 0 && (
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 font-semibold">
                <Users className="w-4 h-4" />
                Route Sequence ({assignedCustomers.length} customers)
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {/* Vehicle Start */}
                <div className="bg-blue-50 p-3 border border-blue-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex justify-center items-center bg-blue-500 rounded-full w-6 h-6 font-bold text-white text-xs">S</div>
                        <p className="font-medium">Start Point</p>
                        <Badge variant="secondary" className="text-xs">VEHICLE</Badge>
                      </div>
                      <p className="text-gray-600 text-sm">{vehicle.plate} - {formatAddress()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">0.00 km</p>
                      <p className="text-gray-500 text-xs">Current Location</p>
                    </div>
                  </div>
                </div>

                {/* Customers in sequence order */}
                {assignedCustomers
                  .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                  .map((customer, index) => {
                    const customerDistance = customerDistances.find(d => d.customer.id === customer.id);
                    const isClosest = customer.id === closestCustomer?.customer.id;
                    
                    return (
                      <div 
                        key={customer.id}
                        className={`p-3 rounded-lg border ${
                          isClosest 
                            ? 'bg-red-50 border-red-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 text-white rounded-full flex items-center justify-center text-xs font-bold ${
                                isClosest ? 'bg-red-500' : 'bg-green-500'
                              }`}>
                                {customer.sequenceOrder}
                              </div>
                              <p className="font-medium">{customer.customerName}</p>
                              {isClosest && (
                                <Badge variant="destructive" className="text-xs">CLOSEST</Badge>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm">{customer.customerCode}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">{customerDistance?.distance.toFixed(2) || '0.00'} km</p>
                            <p className="text-gray-500 text-xs">ETA: {customerDistance?.eta || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {/* Vehicle End */}
                <div className="bg-blue-50 p-3 border border-blue-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex justify-center items-center bg-blue-500 rounded-full w-6 h-6 font-bold text-white text-xs">E</div>
                        <p className="font-medium">End Point</p>
                        <Badge variant="secondary" className="text-xs">RETURN</Badge>
                      </div>
                      <p className="text-gray-600 text-sm">{vehicle.plate} - Return to start</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">Round Trip</p>
                      <p className="text-gray-500 text-xs">Complete Route</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 p-4 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* No Customers State */}
          {!loading && !error && assignedCustomers.length === 0 && (
            <div className="bg-yellow-50 p-4 border border-yellow-200 rounded-lg text-center">
              <p className="text-yellow-600">No customers assigned to this vehicle today</p>
            </div>
          )}

          {/* Coordinates */}
          <div className="text-gray-500 text-xs text-center">
            Coordinates: {formatCoordinates()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
