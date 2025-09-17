"use client";
import React, { useEffect, useMemo, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/data-table';
import { TableColumn, Route as RouteType } from '@/lib/types';
import { useRoutes } from '@/contexts/routes-context';
import { getAllRoutes, updateRoute } from '@/lib/actions/routes';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const createColumns = (): TableColumn<RouteType>[] => [
	{ key: 'id', header: 'ID', sortable: true },
	{ key: 'Route', header: 'Route' },
	{ key: 'LocationCode', header: 'Location Code' },
	{ key: 'ServiceDays', header: 'Service Days' },
	{ key: 'userGroup', header: 'User Group' },
	{ key: 'StartDate', header: 'Start Date' },
	{ key: 'Inactive', header: 'Inactive' },
	{ key: 'RouteId', header: 'RouteId' },
];

export default function EditableRoutesPage() {
	const { routes, loading, error, loadRoutes, refreshRoutes, isLoaded, hasData, updateRouteLocal, updateRoutesLocal } = useRoutes();
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(50);

	const pagination = useMemo(() => {
		const totalItems = routes.length;
		const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
		const safePage = Math.min(currentPage, totalPages);
		const startIndex = (safePage - 1) * itemsPerPage;
		const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
		const slice = routes.slice(startIndex, endIndex);
		return { totalItems, totalPages, startIndex, endIndex, data: slice, page: safePage };
	}, [routes, currentPage, itemsPerPage]);

	useEffect(() => {
		if (!isLoaded) {
			loadRoutes();
		}
	}, [isLoaded, loadRoutes]);

	return (
		<Card>
			<CardHeader>
				<div className="flex justify-between items-center">
					<CardTitle>Editable Routes {hasData && <Badge variant="secondary" className="ml-2 text-xs">{routes.length}</Badge>}</CardTitle>
					<div className="flex gap-2">
						<Button variant="outline" size="sm" onClick={() => refreshRoutes()}>Refresh</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
					<DataTable<RouteType>
						data={pagination.data}
					columns={createColumns()}
					loading={loading}
					getRowId={(row) => row.id}
						searchable={false}
						onSaveEdits={async (changes) => {
							// Optimistic local update for only affected rows
							updateRoutesLocal(
								changes.map(c => ({ id: (c.row as RouteType).id, updates: c.updates as Partial<RouteType> }))
							);
							// Persist each change; if any fail, you could optionally refresh the single row
							for (const change of changes) {
								const id = (change.row as RouteType).id;
								const res = await updateRoute(id, change.updates as Partial<RouteType>);
								if (!res.success) {
									console.error('Failed to update route', id, res.error);
								}
							}
						}}
				/>

					{/* Pagination Controls */}
					<div className="flex sm:flex-row flex-col justify-between items-center gap-4 mt-4">
						<div className="flex itemsPerPage items-center gap-2">
							<span className="text-gray-700 text-sm">Show</span>
							<select 
								value={itemsPerPage.toString()} 
								onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
								className="px-2 border border-gray-300 rounded-md w-20 h-8 text-sm"
							>
								<option value="10">10</option>
								<option value="25">25</option>
								<option value="50">50</option>
								<option value="100">100</option>
							</select>
							<span className="text-gray-700 text-sm">entries</span>
						</div>

						<div className="text-gray-700 text-sm">
							Showing {pagination.totalItems === 0 ? 0 : pagination.startIndex + 1} to {pagination.endIndex} of {pagination.totalItems} entries
						</div>

						<div className="flex items-center gap-1">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
								disabled={pagination.page <= 1}
								className="p-0 w-8 h-8"
							>
								<ChevronLeft className="w-4 h-4" />
							</Button>
							{Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => i + 1).map(pageNum => (
								<Button
									key={pageNum}
									variant={pageNum === pagination.page ? 'default' : 'outline'}
									size="sm"
									onClick={() => setCurrentPage(pageNum)}
									className="p-0 w-8 h-8"
								>
									{pageNum}
								</Button>
							))}
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
								disabled={pagination.page >= pagination.totalPages}
								className="p-0 w-8 h-8"
							>
								<ChevronRight className="w-4 h-4" />
							</Button>
						</div>
					</div>
			</CardContent>
		</Card>
	);
}
