<script lang="ts">
	import { onMount } from 'svelte';
	
	interface Asset {
		id: number;
		asset_tag: string;
		name: string;
		category: string;
		brand: string;
		model: string;
		status: string;
		purchase_date: string;
		warranty_expiry: string;
		assigned_to: string;
		location: string;
	}
	
	interface Request {
		id: number;
		request_id: string;
		requester_name: string;
		department: string;
		asset_type: string;
		priority: string;
		status: string;
		request_date: string;
	}
	
	let assets: Asset[] = [];
	let requests: Request[] = [];
	let loading = true;
	
	// Report data
	let assetsByCategory: Record<string, number> = {};
	let assetsByStatus: Record<string, number> = {};
	let requestsByDepartment: Record<string, number> = {};
	let requestsByStatus: Record<string, number> = {};
	let expiringWarranties: Asset[] = [];
	let unassignedAssets: Asset[] = [];
	
	onMount(async () => {
		await Promise.all([fetchAssets(), fetchRequests()]);
		generateReports();
		loading = false;
	});
	
	async function fetchAssets() {
		try {
			const response = await fetch('http://localhost:3001/api/assets');
			if (response.ok) {
				assets = await response.json();
			}
		} catch (error) {
			console.error('Failed to fetch assets:', error);
		}
	}
	
	async function fetchRequests() {
		try {
			const response = await fetch('http://localhost:3001/api/requests');
			if (response.ok) {
				requests = await response.json();
			}
		} catch (error) {
			console.error('Failed to fetch requests:', error);
		}
	}
	
	function generateReports() {
		// Assets by category
		assetsByCategory = assets.reduce((acc, asset) => {
			acc[asset.category] = (acc[asset.category] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);
		
		// Assets by status
		assetsByStatus = assets.reduce((acc, asset) => {
			acc[asset.status] = (acc[asset.status] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);
		
		// Requests by department
		requestsByDepartment = requests.reduce((acc, request) => {
			acc[request.department] = (acc[request.department] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);
		
		// Requests by status
		requestsByStatus = requests.reduce((acc, request) => {
			acc[request.status] = (acc[request.status] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);
		
		// Expiring warranties (within 30 days)
		const thirtyDaysFromNow = new Date();
		thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
		
		expiringWarranties = assets.filter(asset => {
			if (!asset.warranty_expiry) return false;
			const warrantyDate = new Date(asset.warranty_expiry);
			return warrantyDate <= thirtyDaysFromNow && warrantyDate >= new Date();
		});
		
		// Unassigned assets
		unassignedAssets = assets.filter(asset => 
			asset.status === 'Available' && !asset.assigned_to
		);
	}
	
	function exportToCSV(data: any[], filename: string) {
		const csv = convertToCSV(data);
		downloadCSV(csv, filename);
	}
	
	function convertToCSV(data: any[]): string {
		if (data.length === 0) return '';
		
		const headers = Object.keys(data[0]).join(',');
		const rows = data.map(row => 
			Object.values(row).map(value => 
				typeof value === 'string' && value.includes(',') 
					? `"${value}"` 
					: value
			).join(',')
		);
		
		return [headers, ...rows].join('\n');
	}
	
	function downloadCSV(csv: string, filename: string) {
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		window.URL.revokeObjectURL(url);
	}
	
	function formatDate(dateString: string): string {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString();
	}
	
	function getWarrantyStatus(warrantyDate: string): string {
		if (!warrantyDate) return 'No warranty';
		
		const warranty = new Date(warrantyDate);
		const now = new Date();
		const diffDays = Math.ceil((warranty.getTime() - now.getTime()) / (1000 * 3600 * 24));
		
		if (diffDays < 0) return 'Expired';
		if (diffDays <= 30) return 'Expiring soon';
		return 'Active';
	}
	
	function getWarrantyStatusClass(warrantyDate: string): string {
		const status = getWarrantyStatus(warrantyDate);
		switch (status) {
			case 'Expired': return 'badge-danger';
			case 'Expiring soon': return 'badge-warning';
			case 'Active': return 'badge-success';
			default: return 'badge-info';
		}
	}
</script>

<svelte:head>
	<title>Reports - Zoho-IT Asset Tracker</title>
</svelte:head>

<div class="reports-page">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-3xl font-bold mb-2">Reports & Analytics</h1>
			<p class="text-secondary">View insights and analytics for your IT assets</p>
		</div>
		<div class="flex gap-2">
			<button 
				class="btn btn-secondary"
				on:click={() => exportToCSV(assets, 'assets-report.csv')}
				disabled={assets.length === 0}
			>
				<span>📊</span>
				Export Assets
			</button>
			<button 
				class="btn btn-secondary"
				on:click={() => exportToCSV(requests, 'requests-report.csv')}
				disabled={requests.length === 0}
			>
				<span>📋</span>
				Export Requests
			</button>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="loading"></div>
			<span class="ml-2">Loading reports...</span>
		</div>
	{:else}
		<!-- Summary Stats -->
		<div class="stats-grid mb-6">
			<div class="stat-card">
				<div class="stat-icon">📦</div>
				<div class="stat-number">{assets.length}</div>
				<div class="stat-label">Total Assets</div>
			</div>
			
			<div class="stat-card">
				<div class="stat-icon">📝</div>
				<div class="stat-number">{requests.length}</div>
				<div class="stat-label">Total Requests</div>
			</div>
			
			<div class="stat-card">
				<div class="stat-icon">⚠️</div>
				<div class="stat-number">{expiringWarranties.length}</div>
				<div class="stat-label">Expiring Warranties</div>
			</div>
			
			<div class="stat-card">
				<div class="stat-icon">📋</div>
				<div class="stat-number">{unassignedAssets.length}</div>
				<div class="stat-label">Unassigned Assets</div>
			</div>
		</div>

		<!-- Charts Section -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
			<!-- Assets by Category -->
			<div class="card">
				<div class="card-header">
					<h2 class="text-xl font-semibold">Assets by Category</h2>
				</div>
				<div class="card-body">
					{#if Object.keys(assetsByCategory).length > 0}
						<div class="space-y-3">
							{#each Object.entries(assetsByCategory) as [category, count]}
								<div class="flex items-center justify-between">
									<span class="font-medium">{category}</span>
									<div class="flex items-center gap-2">
										<div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
											<div 
												class="h-full bg-blue-500 rounded-full"
												style="width: {(count / assets.length) * 100}%"
											></div>
										</div>
										<span class="text-sm font-medium">{count}</span>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-center text-secondary py-4">No data available</p>
					{/if}
				</div>
			</div>

			<!-- Requests by Department -->
			<div class="card">
				<div class="card-header">
					<h2 class="text-xl font-semibold">Requests by Department</h2>
				</div>
				<div class="card-body">
					{#if Object.keys(requestsByDepartment).length > 0}
						<div class="space-y-3">
							{#each Object.entries(requestsByDepartment) as [department, count]}
								<div class="flex items-center justify-between">
									<span class="font-medium">{department}</span>
									<div class="flex items-center gap-2">
										<div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
											<div 
												class="h-full bg-green-500 rounded-full"
												style="width: {(count / requests.length) * 100}%"
											></div>
										</div>
										<span class="text-sm font-medium">{count}</span>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-center text-secondary py-4">No data available</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- Status Breakdown -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
			<!-- Asset Status -->
			<div class="card">
				<div class="card-header">
					<h2 class="text-xl font-semibold">Asset Status Distribution</h2>
				</div>
				<div class="card-body">
					<div class="grid grid-cols-2 gap-4">
						{#each Object.entries(assetsByStatus) as [status, count]}
							<div class="text-center p-3 rounded bg-gray-50">
								<div class="text-lg font-bold text-primary">{count}</div>
								<div class="text-sm text-secondary">{status}</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Request Status -->
			<div class="card">
				<div class="card-header">
					<h2 class="text-xl font-semibold">Request Status Distribution</h2>
				</div>
				<div class="card-body">
					<div class="grid grid-cols-2 gap-4">
						{#each Object.entries(requestsByStatus) as [status, count]}
							<div class="text-center p-3 rounded bg-gray-50">
								<div class="text-lg font-bold text-primary">{count}</div>
								<div class="text-sm text-secondary">{status}</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<!-- Expiring Warranties -->
		{#if expiringWarranties.length > 0}
			<div class="card mb-6">
				<div class="card-header">
					<h2 class="text-xl font-semibold">⚠️ Warranties Expiring Soon</h2>
				</div>
				<div class="card-body p-0">
					<div class="table-container">
						<table class="table">
							<thead>
								<tr>
									<th>Asset Tag</th>
									<th>Name</th>
									<th>Category</th>
									<th>Warranty Expiry</th>
									<th>Status</th>
									<th>Assigned To</th>
								</tr>
							</thead>
							<tbody>
								{#each expiringWarranties as asset}
									<tr>
										<td class="font-medium">{asset.asset_tag}</td>
										<td>{asset.name}</td>
										<td>{asset.category}</td>
										<td>{formatDate(asset.warranty_expiry)}</td>
										<td>
											<span class="badge {getWarrantyStatusClass(asset.warranty_expiry)}">
												{getWarrantyStatus(asset.warranty_expiry)}
											</span>
										</td>
										<td>{asset.assigned_to || 'Unassigned'}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		{/if}

		<!-- Unassigned Assets -->
		{#if unassignedAssets.length > 0}
			<div class="card">
				<div class="card-header">
					<h2 class="text-xl font-semibold">📋 Unassigned Assets</h2>
				</div>
				<div class="card-body p-0">
					<div class="table-container">
						<table class="table">
							<thead>
								<tr>
									<th>Asset Tag</th>
									<th>Name</th>
									<th>Category</th>
									<th>Brand/Model</th>
									<th>Location</th>
									<th>Purchase Date</th>
								</tr>
							</thead>
							<tbody>
								{#each unassignedAssets as asset}
									<tr>
										<td class="font-medium">{asset.asset_tag}</td>
										<td>{asset.name}</td>
										<td>{asset.category}</td>
										<td>
											{asset.brand ? `${asset.brand}` : ''}
											{asset.model ? ` ${asset.model}` : ''}
										</td>
										<td>{asset.location || 'Not specified'}</td>
										<td>{formatDate(asset.purchase_date)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.reports-page {
		max-width: 100%;
	}
	
	.grid {
		display: grid;
	}
	
	.grid-cols-1 {
		grid-template-columns: repeat(1, minmax(0, 1fr));
	}
	
	.grid-cols-2 {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
	
	@media (min-width: 1024px) {
		.lg\\:grid-cols-2 {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	
	.text-secondary {
		color: var(--text-secondary);
	}
	
	.text-primary {
		color: var(--primary-color);
	}
	
	.ml-2 {
		margin-left: 0.5rem;
	}
	
	.space-y-3 > * + * {
		margin-top: 0.75rem;
	}
	
	.w-24 {
		width: 6rem;
	}
	
	.h-2 {
		height: 0.5rem;
	}
	
	.bg-gray-200 {
		background-color: #e5e7eb;
	}
	
	.bg-gray-50 {
		background-color: var(--background-primary);
	}
	
	.bg-blue-500 {
		background-color: #3b82f6;
	}
	
	.bg-green-500 {
		background-color: #10b981;
	}
	
	.rounded-full {
		border-radius: 9999px;
	}
	
	.overflow-hidden {
		overflow: hidden;
	}
</style>
