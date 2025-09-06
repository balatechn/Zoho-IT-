<script lang="ts">
	import { onMount } from 'svelte';
	
	interface Assignment {
		id: number;
		asset_id: number;
		assigned_to: string;
		assigned_to_email: string;
		assigned_to_department: string;
		assigned_to_employee_id: string;
		assignment_date: string;
		location: string;
		purpose: string;
		expected_return_date: string;
		notes: string;
		assigned_by: string;
		status: string;
		created_at: string;
		returned_at: string;
		asset_name: string;
		asset_tag: string;
		category: string;
	}
	
	let assignments: Assignment[] = [];
	let loading = true;
	let searchTerm = '';
	let selectedStatus = '';
	let selectedDepartment = '';
	
	const statuses = ['Active', 'Returned'];
	const departments = [
		'IT', 'Human Resources', 'Finance', 'Marketing', 
		'Sales', 'Operations', 'Legal', 'Customer Service'
	];
	
	onMount(async () => {
		await fetchAssignments();
	});
	
	async function fetchAssignments() {
		loading = true;
		try {
			const response = await fetch('http://localhost:3001/api/assignments');
			if (response.ok) {
				assignments = await response.json();
			}
		} catch (error) {
			console.error('Failed to fetch assignments:', error);
		} finally {
			loading = false;
		}
	}
	
	async function markAsReturned(assignmentId: number) {
		const returnNotes = prompt('Enter return notes (optional):');
		if (returnNotes === null) return; // User cancelled
		
		try {
			const response = await fetch(`http://localhost:3001/api/assignments/${assignmentId}/return`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					return_notes: returnNotes
				})
			});
			
			if (response.ok) {
				// Also need to update the asset status back to "Available"
				const assignment = assignments.find(a => a.id === assignmentId);
				if (assignment) {
					await fetch(`http://localhost:3001/api/assets/${assignment.asset_id}`, {
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							status: 'Available',
							assigned_to: '',
							notes: `Returned on ${new Date().toISOString().split('T')[0]}`
						})
					});
				}
				
				await fetchAssignments();
				alert('Asset marked as returned successfully!');
			} else {
				alert('Failed to mark asset as returned');
			}
		} catch (error) {
			console.error('Failed to mark as returned:', error);
			alert('Failed to mark asset as returned');
		}
	}
	
	function getStatusBadgeClass(status: string): string {
		switch (status.toLowerCase()) {
			case 'active':
				return 'badge-warning';
			case 'returned':
				return 'badge-success';
			default:
				return 'badge-info';
		}
	}
	
	function formatDate(dateString: string): string {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString();
	}
	
	function isOverdue(assignment: Assignment): boolean {
		if (!assignment.expected_return_date || assignment.status !== 'Active') return false;
		const returnDate = new Date(assignment.expected_return_date);
		const today = new Date();
		return returnDate < today;
	}
	
	// Filter assignments based on search and filters
	$: filteredAssignments = assignments.filter(assignment => {
		const matchesSearch = !searchTerm || 
			assignment.assigned_to.toLowerCase().includes(searchTerm.toLowerCase()) ||
			assignment.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			assignment.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
			assignment.assigned_to_employee_id.toLowerCase().includes(searchTerm.toLowerCase());
			
		const matchesStatus = !selectedStatus || assignment.status === selectedStatus;
		const matchesDepartment = !selectedDepartment || assignment.assigned_to_department === selectedDepartment;
		
		return matchesSearch && matchesStatus && matchesDepartment;
	});
</script>

<svelte:head>
	<title>Assignments - National Group India IT Asset Tracker</title>
</svelte:head>

