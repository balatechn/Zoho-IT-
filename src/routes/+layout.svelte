<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
	
	// Navigation items
	const navItems = [
		{ name: 'Dashboard', href: '/', icon: '📊' },
		{ name: 'Assets', href: '/assets', icon: '💻' },
		{ name: 'Assignments', href: '/assignments', icon: '✍️' },
		{ name: 'Requests', href: '/requests', icon: '📝' },
		{ name: 'Reports', href: '/reports', icon: '📈' }
	];
	
	// Check if current route is active
	function isActive(href: string): boolean {
		if (href === '/') {
			return $page.url.pathname === '/';
		}
		return $page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app">
	<!-- Navigation -->
	<nav class="nav">
		<div class="container">
			<div class="flex items-center justify-between">
				<a href="/" class="nav-brand">
					<img src="/national-logo.png" alt="Zoho-IT" class="brand-logo" />
					<div class="brand-text">
						<div class="brand-title">Zoho-IT</div>
						<div class="brand-subtitle">Enterprise Asset Management</div>
					</div>
				</a>
				
				<ul class="nav-links">
					{#each navItems as item}
						<li>
							<a 
								href={item.href} 
								class="nav-link {isActive(item.href) ? 'active' : ''}"
							>
								<span class="text-lg">{item.icon}</span>
								{item.name}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</nav>

	<!-- Main content -->
	<main class="main-content">
		<div class="container">
			{@render children?.()}
		</div>
	</main>
</div>

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
	
	.main-content {
		flex: 1;
		padding: 2rem 0;
	}
	
	.nav-brand {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		text-decoration: none;
	}
	
	.brand-logo {
		height: 40px;
		width: auto;
	}
	
	.brand-text {
		display: flex;
		flex-direction: column;
	}
	
	.brand-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--primary-color);
		line-height: 1.2;
	}
	
	.brand-subtitle {
		font-size: 0.875rem;
		color: var(--text-secondary);
		font-weight: 500;
	}
	
	.nav-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	@media (max-width: 768px) {
		.nav-links {
			flex-direction: column;
			gap: 0.5rem;
		}
		
		.nav .container > .flex {
			flex-direction: column;
			gap: 1rem;
		}
		
		.main-content {
			padding: 1rem 0;
		}
		
		.brand-logo {
			height: 32px;
		}
		
		.brand-title {
			font-size: 1.1rem;
		}
		
		.brand-subtitle {
			font-size: 0.75rem;
		}
	}
</style>
