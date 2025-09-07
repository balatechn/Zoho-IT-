<script lang="ts">
	import { goto } from '$app/navigation';
	
	interface AssetForm {
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
	}
	
	let formData: AssetForm = {
		asset_tag: '',
		name: '',
		category: '',
		brand: '',
		model: '',
		serial_number: '',
		purchase_date: '',
		warranty_expiry: '',
		status: 'Available',
		location: '',
		assigned_to: '',
		notes: ''
	};
	
	let loading = false;
	let errors: Record<string, string> = {};
	
	const categories = [
		'Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse', 
		'Printer', 'Scanner', 'Tablet', 'Phone', 'Server', 
		'Network Equipment', 'Software License'
	];
	
	const statuses = ['Available', 'Assigned', 'Maintenance', 'Retired'];
	
	function validateForm(): boolean {
		errors = {};
		
		if (!formData.asset_tag.trim()) {
			errors.asset_tag = 'Asset tag is required';
		}
		
		if (!formData.name.trim()) {
			errors.name = 'Asset name is required';
		}
		
		if (!formData.category) {
			errors.category = 'Category is required';
		}
		
		if (formData.purchase_date && formData.warranty_expiry) {
			const purchaseDate = new Date(formData.purchase_date);
			const warrantyDate = new Date(formData.warranty_expiry);
			
			if (warrantyDate < purchaseDate) {
				errors.warranty_expiry = 'Warranty expiry cannot be before purchase date';
			}
		}
		
		return Object.keys(errors).length === 0;
	}
	
	async function handleSubmit() {
		if (!validateForm()) return;
		
		loading = true;
		
		try {
			const response = await fetch('http://localhost:3001/api/assets', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(formData)
			});
			
			if (response.ok) {
				const result = await response.json();
				await goto(`/assets/${result.id}`);
			} else {
				const error = await response.json();
				if (error.error.includes('UNIQUE constraint failed: assets.asset_tag')) {
					errors.asset_tag = 'Asset tag already exists';
				} else {
					alert('Failed to create asset: ' + error.error);
				}
			}
		} catch (error) {
			console.error('Failed to create asset:', error);
			alert('Failed to create asset');
		} finally {
			loading = false;
		}
	}
	
	function generateAssetTag() {
		const prefix = formData.category ? formData.category.substring(0, 3).toUpperCase() : 'AST';
		const timestamp = Date.now().toString().slice(-6);
		formData.asset_tag = `${prefix}-${timestamp}`;
	}
</script>

<svelte:head>
	<title>Add New Asset - National Group India IT Asset Tracker</title>
</svelte:head>

<div class="add-asset-page">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-3xl font-bold mb-2">Add New Asset</h1>
			<p class="text-secondary">Create a new IT asset record</p>
		</div>
		<a href="/assets" class="btn btn-secondary">
			<span>←</span>
			Back to Assets
		</a>
	</div>

	<!-- Form -->
	<div class="card">
		<div class="card-header">
			<h2 class="text-xl font-semibold">Asset Information</h2>
		</div>
		<div class="card-body">
			<form on:submit|preventDefault={handleSubmit}>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<!-- Asset Tag -->
					<div class="form-group">
						<label class="form-label" for="asset_tag">
							Asset Tag *
						</label>
						<div class="flex gap-2">
							<input 
								type="text" 
								id="asset_tag"
								class="form-input {errors.asset_tag ? 'error' : ''}"
								bind:value={formData.asset_tag}
								placeholder="e.g., LAP-123456"
								required
							>
							<button 
								type="button"
								class="btn btn-sm btn-secondary"
								on:click={generateAssetTag}
								title="Generate Asset Tag"
							>
								🎲
							</button>
						</div>
						{#if errors.asset_tag}
							<div class="form-error">{errors.asset_tag}</div>
						{/if}
					</div>

					<!-- Name -->
					<div class="form-group">
						<label class="form-label" for="name">
							Asset Name *
						</label>
						<input 
							type="text" 
							id="name"
							class="form-input {errors.name ? 'error' : ''}"
							bind:value={formData.name}
							placeholder="e.g., Dell Latitude 5520"
							required
						>
						{#if errors.name}
							<div class="form-error">{errors.name}</div>
						{/if}
					</div>

					<!-- Category -->
					<div class="form-group">
						<label class="form-label" for="category">
							Category *
						</label>
						<select 
							id="category"
							class="form-select {errors.category ? 'error' : ''}"
							bind:value={formData.category}
							required
						>
							<option value="">Select Category</option>
							{#each categories as category}
								<option value={category}>{category}</option>
							{/each}
						</select>
						{#if errors.category}
							<div class="form-error">{errors.category}</div>
						{/if}
					</div>

					<!-- Status -->
					<div class="form-group">
						<label class="form-label" for="status">
							Status
						</label>
						<select 
							id="status"
							class="form-select"
							bind:value={formData.status}
						>
							{#each statuses as status}
								<option value={status}>{status}</option>
							{/each}
						</select>
					</div>

					<!-- Brand -->
					<div class="form-group">
						<label class="form-label" for="brand">
							Brand
						</label>
						<input 
							type="text" 
							id="brand"
							class="form-input"
							bind:value={formData.brand}
							placeholder="e.g., Dell"
						>
					</div>

					<!-- Model -->
					<div class="form-group">
						<label class="form-label" for="model">
							Model
						</label>
						<input 
							type="text" 
							id="model"
							class="form-input"
							bind:value={formData.model}
							placeholder="e.g., Latitude 5520"
						>
					</div>

					<!-- Serial Number -->
					<div class="form-group">
						<label class="form-label" for="serial_number">
							Serial Number
						</label>
						<input 
							type="text" 
							id="serial_number"
							class="form-input"
							bind:value={formData.serial_number}
							placeholder="e.g., ABC123456789"
						>
					</div>

					<!-- Location -->
					<div class="form-group">
						<label class="form-label" for="location">
							Location
						</label>
						<input 
							type="text" 
							id="location"
							class="form-input"
							bind:value={formData.location}
							placeholder="e.g., Office 101, Building A"
						>
					</div>

					<!-- Purchase Date -->
					<div class="form-group">
						<label class="form-label" for="purchase_date">
							Purchase Date
						</label>
						<input 
							type="date" 
							id="purchase_date"
							class="form-input"
							bind:value={formData.purchase_date}
						>
					</div>

					<!-- Warranty Expiry -->
					<div class="form-group">
						<label class="form-label" for="warranty_expiry">
							Warranty Expiry
						</label>
						<input 
							type="date" 
							id="warranty_expiry"
							class="form-input {errors.warranty_expiry ? 'error' : ''}"
							bind:value={formData.warranty_expiry}
						>
						{#if errors.warranty_expiry}
							<div class="form-error">{errors.warranty_expiry}</div>
						{/if}
					</div>

					<!-- Assigned To -->
					<div class="form-group">
						<label class="form-label" for="assigned_to">
							Assigned To
						</label>
						<input 
							type="text" 
							id="assigned_to"
							class="form-input"
							bind:value={formData.assigned_to}
							placeholder="e.g., John Doe"
						>
					</div>
				</div>

				<!-- Notes -->
				<div class="form-group">
					<label class="form-label" for="notes">
						Notes
					</label>
					<textarea 
						id="notes"
						class="form-textarea"
						bind:value={formData.notes}
						placeholder="Additional notes about this asset..."
						rows="4"
					></textarea>
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
							<span>✅</span>
						{/if}
						{loading ? 'Creating...' : 'Create Asset'}
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
	.add-asset-page {
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
