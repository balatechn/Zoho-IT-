<script lang="ts">
	import { goto } from '$app/navigation';
	import { getApiUrl } from '$lib/api';
	
	interface RequestForm {
		requester_name: string;
		requester_email: string;
		department: string;
		asset_type: string;
		description: string;
		priority: string;
	}
	
	let formData: RequestForm = {
		requester_name: '',
		requester_email: '',
		department: '',
		asset_type: '',
		description: '',
		priority: 'Medium'
	};
	
	let loading = false;
	let errors: Record<string, string> = {};
	
	const departments = [
		'IT', 'Human Resources', 'Finance', 'Marketing', 
		'Sales', 'Operations', 'Legal', 'Customer Service'
	];
	
	const assetTypes = [
		'Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse', 
		'Printer', 'Scanner', 'Tablet', 'Phone', 'Server', 
		'Network Equipment', 'Software License', 'Other'
	];
	
	const priorities = ['Low', 'Medium', 'High'];
	
	function validateForm(): boolean {
		errors = {};
		
		if (!formData.requester_name.trim()) {
			errors.requester_name = 'Requester name is required';
		}
		
		if (!formData.requester_email.trim()) {
			errors.requester_email = 'Email is required';
		} else if (!isValidEmail(formData.requester_email)) {
			errors.requester_email = 'Please enter a valid email address';
		}
		
		if (!formData.department) {
			errors.department = 'Department is required';
		}
		
		if (!formData.asset_type) {
			errors.asset_type = 'Asset type is required';
		}
		
		if (!formData.description.trim()) {
			errors.description = 'Description is required';
		}
		
		return Object.keys(errors).length === 0;
	}
	
	function isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}
	
	async function handleSubmit() {
		if (!validateForm()) return;
		
		loading = true;
		
		try {
			const response = await fetch(getApiUrl('/api/requests'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(formData)
			});
			
			if (response.ok) {
				const result = await response.json();
				alert(`Request submitted successfully! Request ID: ${result.request_id}`);
				await goto('/requests');
			} else {
				const error = await response.json();
				alert('Failed to submit request: ' + error.error);
			}
		} catch (error) {
			console.error('Failed to submit request:', error);
			alert('Failed to submit request');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>New Request - National Group India IT Asset Tracker</title>
</svelte:head>

<div class="new-request-page">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-3xl font-bold mb-2">New Asset Request</h1>
			<p class="text-secondary">Submit a request for IT assets or equipment</p>
		</div>
		<a href="/requests" class="btn btn-secondary">
			<span>←</span>
			Back to Requests
		</a>
	</div>

	<!-- Processing Info -->
	<div class="card mb-6 processing-info-card">
		<div class="card-body">
			<div class="flex items-center gap-3 mb-4">
				<div class="info-icon">⏱️</div>
				<h3 class="text-lg font-semibold text-primary">Request Processing Timeline</h3>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="timeline-item">
					<div class="timeline-step">1</div>
					<div>
						<h4 class="font-medium">Review Process</h4>
						<p class="text-sm text-secondary">All requests are reviewed by IT management</p>
					</div>
				</div>
				<div class="timeline-item">
					<div class="timeline-step">2</div>
					<div>
						<h4 class="font-medium">Processing Time</h4>
						<p class="text-sm text-secondary">Standard requests processed within 6-10 business days</p>
					</div>
				</div>
				<div class="timeline-item">
					<div class="timeline-step">3</div>
					<div>
						<h4 class="font-medium">Status Updates</h4>
						<p class="text-sm text-secondary">You'll receive email updates on request status</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Form -->
	<div class="card">
		<div class="card-header">
			<h2 class="text-xl font-semibold">Request Information</h2>
		</div>
		<div class="card-body">
			<form on:submit|preventDefault={handleSubmit}>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<!-- Requester Name -->
					<div class="form-group">
						<label class="form-label" for="requester_name">
							Full Name *
						</label>
						<input 
							type="text" 
							id="requester_name"
							class="form-input {errors.requester_name ? 'error' : ''}"
							bind:value={formData.requester_name}
							placeholder="e.g., John Doe"
							required
						>
						{#if errors.requester_name}
							<div class="form-error">{errors.requester_name}</div>
						{/if}
					</div>

					<!-- Email -->
					<div class="form-group">
						<label class="form-label" for="requester_email">
							Email Address *
						</label>
						<input 
							type="email" 
							id="requester_email"
							class="form-input {errors.requester_email ? 'error' : ''}"
							bind:value={formData.requester_email}
							placeholder="e.g., john.doe@company.com"
							required
						>
						{#if errors.requester_email}
							<div class="form-error">{errors.requester_email}</div>
						{/if}
					</div>

					<!-- Department -->
					<div class="form-group">
						<label class="form-label" for="department">
							Department *
						</label>
						<select 
							id="department"
							class="form-select {errors.department ? 'error' : ''}"
							bind:value={formData.department}
							required
						>
							<option value="">Select Department</option>
							{#each departments as department}
								<option value={department}>{department}</option>
							{/each}
						</select>
						{#if errors.department}
							<div class="form-error">{errors.department}</div>
						{/if}
					</div>

					<!-- Asset Type -->
					<div class="form-group">
						<label class="form-label" for="asset_type">
							Asset Type *
						</label>
						<select 
							id="asset_type"
							class="form-select {errors.asset_type ? 'error' : ''}"
							bind:value={formData.asset_type}
							required
						>
							<option value="">Select Asset Type</option>
							{#each assetTypes as assetType}
								<option value={assetType}>{assetType}</option>
							{/each}
						</select>
						{#if errors.asset_type}
							<div class="form-error">{errors.asset_type}</div>
						{/if}
					</div>

					<!-- Priority -->
					<div class="form-group">
						<label class="form-label" for="priority">
							Priority
						</label>
						<select 
							id="priority"
							class="form-select"
							bind:value={formData.priority}
						>
							{#each priorities as priority}
								<option value={priority}>{priority}</option>
							{/each}
						</select>
						<div class="form-help">
							<small class="text-secondary">
								High: Urgent/Business critical • Medium: Standard request • Low: Nice to have
							</small>
						</div>
					</div>
				</div>

				<!-- Description -->
				<div class="form-group">
					<label class="form-label" for="description">
						Description / Justification *
					</label>
					<textarea 
						id="description"
						class="form-textarea {errors.description ? 'error' : ''}"
						bind:value={formData.description}
						placeholder="Please provide details about your request, including:&#10;• Specific requirements or specifications&#10;• Business justification&#10;• Timeline needs&#10;• Any other relevant information"
						rows="6"
						required
					></textarea>
					{#if errors.description}
						<div class="form-error">{errors.description}</div>
					{/if}
				</div>

				<!-- Submit Buttons -->
				<div class="flex gap-4 mt-6">
					<button 
						type="submit" 
						class="btn btn-primary"
						disabled={loading}
					>
						{#if loading}
							<div class="loading"></div>
						{:else}
							<span>📤</span>
						{/if}
						{loading ? 'Submitting...' : 'Submit Request'}
					</button>
					
					<a href="/requests" class="btn btn-secondary">
						Cancel
					</a>
				</div>
			</form>
		</div>
	</div>

	<!-- Help Section -->
	<div class="card mt-6">
		<div class="card-header">
			<h3 class="text-lg font-semibold">📋 Request Guidelines</h3>
		</div>
		<div class="card-body">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<h4 class="font-semibold mb-2">What to include in your request:</h4>
					<ul class="list-disc list-inside space-y-1 text-sm text-secondary">
						<li>Specific model or specifications if known</li>
						<li>Business reason for the request</li>
						<li>When you need the asset</li>
						<li>Any software requirements</li>
						<li>Location where asset will be used</li>
					</ul>
				</div>
				<div>
					<h4 class="font-semibold mb-2">Request processing:</h4>
					<ul class="list-disc list-inside space-y-1 text-sm text-secondary">
						<li>All requests are reviewed by IT management</li>
						<li>Standard requests processed within 6-10 business days</li>
						<li>High priority requests may be expedited</li>
						<li>You'll receive email updates on request status</li>
						<li>Approved requests will be prepared and assigned</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.new-request-page {
		max-width: 100%;
	}
	
	.grid {
		display: grid;
	}
	
	.grid-cols-1 {
		grid-template-columns: repeat(1, minmax(0, 1fr));
	}
	
	@media (min-width: 768px) {
		.md\\:grid-cols-2 {
			grid-template-columns: repeat(2, minmax(0, 1fr));
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
	
	.form-error {
		color: #dc2626;
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}
	
	.form-help {
		margin-top: 0.25rem;
	}
	
	.form-input.error,
	.form-select.error,
	.form-textarea.error {
		border-color: #dc2626;
		box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
	}
	
	.list-disc {
		list-style-type: disc;
	}
	
	.list-inside {
		list-style-position: inside;
	}
	
	.space-y-1 > * + * {
		margin-top: 0.25rem;
	}
	
	/* Processing Info Card Styles */
	.processing-info-card {
		background: linear-gradient(135deg, #e8f4fd 0%, #d1e9f8 100%);
		border: 1px solid #3b82f6;
		border-left: 4px solid #3b82f6;
	}
	
	.info-icon {
		font-size: 24px;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(59, 130, 246, 0.1);
		border-radius: 50%;
		flex-shrink: 0;
	}
	
	.timeline-item {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 16px;
		background: rgba(255, 255, 255, 0.7);
		border-radius: 8px;
		border: 1px solid rgba(59, 130, 246, 0.2);
		transition: all 0.3s ease;
	}
	
	.timeline-item:hover {
		background: rgba(255, 255, 255, 0.9);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
	}
	
	.timeline-step {
		width: 32px;
		height: 32px;
		background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		font-size: 14px;
		flex-shrink: 0;
	}
	
	.timeline-item h4 {
		margin: 0 0 4px 0;
		color: #333;
	}
	
	.timeline-item p {
		margin: 0;
		line-height: 1.4;
	}
	
	@media (max-width: 768px) {
		.processing-info-card .grid {
			grid-template-columns: 1fr;
			gap: 12px;
		}
		
		.timeline-item {
			padding: 12px;
		}
	}
</style>
