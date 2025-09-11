import { useMemo } from 'react';
import { 
  parseServiceDays, 
  hasServiceDay, 
  formatServiceDaysForDisplay,
  getServiceDaysCount,
  isValidServiceDays,
  type ServiceDaysResult 
} from '@/lib/utils/service-days';

/**
 * Custom hook for managing ServiceDays data
 * Provides utilities for parsing, filtering, and displaying service days
 */
export function useServiceDays() {
  /**
   * Parse service days with error handling
   */
  const parse = (serviceDays: any): ServiceDaysResult => {
    return parseServiceDays(serviceDays);
  };

  /**
   * Check if a specific day is included in service days
   */
  const hasDay = (serviceDays: any, targetDay: string): boolean => {
    return hasServiceDay(serviceDays, targetDay);
  };

  /**
   * Format service days for display
   */
  const formatForDisplay = (serviceDays: any, maxLength?: number): string => {
    return formatServiceDaysForDisplay(serviceDays, maxLength);
  };

  /**
   * Get count of service days
   */
  const getCount = (serviceDays: any): number => {
    return getServiceDaysCount(serviceDays);
  };

  /**
   * Validate service days
   */
  const isValid = (serviceDays: any): boolean => {
    return isValidServiceDays(serviceDays);
  };

  /**
   * Filter routes by service day
   */
  const filterRoutesByDay = (routes: any[], targetDay: string) => {
    return routes.filter(route => hasDay(route.ServiceDays, targetDay));
  };

  /**
   * Get service days statistics
   */
  const getStats = (routes: any[]) => {
    return useMemo(() => {
      const stats = {
        totalRoutes: routes.length,
        routesWithServiceDays: 0,
        routesWithoutServiceDays: 0,
        averageServiceDays: 0,
        mostCommonDays: {} as Record<string, number>,
        invalidServiceDays: 0
      };

      let totalServiceDays = 0;
      const dayCounts: Record<string, number> = {};

      routes.forEach(route => {
        const result = parse(route.ServiceDays);
        
        if (result.isValid) {
          stats.routesWithServiceDays++;
          totalServiceDays += result.days.length;
          
          result.days.forEach(day => {
            dayCounts[day] = (dayCounts[day] || 0) + 1;
          });
        } else {
          stats.routesWithoutServiceDays++;
          if (result.error) {
            stats.invalidServiceDays++;
          }
        }
      });

      stats.averageServiceDays = stats.routesWithServiceDays > 0 
        ? Math.round(totalServiceDays / stats.routesWithServiceDays * 10) / 10 
        : 0;

      stats.mostCommonDays = dayCounts;

      return stats;
    }, [routes]);
  };

  return {
    parse,
    hasDay,
    formatForDisplay,
    getCount,
    isValid,
    filterRoutesByDay,
    getStats
  };
}
