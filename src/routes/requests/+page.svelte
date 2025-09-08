<script lang="ts">
	import { onMount } from 'svelte';
	import { getApiUrl } from '$lib/api';
	
	interface Request {
		id: number;
		request_id: string;
		requester_name: string;
		requester_email: string;
		department: string;
		asset_type: string;
		description: string;
		priority: string;
		status: string;
		request_date: string;
		approved_date: string;
		approved_by: string;
		notes: string;
		created_at: string;
	}
	
	let requests: Request[] = [];
	let loading = true;
	let searchTerm = '';
	let selectedStatus = '';
	let selectedPriority = '';
	
	const statuses = ['Pending', 'Approved', 'Rejected', 'Completed'];
	const priorities = ['Low', 'Medium', 'High'];
	
	onMount(async () => {
		await fetchRequests();
	});
	
	async function fetchRequests() {
		loading = true;
		try {
			const response = await fetch(getApiUrl('/api/requests'));
			if (response.ok) {
				requests = await response.json();
			}
		} catch (error) {
			console.error('Failed to fetch requests:', error);
		} finally {
			loading = false;
		}
	}
	
	async function updateRequestStatus(id: number, status: string) {
		try {
			const response = await fetch(getApiUrl(`/api/requests/${id}`), {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					status,
					approved_by: status === 'Approved' ? 'Admin' : null,
					notes: `Status updated to ${status}`
				})
			});
			
			if (response.ok) {
				await fetchRequests();
			} else {
				alert('Failed to update request status');
			}
		} catch (error) {
			console.error('Failed to update request:', error);
			alert('Failed to update request status');
		}
	}
	
	function getStatusBadgeClass(status: string): string {
		switch (status.toLowerCase()) {
			case 'approved':
			case 'completed':
				return 'badge-success';
			case 'pending':
				return 'badge-warning';
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
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString();
	}
	
	// Filter requests based on search and filters
	$: filteredRequests = requests.filter(request => {
		const matchesSearch = !searchTerm || 
			request.requester_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			request.request_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
			request.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
			request.asset_type.toLowerCase().includes(searchTerm.toLowerCase());
			
		const matchesStatus = !selectedStatus || request.status === selectedStatus;
		const matchesPriority = !selectedPriority || request.priority === selectedPriority;
		
		return matchesSearch && matchesStatus && matchesPriority;
	});
</script>

<svelte:head>
	<title>Requests - National Group India IT Asset Tracker</title>
</svelte:head>

<div class="requests-page">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-3xl font-bold mb-2">Asset Requests</h1>
			<p class="text-secondary">Manage IT asset requests from employees</p>
		</div>
		<a href="/requests/new" class="btn btn-primary">
			<span>➕</span>
			New Request
		</a>
	</div>

	<!-- Request Processing Information -->
	<div class="card mb-6 request-info-panel">
		<div class="card-body">
			<div class="flex items-start gap-4">
				<div class="info-icon">
					<span>ℹ️</span>
				</div>
				<div class="info-content">
					<h3 class="text-lg font-semibold mb-3 text-primary">Request Processing Information</h3>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div class="info-item">
							<div class="info-item-icon">👥</div>
							<div>
								<h4 class="font-medium mb-1">Review Process</h4>
								<p class="text-sm text-secondary">All requests are reviewed by IT management</p>
							</div>
						</div>
						<div class="info-item">
							<div class="info-item-icon">⏱️</div>
							<div>
								<h4 class="font-medium mb-1">Processing Time</h4>
								<p class="text-sm text-secondary">Standard requests processed within 6-10 business days</p>
							</div>
						</div>
						<div class="info-item">
							<div class="info-item-icon">📧</div>
							<div>
								<h4 class="font-medium mb-1">Status Updates</h4>
								<p class="text-sm text-secondary">You'll receive email updates on request status</p>
							</div>
						</div>
					</div>
				</div>
			</div>
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
						placeholder="Search requests..."
						bind:value={searchTerm}
					>
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
				<div>
					<label class="form-label">Priority</label>
					<select class="form-select" bind:value={selectedPriority}>
						<option value="">All Priorities</option>
						{#each priorities as priority}
							<option value={priority}>{priority}</option>
						{/each}
					</select>
				</div>
				<div class="flex items-end">
					<button 
						class="btn btn-secondary w-full"
						on:click={() => {
							searchTerm = '';
							selectedStatus = '';
							selectedPriority = '';
						}}
					>
						Clear Filters
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Requests Table -->
	<div class="card">
		<div class="card-header">
			<div class="flex items-center justify-between">
				<h2 class="text-xl font-semibold">
					Requests ({filteredRequests.length})
				</h2>
				<button class="btn btn-sm btn-secondary" on:click={fetchRequests}>
					<span>🔄</span>
					Refresh
				</button>
			</div>
		</div>
		
		{#if loading}
			<div class="card-body">
				<div class="flex items-center justify-center py-8">
					<div class="loading"></div>
					<span class="ml-2">Loading requests...</span>
				</div>
			</div>
		{:else if filteredRequests.length === 0}
			<div class="card-body">
				<div class="text-center py-8">
					<div class="text-6xl mb-4">📝</div>
					<h3 class="text-xl font-semibold mb-2">No requests found</h3>
					<p class="text-secondary mb-4">
						{requests.length === 0 
							? "No asset requests have been submitted yet."
							: "Try adjusting your search criteria."}
					</p>
					<a href="/requests/new" class="btn btn-primary">
						<span>➕</span>
						Create Request
					</a>
				</div>
			</div>
		{:else}
			<div class="card-body p-0">
				<div class="table-container">
					<table class="table">
						<thead>
							<tr>
								<th>Request ID</th>
								<th>Requester</th>
								<th>Department</th>
								<th>Asset Type</th>
								<th>Priority</th>
								<th>Status</th>
								<th>Request Date</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredRequests as request}
								<tr>
									<td class="font-medium">{request.request_id}</td>
									<td>
										<div>
											<div class="font-medium">{request.requester_name}</div>
											<div class="text-sm text-secondary">{request.requester_email}</div>
										</div>
									</td>
									<td>{request.department}</td>
									<td>{request.asset_type}</td>
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
									<td>{formatDate(request.request_date)}</td>
									<td>
										<div class="flex gap-2">
											{#if request.status === 'Pending'}
												<button 
													class="btn btn-sm btn-success"
													title="Approve"
													on:click={() => updateRequestStatus(request.id, 'Approved')}
												>
													✅
												</button>
												<button 
													class="btn btn-sm btn-danger"
													title="Reject"
													on:click={() => updateRequestStatus(request.id, 'Rejected')}
												>
													❌
												</button>
											{:else if request.status === 'Approved'}
												<button 
													class="btn btn-sm btn-primary"
													title="Mark as Completed"
													on:click={() => updateRequestStatus(request.id, 'Completed')}
												>
													✅ Complete
												</button>
											{/if}
											<button 
												class="btn btn-sm btn-secondary"
												title="View Details"
												on:click={() => {
													alert(`Request Details:\n\nDescription: ${request.description}\nNotes: ${request.notes || 'None'}`);
												}}
											>
												👁️
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
	.requests-page {
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
		
		.md\\:grid-cols-3 {
			grid-template-columns: repeat(3, minmax(0, 1fr));
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
	
	.w-full {
		width: 100%;
	}
	
	/* Request Info Panel Styles */
	.request-info-panel {
		background: linear-gradient(135deg, #f8f6f0 0%, #e8e6e0 100%);
		border: 1px solid #d4af37;
		border-left: 4px solid #d4af37;
	}
	
	.info-icon {
		font-size: 24px;
		padding: 8px;
		background: rgba(212, 175, 55, 0.1);
		border-radius: 50%;
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	
	.info-content {
		flex: 1;
	}
	
	.info-item {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 16px;
		background: rgba(255, 255, 255, 0.6);
		border-radius: 8px;
		border: 1px solid rgba(212, 175, 55, 0.2);
		transition: all 0.3s ease;
	}
	
	.info-item:hover {
		background: rgba(255, 255, 255, 0.8);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(212, 175, 55, 0.15);
	}
	
	.info-item-icon {
		font-size: 20px;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(212, 175, 55, 0.1);
		border-radius: 6px;
		flex-shrink: 0;
	}
	
	.info-item h4 {
		color: #333;
		margin: 0;
	}
	
	.info-item p {
		margin: 0;
		line-height: 1.4;
	}
	
	@media (max-width: 768px) {
		.info-content .grid {
			grid-template-columns: 1fr;
			gap: 12px;
		}
		
		.info-item {
			padding: 12px;
		}
		
		.flex.items-start {
			flex-direction: column;
			gap: 16px;
		}
		
		.info-icon {
			align-self: center;
		}
	}
</style>
