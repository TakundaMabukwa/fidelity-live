'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Users, MapPin, Clock, Package } from 'lucide-react';
import { VehicleAssignmentCustomer, getVehicleAssignments, getVehicleAssignmentCustomers } from '@/lib/actions/routes';

interface CustomerViewPopupProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleRegistration: string;
}

export function CustomerViewPopup({ 
  isOpen, 
  onClose, 
  vehicleRegistration
}: CustomerViewPopupProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<VehicleAssignmentCustomer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<VehicleAssignmentCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load customers when popup opens
  useEffect(() => {
    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen, vehicleRegistration]);

  // Filter customers based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(customer => 
        customer.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customer_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customer_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customer_status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchTerm, customers]);

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading customers for vehicle:', vehicleRegistration);
      
      // Get vehicle assignments
      const assignments = await getVehicleAssignments(vehicleRegistration);
      console.log('Found assignments:', assignments);
      
      if (assignments.length === 0) {
        setCustomers([]);
        return;
      }

      // Get customers for the most recent assignment
      const latestAssignment = assignments[0];
      const assignmentCustomers = await getVehicleAssignmentCustomers(latestAssignment.id);
      console.log('Found customers:', assignmentCustomers);
      
      setCustomers(assignmentCustomers);
    } catch (err) {
      console.error('Error loading customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('completed') || statusLower.includes('done')) {
      return 'bg-green-100 text-green-800';
    } else if (statusLower.includes('pending') || statusLower.includes('waiting')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (statusLower.includes('in progress') || statusLower.includes('active')) {
      return 'bg-blue-100 text-blue-800';
    } else if (statusLower.includes('cancelled') || statusLower.includes('failed')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type: string | null) => {
    if (!type) return 'bg-gray-100 text-gray-800';
    
    const typeLower = type.toLowerCase();
    if (typeLower.includes('collection')) {
      return 'bg-purple-100 text-purple-800';
    } else if (typeLower.includes('delivery')) {
      return 'bg-orange-100 text-orange-800';
    } else if (typeLower.includes('service')) {
      return 'bg-cyan-100 text-cyan-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex flex-col max-w-6xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Customers for {vehicleRegistration}
            <Badge variant="outline" className="ml-2">
              {customers.length} customers
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 gap-4 overflow-hidden">
          {/* Search */}
          <div className="relative">
            <Search className="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2 transform" />
            <Input
              placeholder="Search customers by name, code, type, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Customers Table */}
          <div className="flex-1 border rounded-lg overflow-y-auto">
            {loading ? (
              <div className="p-8 text-gray-500 text-center">
                <div className="mx-auto mb-4 border-b-2 border-blue-600 rounded-full w-8 h-8 animate-spin"></div>
                <h3 className="mb-2 font-medium text-lg">Loading customers...</h3>
                <p>Please wait while we fetch customer data</p>
              </div>
            ) : error ? (
              <div className="p-8 text-gray-500 text-center">
                <Users className="mx-auto mb-4 w-12 h-12 text-red-300" />
                <h3 className="mb-2 font-medium text-red-600 text-lg">Error loading customers</h3>
                <p className="text-red-500">{error}</p>
                <Button onClick={loadCustomers} variant="outline" className="mt-4">
                  Try Again
                </Button>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-8 text-gray-500 text-center">
                <Users className="mx-auto mb-4 w-12 h-12 text-gray-300" />
                <h3 className="mb-2 font-medium text-lg">No customers found</h3>
                <p>This vehicle has no assigned customers or try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-500 text-xs text-left uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500 text-xs text-left uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500 text-xs text-left uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500 text-xs text-left uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500 text-xs text-left uppercase tracking-wider">
                        Hours
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500 text-xs text-left uppercase tracking-wider">
                        Arrival
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500 text-xs text-left uppercase tracking-wider">
                        Bags
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-8 h-8">
                              <div className="flex justify-center items-center bg-blue-100 rounded-full w-8 h-8">
                                <Users className="w-4 h-4 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="font-medium text-gray-900 text-sm">
                                {customer.customer_name || 'Unnamed Customer'}
                              </div>
                              <div className="text-gray-500 text-sm">
                                ID: {customer.customer_id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center text-gray-900 text-sm">
                            <MapPin className="mr-2 w-4 h-4 text-gray-400" />
                            {customer.customer_code || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge className={getTypeColor(customer.customer_type)}>
                            {customer.customer_type || 'N/A'}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor(customer.customer_status)}>
                            {customer.customer_status || 'N/A'}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-gray-900 text-sm whitespace-nowrap">
                          <div className="flex items-center">
                            <Clock className="mr-2 w-4 h-4 text-gray-400" />
                            {customer.customer_hours || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-900 text-sm whitespace-nowrap">
                          {customer.customer_arrival || 'N/A'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {customer.collection_bags && (
                              <div className="flex items-center text-gray-600 text-xs">
                                <Package className="mr-1 w-3 h-3" />
                                C: {customer.collection_bags}
                              </div>
                            )}
                            {customer.delivery_bags && (
                              <div className="flex items-center text-gray-600 text-xs">
                                <Package className="mr-1 w-3 h-3" />
                                D: {customer.delivery_bags}
                              </div>
                            )}
                            {!customer.collection_bags && !customer.delivery_bags && (
                              <span className="text-gray-400 text-xs">No bags</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
