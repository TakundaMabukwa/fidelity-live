'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CustomerDuration } from '@/lib/types';
import { isTodayServiceDay } from '@/lib/utils/service-days';
import { useRoutes } from './routes-context';

interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface CustomerDurationContextType {
  customers: CustomerDuration[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  loadCustomersByLocationCode: (locationCode: string, serviceDays: string[], page?: number, pageSize?: number) => Promise<void>;
  getCustomersByLocationCode: (locationCode: string) => CustomerDuration[];
}

const CustomerDurationContext = createContext<CustomerDurationContextType | undefined>(undefined);

export function CustomerDurationProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<CustomerDuration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  
  // Use routes context for caching
  const { 
    getCachedCustomers, 
    getCachedPagination, 
    cacheCustomers, 
    isCustomerDataCached 
  } = useRoutes();

  const loadCustomersByLocationCode = useCallback(async (locationCode: string, serviceDays: string[], page: number = 1, pageSize: number = 10) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if today is a service day using the utility function
      const isServiceDay = isTodayServiceDay(serviceDays.join(', '));
      
      if (!isServiceDay) {
        setCustomers([]);
        setPagination(null);
        setLoading(false);
        return;
      }

      // Check cache first - use cached data if available
      if (isCustomerDataCached(locationCode)) {
        const cachedCustomers = getCachedCustomers(locationCode);
        const cachedPagination = getCachedPagination(locationCode);
        
        if (cachedCustomers && cachedPagination) {
          console.log('Using cached customer data for', locationCode, 'page', page);
          setCustomers(cachedCustomers);
          setPagination(cachedPagination);
          setLoading(false);
          return;
        }
      }

      // Fetch customers from the API with pagination
      console.log('Fetching customers for location code:', locationCode, 'page:', page, 'pageSize:', pageSize);
      const response = await fetch(`/api/customers-duration?code=${encodeURIComponent(locationCode)}&page=${page}&pageSize=${pageSize}`);
      
      console.log('API response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to fetch customers: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API response data:', data);
      
      if (data.success && data.data) {
        setCustomers(data.data);
        setPagination(data.pagination || null);
        
        // Cache the data for future use
        cacheCustomers(locationCode, data.data, data.pagination, serviceDays);
        
        console.log('Successfully loaded', data.data.length, 'customers, pagination:', data.pagination);
      } else {
        throw new Error(data.error || 'Failed to load customers');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load customers';
      setError(errorMessage);
      console.error('Error loading customers:', err);
      
      // Provide mock data as fallback for development
      console.log('Providing mock data as fallback');
      const mockCustomers: CustomerDuration[] = [
        {
          id: 'mock-1',
          code: locationCode,
          customer: 'Sample Customer 1',
          stops: 5
        },
        {
          id: 'mock-2',
          code: locationCode,
          customer: 'Sample Customer 2',
          stops: 3
        }
      ];
      setCustomers(mockCustomers);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCustomersByLocationCode = useCallback((locationCode: string): CustomerDuration[] => {
    return customers.filter(customer => customer.code === locationCode);
  }, [customers]);

  const value: CustomerDurationContextType = {
    customers,
    loading,
    error,
    pagination,
    loadCustomersByLocationCode,
    getCustomersByLocationCode
  };

  return (
    <CustomerDurationContext.Provider value={value}>
      {children}
    </CustomerDurationContext.Provider>
  );
}

export function useCustomerDuration() {
  const context = useContext(CustomerDurationContext);
  if (context === undefined) {
    throw new Error('useCustomerDuration must be used within a CustomerDurationProvider');
  }
  return context;
}
