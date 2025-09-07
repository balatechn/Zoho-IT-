<script lang="ts">
	import { onMount } from 'svelte';
	import { getApiUrl } from '$lib/api';
	
	interface Asset {
		id: number;
		asset_tag: string;
		name: string;
		category: string;
		brand: string;
		model: string;
		serial_number: string;
		purchase_date: string;
		warranty_expiry: string;
		status: string;
		location: string;
		assigned_to: string;
		notes: string;
		created_at: string;
	}
	
	let assets: Asset[] = [];
	let loading = true;
	let searchTerm = '';
	let selectedCategory = '';
	let selectedStatus = '';
	
	const categories = [
		'Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse', 
		'Printer', 'Scanner', 'Tablet', 'Phone', 'Server', 
		'Network Equipment', 'Software License'
	];
	
	const statuses = ['Available', 'Assigned', 'Maintenance', 'Retired'];
	
	onMount(async () => {
		await fetchAssets();
	});
	
	async function fetchAssets() {
		loading = true;
		try {
			const response = await fetch(getApiUrl('/api/assets'));
			if (response.ok) {
				assets = await response.json();
			}
		} catch (error) {
			console.error('Failed to fetch assets:', error);
		} finally {
			loading = false;
		}
	}
	
	async function deleteAsset(id: number) {
		if (!confirm('Are you sure you want to delete this asset?')) return;
		
		try {
			const response = await fetch(getApiUrl(`/api/assets/${id}`), {
				method: 'DELETE'
			});
			
			if (response.ok) {
				await fetchAssets();
			} else {
				alert('Failed to delete asset');
			}
		} catch (error) {
			console.error('Failed to delete asset:', error);
			alert('Failed to delete asset');
		}
	}
	
	function getStatusBadgeClass(status: string): string {
		switch (status.toLowerCase()) {
			case 'available':
				return 'badge-success';
			case 'assigned':
				return 'badge-warning';
			case 'maintenance':
				return 'badge-danger';
			case 'retired':
				return 'badge-info';
			default:
				return 'badge-info';
		}
	}
	
	function formatDate(dateString: string): string {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString();
	}
	
	// Filter assets based on search and filters
	$: filteredAssets = assets.filter(asset => {
		const matchesSearch = !searchTerm || 
			asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			asset.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
			asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
			asset.model.toLowerCase().includes(searchTerm.toLowerCase());
			
		const matchesCategory = !selectedCategory || asset.category === selectedCategory;
		const matchesStatus = !selectedStatus || asset.status === selectedStatus;
		
		return matchesSearch && matchesCategory && matchesStatus;
	});
</script>

<svelte:head>
	<title>Assets - National Group India IT Asset Tracker</title>
</svelte:head>

<div class="assets-page">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-3xl font-bold mb-2">IT Assets</h1>
			<p class="text-secondary">Manage your organization's IT assets</p>
		</div>
		<div class="flex gap-3">
			<a href="/assets/assign" class="btn btn-secondary">
				<span>✍️</span>
				Assign Asset
			</a>
			<a href="/assets/new" class="btn btn-primary">
				<span>➕</span>
				Add New Asset
			</a>
		</div>
	</div>

	<!-- Filters -->
	<div class="card mb-6">
		<div class="card-body">
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div>
					<label class="form-label">Search</label>
					<input 
						type="text" 
						class="form-input" 
						placeholder="Search assets..."
						bind:value={searchTerm}
					>
				</div>
				<div>
					<label class="form-label">Category</label>
					<select class="form-select" bind:value={selectedCategory}>
						<option value="">All Categories</option>
						{#each categories as category}
							<option value={category}>{category}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="form-label">Status</label>
					<select class="form-select" bind:value={selectedStatus}>
						<option value="">All Statuses</option>
						{#each statuses as status}
							<option value={status}>{status}</option>
						{/each}
					</select>
				</div>
				<div class="flex items-end">
					<button 
						class="btn btn-secondary w-full"
						on:click={() => {
							searchTerm = '';
							selectedCategory = '';
							selectedStatus = '';
						}}
					>
						Clear Filters
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Assets Table -->
	<div class="card">
		<div class="card-header">
			<div class="flex items-center justify-between">
				<h2 class="text-xl font-semibold">
					Assets ({filteredAssets.length})
				</h2>
				<button class="btn btn-sm btn-secondary" on:click={fetchAssets}>
					<span>🔄</span>
					Refresh
				</button>
			</div>
		</div>
		
		{#if loading}
			<div class="card-body">
				<div class="flex items-center justify-center py-8">
					<div class="loading"></div>
					<span class="ml-2">Loading assets...</span>
				</div>
			</div>
		{:else if filteredAssets.length === 0}
			<div class="card-body">
				<div class="text-center py-8">
					<div class="text-6xl mb-4">📦</div>
					<h3 class="text-xl font-semibold mb-2">No assets found</h3>
					<p class="text-secondary mb-4">
						{assets.length === 0 
							? "Get started by adding your first asset."
							: "Try adjusting your search criteria."}
					</p>
					<a href="/assets/new" class="btn btn-primary">
						<span>➕</span>
						Add Asset
					</a>
				</div>
			</div>
		{:else}
			<div class="card-body p-0">
				<div class="table-container">
					<table class="table">
						<thead>
							<tr>
								<th>Asset Tag</th>
								<th>Name</th>
								<th>Category</th>
								<th>Brand/Model</th>
								<th>Status</th>
								<th>Assigned To</th>
								<th>Location</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredAssets as asset}
								<tr>
									<td class="font-medium">{asset.asset_tag}</td>
									<td>{asset.name}</td>
									<td>{asset.category}</td>
									<td>
										{asset.brand ? `${asset.brand}` : ''}
										{asset.model ? ` ${asset.model}` : ''}
									</td>
									<td>
										<span class="badge {getStatusBadgeClass(asset.status)}">
											{asset.status}
										</span>
									</td>
									<td>{asset.assigned_to || '-'}</td>
									<td>{asset.location || '-'}</td>
									<td>
										<div class="flex gap-2">
											<a 
												href="/assets/{asset.id}" 
												class="btn btn-sm btn-secondary"
												title="View Details"
											>
												👁️
											</a>
											<a 
												href="/assets/{asset.id}/edit" 
												class="btn btn-sm btn-secondary"
												title="Edit"
											>
												✏️
											</a>
											<button 
												class="btn btn-sm btn-danger"
												title="Delete"
												on:click={() => deleteAsset(asset.id)}
											>
												🗑️
											</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.assets-page {
		max-width: 100%;
	}
	
	.grid {
		display: grid;
	}
	
	.grid-cols-1 {
		grid-template-columns: repeat(1, minmax(0, 1fr));
	}
	
	@media (min-width: 768px) {
		.md\\:grid-cols-4 {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}
	
	.text-secondary {
		color: var(--text-secondary);
	}
	
	.ml-2 {
		margin-left: 0.5rem;
	}
	
	.w-full {
		width: 100%;
	}
</style>
