<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	
	interface Asset {
		id: number;
		asset_tag: string;
		name: string;
		category: string;
		brand: string;
		model: string;
		status: string;
	}
	
	interface AssignmentForm {
		asset_id: string;
		assigned_to: string;
		assigned_to_email: string;
		assigned_to_department: string;
		assigned_to_employee_id: string;
		assignment_date: string;
		location: string;
		purpose: string;
		expected_return_date: string;
		terms_and_conditions: boolean;
		notes: string;
		assignee_signature: string;
		assigned_by: string;
		assigned_by_signature: string;
	}
	
	let assets: Asset[] = [];
	let loading = false;
	let submitting = false;
	let errors: Record<string, string> = {};
	let signaturePad: HTMLCanvasElement;
	let assignedBySignaturePad: HTMLCanvasElement;
	let isDrawing = false;
	let isDrawingAssignedBy = false;
	
	let formData: AssignmentForm = {
		asset_id: '',
		assigned_to: '',
		assigned_to_email: '',
		assigned_to_department: '',
		assigned_to_employee_id: '',
		assignment_date: new Date().toISOString().split('T')[0],
		location: '',
		purpose: '',
		expected_return_date: '',
		terms_and_conditions: false,
		notes: '',
		assignee_signature: '',
		assigned_by: '',
		assigned_by_signature: ''
	};
	
	const departments = [
		'IT', 'Human Resources', 'Finance', 'Marketing', 
		'Sales', 'Operations', 'Legal', 'Customer Service'
	];
	
	onMount(async () => {
		await fetchAvailableAssets();
		setupSignaturePads();
	});
	
	async function fetchAvailableAssets() {
		loading = true;
		try {
			const response = await fetch('http://localhost:3001/api/assets');
			if (response.ok) {
				const allAssets = await response.json();
				// Filter only available assets
				assets = allAssets.filter((asset: Asset) => asset.status === 'Available');
			}
		} catch (error) {
			console.error('Failed to fetch assets:', error);
		} finally {
			loading = false;
		}
	}
	
	function setupSignaturePads() {
		// Setup assignee signature pad
		if (signaturePad) {
			const ctx = signaturePad.getContext('2d');
			if (ctx) {
				ctx.strokeStyle = '#b8860b';
				ctx.lineWidth = 2;
				ctx.lineCap = 'round';
			}
		}
		
		// Setup assigned by signature pad
		if (assignedBySignaturePad) {
			const ctx = assignedBySignaturePad.getContext('2d');
			if (ctx) {
				ctx.strokeStyle = '#b8860b';
				ctx.lineWidth = 2;
				ctx.lineCap = 'round';
			}
		}
	}
	
	function startDrawing(event: MouseEvent, canvas: HTMLCanvasElement, isAssignedBy = false) {
		if (isAssignedBy) {
			isDrawingAssignedBy = true;
		} else {
			isDrawing = true;
		}
		
		const rect = canvas.getBoundingClientRect();
		const ctx = canvas.getContext('2d');
		if (ctx) {
			ctx.beginPath();
			ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
		}
	}
	
	function draw(event: MouseEvent, canvas: HTMLCanvasElement, isAssignedBy = false) {
		if ((!isDrawing && !isAssignedBy) || (!isDrawingAssignedBy && isAssignedBy)) return;
		
		const rect = canvas.getBoundingClientRect();
		const ctx = canvas.getContext('2d');
		if (ctx) {
			ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
			ctx.stroke();
		}
	}
	
	function stopDrawing(isAssignedBy = false) {
		if (isAssignedBy) {
			isDrawingAssignedBy = false;
			if (assignedBySignaturePad) {
				formData.assigned_by_signature = assignedBySignaturePad.toDataURL();
			}
		} else {
			isDrawing = false;
			if (signaturePad) {
				formData.assignee_signature = signaturePad.toDataURL();
			}
		}
	}
	
	function clearSignature(isAssignedBy = false) {
		const canvas = isAssignedBy ? assignedBySignaturePad : signaturePad;
		if (canvas) {
			const ctx = canvas.getContext('2d');
			if (ctx) {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				if (isAssignedBy) {
					formData.assigned_by_signature = '';
				} else {
					formData.assignee_signature = '';
				}
			}
		}
	}
	
	function validateForm(): boolean {
		errors = {};
		
		if (!formData.asset_id) {
			errors.asset_id = 'Please select an asset';
		}
		
		if (!formData.assigned_to.trim()) {
			errors.assigned_to = 'Assignee name is required';
		}
		
		if (!formData.assigned_to_email.trim()) {
			errors.assigned_to_email = 'Email is required';
		} else if (!isValidEmail(formData.assigned_to_email)) {
			errors.assigned_to_email = 'Please enter a valid email address';
		}
		
		if (!formData.assigned_to_department) {
			errors.assigned_to_department = 'Department is required';
		}
		
		if (!formData.assigned_to_employee_id.trim()) {
			errors.assigned_to_employee_id = 'Employee ID is required';
		}
		
		if (!formData.location.trim()) {
			errors.location = 'Location is required';
		}
		
		if (!formData.purpose.trim()) {
			errors.purpose = 'Purpose is required';
		}
		
		if (!formData.terms_and_conditions) {
			errors.terms_and_conditions = 'Please accept the terms and conditions';
		}
		
		if (!formData.assignee_signature) {
			errors.assignee_signature = 'Assignee signature is required';
		}
		
		if (!formData.assigned_by.trim()) {
			errors.assigned_by = 'Assigned by name is required';
		}
		
		if (!formData.assigned_by_signature) {
			errors.assigned_by_signature = 'Assigned by signature is required';
		}
		
		if (formData.assignment_date && formData.expected_return_date) {
			const assignmentDate = new Date(formData.assignment_date);
			const returnDate = new Date(formData.expected_return_date);
			
			if (returnDate < assignmentDate) {
				errors.expected_return_date = 'Return date cannot be before assignment date';
			}
		}
		
		return Object.keys(errors).length === 0;
	}
	
	function isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}
	
	async function handleSubmit() {
		if (!validateForm()) return;
		
		submitting = true;
		
		try {
			// First, save the assignment record
			const assignmentResponse = await fetch('http://localhost:3001/api/assignments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					asset_id: parseInt(formData.asset_id),
					assigned_to: formData.assigned_to,
					assigned_to_email: formData.assigned_to_email,
					assigned_to_department: formData.assigned_to_department,
					assigned_to_employee_id: formData.assigned_to_employee_id,
					assignment_date: formData.assignment_date,
					location: formData.location,
					purpose: formData.purpose,
					expected_return_date: formData.expected_return_date || null,
					terms_and_conditions: formData.terms_and_conditions,
					notes: formData.notes,
					assignee_signature: formData.assignee_signature,
					assigned_by: formData.assigned_by,
					assigned_by_signature: formData.assigned_by_signature
				})
			});
			
			if (!assignmentResponse.ok) {
				const error = await assignmentResponse.json();
				throw new Error(error.error || 'Failed to create assignment');
			}
			
			// Then update the asset status to "Assigned"
			const updateResponse = await fetch(`http://localhost:3001/api/assets/${formData.asset_id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					status: 'Assigned',
					assigned_to: formData.assigned_to,
					location: formData.location,
					notes: `Assigned on ${formData.assignment_date} for: ${formData.purpose}`
				})
			});
			
			if (updateResponse.ok) {
				alert('Asset assigned successfully!');
				await goto('/assets');
			} else {
				const error = await updateResponse.json();
				alert('Assignment saved but failed to update asset status: ' + error.error);
			}
		} catch (error) {
			console.error('Failed to assign asset:', error);
			alert('Failed to assign asset: ' + error.message);
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Asset Assignment - Zoho-IT Asset Tracker</title>
</svelte:head>

<div class="assignment-page">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-3xl font-bold mb-2">Asset Assignment Form</h1>
			<p class="text-secondary">Assign IT assets to employees with digital signatures</p>
		</div>
		<a href="/assets" class="btn btn-secondary">
			<span>←</span>
			Back to Assets
		</a>
	</div>

	<!-- Form -->
	<div class="card">
		<div class="card-header">
			<h2 class="text-xl font-semibold">📋 Assignment Details</h2>
		</div>
		<div class="card-body">
			<form on:submit|preventDefault={handleSubmit}>
				<!-- Asset Selection -->
				<div class="form-section">
					<h3 class="section-title">Asset Information</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div class="form-group">
							<label class="form-label" for="asset_id">
								Select Asset *
							</label>
							<select 
								id="asset_id"
								class="form-select {errors.asset_id ? 'error' : ''}"
								bind:value={formData.asset_id}
								required
							>
								<option value="">Choose an available asset</option>
								{#each assets as asset}
									<option value={asset.id}>
										{asset.asset_tag} - {asset.name} ({asset.category})
									</option>
								{/each}
							</select>
							{#if errors.asset_id}
								<div class="form-error">{errors.asset_id}</div>
							{/if}
							{#if loading}
								<div class="text-sm text-secondary mt-1">Loading available assets...</div>
							{/if}
						</div>

						<div class="form-group">
							<label class="form-label" for="assignment_date">
								Assignment Date *
							</label>
							<input 
								type="date" 
								id="assignment_date"
								class="form-input"
								bind:value={formData.assignment_date}
								required
							>
						</div>
					</div>
				</div>

				<!-- Assignee Information -->
				<div class="form-section">
					<h3 class="section-title">Employee Information</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div class="form-group">
							<label class="form-label" for="assigned_to">
								Employee Name *
							</label>
							<input 
								type="text" 
								id="assigned_to"
								class="form-input {errors.assigned_to ? 'error' : ''}"
								bind:value={formData.assigned_to}
								placeholder="e.g., John Doe"
								required
							>
							{#if errors.assigned_to}
								<div class="form-error">{errors.assigned_to}</div>
							{/if}
						</div>

						<div class="form-group">
							<label class="form-label" for="assigned_to_email">
								Email Address *
							</label>
							<input 
								type="email" 
								id="assigned_to_email"
								class="form-input {errors.assigned_to_email ? 'error' : ''}"
								bind:value={formData.assigned_to_email}
								placeholder="e.g., john.doe@company.com"
								required
							>
							{#if errors.assigned_to_email}
								<div class="form-error">{errors.assigned_to_email}</div>
							{/if}
						</div>

						<div class="form-group">
							<label class="form-label" for="assigned_to_department">
								Department *
							</label>
							<select 
								id="assigned_to_department"
								class="form-select {errors.assigned_to_department ? 'error' : ''}"
								bind:value={formData.assigned_to_department}
								required
							>
								<option value="">Select Department</option>
								{#each departments as department}
									<option value={department}>{department}</option>
								{/each}
							</select>
							{#if errors.assigned_to_department}
								<div class="form-error">{errors.assigned_to_department}</div>
							{/if}
						</div>

						<div class="form-group">
							<label class="form-label" for="assigned_to_employee_id">
								Employee ID *
							</label>
							<input 
								type="text" 
								id="assigned_to_employee_id"
								class="form-input {errors.assigned_to_employee_id ? 'error' : ''}"
								bind:value={formData.assigned_to_employee_id}
								placeholder="e.g., EMP001"
								required
							>
							{#if errors.assigned_to_employee_id}
								<div class="form-error">{errors.assigned_to_employee_id}</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Assignment Details -->
				<div class="form-section">
					<h3 class="section-title">Assignment Details</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div class="form-group">
							<label class="form-label" for="location">
								Location *
							</label>
							<input 
								type="text" 
								id="location"
								class="form-input {errors.location ? 'error' : ''}"
								bind:value={formData.location}
								placeholder="e.g., Office 101, Building A"
								required
							>
							{#if errors.location}
								<div class="form-error">{errors.location}</div>
							{/if}
						</div>

						<div class="form-group">
							<label class="form-label" for="expected_return_date">
								Expected Return Date
							</label>
							<input 
								type="date" 
								id="expected_return_date"
								class="form-input {errors.expected_return_date ? 'error' : ''}"
								bind:value={formData.expected_return_date}
							>
							{#if errors.expected_return_date}
								<div class="form-error">{errors.expected_return_date}</div>
							{/if}
						</div>
					</div>

					<div class="form-group">
						<label class="form-label" for="purpose">
							Purpose of Assignment *
						</label>
						<textarea 
							id="purpose"
							class="form-textarea {errors.purpose ? 'error' : ''}"
							bind:value={formData.purpose}
							placeholder="Describe the purpose for which this asset is being assigned..."
							rows="3"
							required
						></textarea>
						{#if errors.purpose}
							<div class="form-error">{errors.purpose}</div>
						{/if}
					</div>

					<div class="form-group">
						<label class="form-label" for="notes">
							Additional Notes
						</label>
						<textarea 
							id="notes"
							class="form-textarea"
							bind:value={formData.notes}
							placeholder="Any additional notes or special instructions..."
							rows="2"
						></textarea>
					</div>
				</div>

				<!-- Terms and Conditions -->
				<div class="form-section">
					<h3 class="section-title">Terms & Conditions</h3>
					<div class="terms-box">
						<div class="terms-content">
							<h4 class="font-semibold mb-2">Asset Assignment Agreement</h4>
							<ul class="terms-list">
								<li>I acknowledge receipt of the above-mentioned asset in good working condition.</li>
								<li>I agree to use this asset solely for business purposes.</li>
								<li>I will be responsible for the proper care and maintenance of this asset.</li>
								<li>I will immediately report any damage, loss, or theft to the IT department.</li>
								<li>I agree to return this asset in good condition when requested or upon termination of employment.</li>
								<li>I understand that I may be held financially responsible for any damage or loss due to negligence.</li>
							</ul>
						</div>
						<div class="form-group mt-4">
							<label class="checkbox-label">
								<input 
									type="checkbox" 
									bind:checked={formData.terms_and_conditions}
									class="checkbox {errors.terms_and_conditions ? 'error' : ''}"
								>
								<span class="checkmark"></span>
								I have read and agree to the above terms and conditions *
							</label>
							{#if errors.terms_and_conditions}
								<div class="form-error">{errors.terms_and_conditions}</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Signatures -->
				<div class="form-section">
					<h3 class="section-title">Digital Signatures</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<!-- Assignee Signature -->
						<div class="signature-group">
							<label class="form-label">
								Employee Signature *
							</label>
							<div class="signature-container {errors.assignee_signature ? 'error' : ''}">
								<canvas 
									bind:this={signaturePad}
									width="400" 
									height="150"
									class="signature-pad"
									on:mousedown={(e) => startDrawing(e, signaturePad)}
									on:mousemove={(e) => draw(e, signaturePad)}
									on:mouseup={() => stopDrawing()}
									on:mouseleave={() => stopDrawing()}
								></canvas>
								<div class="signature-controls">
									<button 
										type="button" 
										class="btn btn-sm btn-secondary"
										on:click={() => clearSignature()}
									>
										Clear
									</button>
								</div>
							</div>
							{#if errors.assignee_signature}
								<div class="form-error">{errors.assignee_signature}</div>
							{/if}
						</div>

						<!-- Assigned By Signature -->
						<div class="signature-group">
							<div class="form-group">
								<label class="form-label" for="assigned_by">
									Assigned By (Name) *
								</label>
								<input 
									type="text" 
									id="assigned_by"
									class="form-input {errors.assigned_by ? 'error' : ''}"
									bind:value={formData.assigned_by}
									placeholder="e.g., IT Manager"
									required
								>
								{#if errors.assigned_by}
									<div class="form-error">{errors.assigned_by}</div>
								{/if}
							</div>
							
							<label class="form-label">
								Authorized Signature *
							</label>
							<div class="signature-container {errors.assigned_by_signature ? 'error' : ''}">
								<canvas 
									bind:this={assignedBySignaturePad}
									width="400" 
									height="150"
									class="signature-pad"
									on:mousedown={(e) => startDrawing(e, assignedBySignaturePad, true)}
									on:mousemove={(e) => draw(e, assignedBySignaturePad, true)}
									on:mouseup={() => stopDrawing(true)}
									on:mouseleave={() => stopDrawing(true)}
								></canvas>
								<div class="signature-controls">
									<button 
										type="button" 
										class="btn btn-sm btn-secondary"
										on:click={() => clearSignature(true)}
									>
										Clear
									</button>
								</div>
							</div>
							{#if errors.assigned_by_signature}
								<div class="form-error">{errors.assigned_by_signature}</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Submit Buttons -->
				<div class="flex gap-4 mt-8">
					<button 
						type="submit" 
						class="btn btn-primary"
						disabled={submitting}
					>
						{#if submitting}
							<div class="loading"></div>
						{:else}
							<span>✍️</span>
						{/if}
						{submitting ? 'Processing...' : 'Complete Assignment'}
					</button>
					
					<a href="/assets" class="btn btn-secondary">
						Cancel
					</a>
				</div>
			</form>
		</div>
	</div>
</div>

<style>
	.assignment-page {
		max-width: 100%;
	}
	
	.form-section {
		margin-bottom: 2rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid var(--border-color);
	}
	
	.form-section:last-of-type {
		border-bottom: none;
	}
	
	.section-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-gold);
		margin-bottom: 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.section-title::before {
		content: '';
		width: 4px;
		height: 1.5rem;
		background: var(--gradient-primary);
		border-radius: 2px;
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
	}
	
	.terms-box {
		background: linear-gradient(135deg, #fffef9 0%, #fefdfb 100%);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		padding: 1.5rem;
	}
	
	.terms-content {
		margin-bottom: 1rem;
	}
	
	.terms-list {
		list-style: none;
		padding: 0;
	}
	
	.terms-list li {
		padding: 0.5rem 0;
		padding-left: 1.5rem;
		position: relative;
		color: var(--text-secondary);
	}
	
	.terms-list li::before {
		content: '•';
		color: var(--text-gold);
		font-weight: bold;
		position: absolute;
		left: 0;
	}
	
	.checkbox-label {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		cursor: pointer;
		font-weight: 500;
	}
	
	.checkbox {
		width: 1.25rem;
		height: 1.25rem;
		border: 2px solid var(--border-color);
		border-radius: 4px;
		background: white;
		cursor: pointer;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}
	
	.checkbox:checked {
		background: var(--gradient-primary);
		border-color: var(--primary-color);
	}
	
	.signature-group {
		margin-bottom: 1rem;
	}
	
	.signature-container {
		border: 2px solid var(--border-color);
		border-radius: var(--border-radius);
		background: white;
		position: relative;
		overflow: hidden;
	}
	
	.signature-container.error {
		border-color: #dc2626;
	}
	
	.signature-pad {
		display: block;
		cursor: crosshair;
		background: white;
	}
	
	.signature-controls {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
	}
	
	.text-secondary {
		color: var(--text-secondary);
	}
	
	.form-error {
		color: #dc2626;
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}
	
	.form-input.error,
	.form-select.error,
	.form-textarea.error {
		border-color: #dc2626;
		box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
	}
</style>
