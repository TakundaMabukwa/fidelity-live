'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RoutesWithCustomers } from '@/components/routes/routes-with-customers';

export default function EditableInfoPage() {
	return (
		<div className="space-y-6">
			<Tabs defaultValue="routes-with-customers" className="w-full">
				<TabsList className="w-full">
					<TabsTrigger value="routes-with-customers">Routes with Customers</TabsTrigger>
				</TabsList>
				<TabsContent value="routes-with-customers" className="mt-6">
					<RoutesWithCustomers />
				</TabsContent>
			</Tabs>
		</div>
	);
}
