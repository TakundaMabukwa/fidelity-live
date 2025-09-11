'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { LocationGroup } from '@/lib/utils/location-grouping';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Route, Users } from 'lucide-react';

interface MapboxRouteMapProps {
  groups: LocationGroup[];
  onGroupSelect?: (group: LocationGroup) => void;
  selectedGroupId?: string;
}

export function MapboxRouteMap({ groups, onGroupSelect, selectedGroupId }: MapboxRouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error('Mapbox token not found');
      return;
    }

    mapboxgl.accessToken = token;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-26.2041, 28.0473], // Johannesburg, South Africa
      zoom: 10
    });

    map.current.on('load', () => {
      setIsMapLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current || !isMapLoaded || groups.length === 0) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add markers for each group
    groups.forEach((group, index) => {
      if (group.centerLat === 0 && group.centerLon === 0) return; // Skip groups without location

      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      markerElement.style.cssText = `
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background-color: ${group.color};
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
        cursor: pointer;
        transition: transform 0.2s;
      `;
      markerElement.textContent = (index + 1).toString();

      // Add hover effect
      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'scale(1.2)';
      });
      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'scale(1)';
      });

      // Add click handler
      markerElement.addEventListener('click', () => {
        if (onGroupSelect) {
          onGroupSelect(group);
        }
      });

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([group.centerLon, group.centerLat])
        .addTo(map.current!);

      markers.current.push(marker);
    });

    // Fit map to show all groups
    if (groups.length > 0) {
      const validGroups = groups.filter(g => g.centerLat !== 0 && g.centerLon !== 0);
      if (validGroups.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        validGroups.forEach(group => {
          bounds.extend([group.centerLon, group.centerLat]);
        });
        map.current.fitBounds(bounds, { padding: 50 });
      }
    }
  }, [groups, isMapLoaded, onGroupSelect]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Route Locations Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={mapContainer} 
            className="border rounded-lg w-full h-96"
            style={{ minHeight: '400px' }}
          />
        </CardContent>
      </Card>

      {/* Group Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Route Groups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="gap-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group, index) => (
              <div
                key={group.id}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedGroupId === group.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onGroupSelect?.(group)}
                style={{ borderLeftColor: group.color, borderLeftWidth: '4px' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="rounded-full w-4 h-4"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="font-medium">Group {index + 1}</span>
                  <Badge variant="secondary" className="text-xs">
                    {group.routes.length} routes
                  </Badge>
                </div>
                <div className="text-gray-600 text-sm">
                  {group.routes.slice(0, 2).map(route => route.Route).join(', ')}
                  {group.routes.length > 2 && ` +${group.routes.length - 2} more`}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
