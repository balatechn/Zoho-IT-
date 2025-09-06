<script lang="ts">
	import { onMount } from 'svelte';
	
	interface DashboardStats {
		totalAssets: number;
		pendingRequests: number;
		assetsByStatus: Array<{ status: string; count: number }>;
	}
	
	interface Asset {
		id: number;
		asset_tag: string;
		name: string;
		category: string;
		status: string;
		assigned_to: string;
		created_at: string;
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
	
	let stats: DashboardStats = {
		totalAssets: 0,
		pendingRequests: 0,
		assetsByStatus: []
	};
	
	let recentAssets: Asset[] = [];
	let recentRequests: Request[] = [];
	let loading = true;
	
	onMount(async () => {
		try {
			// Fetch dashboard stats
			const statsResponse = await fetch('http://localhost:3001/api/dashboard/stats');
			if (statsResponse.ok) {
				stats = await statsResponse.json();
			}
			
			// Fetch recent assets
			const assetsResponse = await fetch('http://localhost:3001/api/assets');
			if (assetsResponse.ok) {
				const allAssets = await assetsResponse.json();
				recentAssets = allAssets.slice(0, 5);
			}
			
			// Fetch recent requests
			const requestsResponse = await fetch('http://localhost:3001/api/requests');
			if (requestsResponse.ok) {
				const allRequests = await requestsResponse.json();
				recentRequests = allRequests.slice(0, 5);
			}
		} catch (error) {
			console.error('Failed to fetch dashboard data:', error);
		} finally {
			loading = false;
		}
	});
	
	function getStatusBadgeClass(status: string): string {
		switch (status.toLowerCase()) {
			case 'available':
			case 'approved':
				return 'badge-success';
			case 'assigned':
			case 'pending':
				return 'badge-warning';
			case 'maintenance':
			case 'rejected':
				return 'badge-danger';
			default:
				return 'badge-info';
		}
	}
	
	function getPriorityBadgeClass(priority: string): string {
		switch (priority.toLowerCase()) {
			case 'high':
				return 'badge-danger';
			case 'medium':
				return 'badge-warning';
			case 'low':
				return 'badge-success';
			default:
				return 'badge-info';
		}
	}
	
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString();
	}
</script>

<svelte:head>
	<title>Dashboard - National Group India IT Asset Tracker</title>
</svelte:head>

<div class="dashboard">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-3xl font-bold text-primary mb-2">Welcome to National Group India</h1>
			<p class="text-secondary">IT Asset Management & Request System</p>
		</div>
		<div class="flex gap-4">
			<a href="/assets/new" class="btn btn-primary">
				<span>➕</span>
				Add Asset
			</a>
			<a href="/requests/new" class="btn btn-secondary">
				<span>📝</span>
				New Request
			</a>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="loading"></div>
			<span class="ml-2">Loading dashboard...</span>
		</div>
	{:else}
		<!-- Statistics Cards -->
		<div class="stats-grid">
			<div class="stat-card">
				<div class="stat-icon">📦</div>
				<div class="stat-number">{stats.totalAssets}</div>
				<div class="stat-label">Total Assets</div>
			</div>
			
			<div class="stat-card">
				<div class="stat-icon">⏳</div>
				<div class="stat-number">{stats.pendingRequests}</div>
				<div class="stat-label">Pending Requests</div>
			</div>
			
			<div class="stat-card">
				<div class="stat-icon">✅</div>
				<div class="stat-number">
					{stats.assetsByStatus.find(s => s.status === 'Available')?.count || 0}
				</div>
				<div class="stat-label">Available Assets</div>
			</div>
			
			<div class="stat-card">
				<div class="stat-icon">👥</div>
				<div class="stat-number">
					{stats.assetsByStatus.find(s => s.status === 'Assigned')?.count || 0}
				</div>
				<div class="stat-label">Assigned Assets</div>
			</div>
		</div>

		<!-- Recent Assets and Requests -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Recent Assets -->
			<div class="card">
				<div class="card-header">
					<div class="flex items-center justify-between">
						<h2 class="text-xl font-semibold">Recent Assets</h2>
						<a href="/assets" class="btn btn-sm btn-secondary">View All</a>
					</div>
				</div>
				<div class="card-body p-0">
					{#if recentAssets.length > 0}
						<div class="table-container">
							<table class="table">
								<thead>
									<tr>
										<th>Asset Tag</th>
										<th>Name</th>
										<th>Category</th>
										<th>Status</th>
									</tr>
								</thead>
								<tbody>
									{#each recentAssets as asset}
										<tr>
											<td class="font-medium">{asset.asset_tag}</td>
											<td>{asset.name}</td>
											<td>{asset.category}</td>
											<td>
												<span class="badge {getStatusBadgeClass(asset.status)}">
													{asset.status}
												</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<div class="p-6 text-center text-secondary">
							<div class="text-4xl mb-2">📦</div>
							<p>No assets found</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Recent Requests -->
			<div class="card">
				<div class="card-header">
					<div class="flex items-center justify-between">
						<h2 class="text-xl font-semibold">Recent Requests</h2>
						<a href="/requests" class="btn btn-sm btn-secondary">View All</a>
					</div>
				</div>
				<div class="card-body p-0">
					{#if recentRequests.length > 0}
						<div class="table-container">
							<table class="table">
								<thead>
									<tr>
										<th>Request ID</th>
										<th>Requester</th>
										<th>Priority</th>
										<th>Status</th>
									</tr>
								</thead>
								<tbody>
									{#each recentRequests as request}
										<tr>
											<td class="font-medium">{request.request_id}</td>
											<td>{request.requester_name}</td>
											<td>
												<span class="badge {getPriorityBadgeClass(request.priority)}">
													{request.priority}
												</span>
											</td>
											<td>
												<span class="badge {getStatusBadgeClass(request.status)}">
													{request.status}
												</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<div class="p-6 text-center text-secondary">
							<div class="text-4xl mb-2">📝</div>
							<p>No requests found</p>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Asset Status Overview -->
		{#if stats.assetsByStatus.length > 0}
			<div class="card mt-6">
				<div class="card-header">
					<h2 class="text-xl font-semibold">Asset Status Overview</h2>
				</div>
				<div class="card-body">
					<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
						{#each stats.assetsByStatus as statusItem}
							<div class="text-center p-4 rounded bg-gray-50">
								<div class="text-2xl font-bold text-primary mb-1">
									{statusItem.count}
								</div>
								<div class="text-sm text-secondary font-medium">
									{statusItem.status}
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.dashboard {
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
	
	.grid-cols-4 {
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}
	
	@media (min-width: 1024px) {
		.lg\\:grid-cols-2 {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	
	@media (min-width: 768px) {
		.md\\:grid-cols-4 {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}
	
	.text-primary {
		color: var(--primary-color);
	}
	
	.text-secondary {
		color: var(--text-secondary);
	}
	
	.bg-gray-50 {
		background-color: var(--background-primary);
	}
	
	.ml-2 {
		margin-left: 0.5rem;
	}
</style>