<div class="assignments-page">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-3xl font-bold mb-2">Asset Assignments</h1>
			<p class="text-secondary">Track asset assignments and returns</p>
		</div>
		<a href="/assets/assign" class="btn btn-primary">
			<span>✍️</span>
			New Assignment
		</a>
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
						placeholder="Search assignments..."
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
					<label class="form-label">Department</label>
					<select class="form-select" bind:value={selectedDepartment}>
						<option value="">All Departments</option>
						{#each departments as department}
							<option value={department}>{department}</option>
						{/each}
					</select>
				</div>
				<div class="flex items-end">
					<button 
						class="btn btn-secondary w-full"
						on:click={() => {
							searchTerm = '';
							selectedStatus = '';
							selectedDepartment = '';
						}}
					>
						Clear Filters
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Assignment Statistics -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
		<div class="stat-card">
			<div class="stat-icon">📋</div>
			<div class="stat-content">
				<div class="stat-value">{assignments.filter(a => a.status === 'Active').length}</div>
				<div class="stat-label">Active Assignments</div>
			</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon">✅</div>
			<div class="stat-content">
				<div class="stat-value">{assignments.filter(a => a.status === 'Returned').length}</div>
				<div class="stat-label">Returned Assets</div>
			</div>
		</div>
		<div class="stat-card overdue">
			<div class="stat-icon">⚠️</div>
			<div class="stat-content">
				<div class="stat-value">{assignments.filter(a => isOverdue(a)).length}</div>
				<div class="stat-label">Overdue Returns</div>
			</div>
		</div>
	</div>

	<!-- Assignments Table -->
	<div class="card">
		<div class="card-header">
			<h2 class="text-xl font-semibold">Assignment Records</h2>
			<div class="text-sm text-secondary">
				Total: {filteredAssignments.length} assignments
			</div>
		</div>
		<div class="card-body">
			{#if loading}
				<div class="loading-container">
					<div class="loading"></div>
					<p>Loading assignments...</p>
				</div>
			{:else if filteredAssignments.length === 0}
				<div class="empty-state">
					<div class="empty-icon">📋</div>
					<h3>No assignments found</h3>
					<p>No asset assignments match your current filters.</p>
				</div>
			{:else}
				<div class="table-container">
					<table class="table">
						<thead>
							<tr>
								<th>Asset</th>
								<th>Assigned To</th>
								<th>Department</th>
								<th>Assignment Date</th>
								<th>Expected Return</th>
								<th>Status</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredAssignments as assignment (assignment.id)}
								<tr class={isOverdue(assignment) ? 'overdue-row' : ''}>
									<td>
										<div class="asset-info">
											<div class="font-medium">{assignment.asset_name}</div>
											<div class="text-sm text-secondary">
												{assignment.asset_tag} • {assignment.category}
											</div>
										</div>
									</td>
									<td>
										<div class="employee-info">
											<div class="font-medium">{assignment.assigned_to}</div>
											<div class="text-sm text-secondary">
												{assignment.assigned_to_employee_id}
											</div>
											<div class="text-sm text-secondary">
												{assignment.assigned_to_email}
											</div>
										</div>
									</td>
									<td>
										<span class="department-badge">
											{assignment.assigned_to_department}
										</span>
									</td>
									<td>{formatDate(assignment.assignment_date)}</td>
									<td>
										{#if assignment.expected_return_date}
											<span class={isOverdue(assignment) ? 'text-danger font-medium' : ''}>
												{formatDate(assignment.expected_return_date)}
												{#if isOverdue(assignment)}
													<br><small>(Overdue)</small>
												{/if}
											</span>
										{:else}
											<span class="text-secondary">No date set</span>
										{/if}
									</td>
									<td>
										<span class="badge {getStatusBadgeClass(assignment.status)}">
											{assignment.status}
										</span>
									</td>
									<td>
										<div class="flex gap-2">
											{#if assignment.status === 'Active'}
												<button 
													class="btn btn-sm btn-warning"
													on:click={() => markAsReturned(assignment.id)}
													title="Mark as returned"
												>
													📥 Return
												</button>
											{/if}
											<button 
												class="btn btn-sm btn-secondary"
												on:click={() => {
													// Show assignment details in a modal or navigate to details page
													alert(`Assignment Details:\n\nPurpose: ${assignment.purpose}\nLocation: ${assignment.location}\nNotes: ${assignment.notes || 'None'}`);
												}}
												title="View details"
											>
												👁️ View
											</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.assignments-page {
		max-width: 100%;
	}
	
	.grid {
		display: grid;
	}
	
	.grid-cols-1 {
		grid-template-columns: repeat(1, minmax(0, 1fr));
	}
	
	@media (min-width: 768px) {
		.md\\:grid-cols-3 {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
		
		.md\\:grid-cols-4 {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}
	
	.stat-card {
		background: linear-gradient(135deg, #fffef9 0%, #fefdfb 100%);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		padding: 1.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		transition: all 0.3s ease;
	}
	
	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(184, 134, 11, 0.15);
	}
	
	.stat-card.overdue {
		border-color: #dc2626;
		background: linear-gradient(135deg, #fef2f2 0%, #fef1f1 100%);
	}
	
	.stat-icon {
		font-size: 2rem;
		opacity: 0.8;
	}
	
	.stat-content {
		flex: 1;
	}
	
	.stat-value {
		font-size: 2rem;
		font-weight: bold;
		color: var(--text-gold);
	}
	
	.stat-label {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}
	
	.asset-info {
		min-width: 0;
	}
	
	.employee-info {
		min-width: 0;
	}
	
	.department-badge {
		background: var(--gradient-primary);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;
	}
	
	.overdue-row {
		background-color: rgba(220, 38, 38, 0.05);
	}
	
	.overdue-row:hover {
		background-color: rgba(220, 38, 38, 0.1);
	}
	
	.text-danger {
		color: #dc2626;
	}
	
	.table-container {
		overflow-x: auto;
	}
	
	.table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
	}
	
	.table th,
	.table td {
		padding: 1rem;
		text-align: left;
		border-bottom: 1px solid var(--border-color);
	}
	
	.table th {
		background: var(--gradient-primary);
		color: white;
		font-weight: 600;
		position: sticky;
		top: 0;
		z-index: 10;
	}
	
	.table tbody tr:hover {
		background-color: rgba(184, 134, 11, 0.05);
	}
	
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		gap: 1rem;
	}
	
	.empty-state {
		text-align: center;
		padding: 3rem;
	}
	
	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}
	
	.empty-state h3 {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: var(--text-primary);
	}
	
	.empty-state p {
		color: var(--text-secondary);
	}
	
	.text-secondary {
		color: var(--text-secondary);
	}
	
	.flex {
		display: flex;
	}
	
	.items-center {
		align-items: center;
	}
	
	.items-end {
		align-items: flex-end;
	}
	
	.justify-between {
		justify-content: space-between;
	}
	
	.gap-2 {
		gap: 0.5rem;
	}
	
	.gap-4 {
		gap: 1rem;
	}
	
	.gap-6 {
		gap: 1.5rem;
	}
	
	.w-full {
		width: 100%;
	}
	
	.mb-6 {
		margin-bottom: 1.5rem;
	}
	
	.font-medium {
		font-weight: 500;
	}
	
	.text-sm {
		font-size: 0.875rem;
	}
</style>
