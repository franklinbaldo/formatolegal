<script lang="ts">
	let { htmlContent, theme } = $props();
</script>

<div class="preview-pane">
	<header class="pane-header">
		<span>Visualização em A4</span>
	</header>
	<div class="paper-viewport">
		<div id="legal-preview-container" class="page-container {theme}">
			{#if htmlContent}
				<article class="petition-content">
					{@html htmlContent}
				</article>
			{:else}
				<div class="placeholder-msg">
					<p>O resultado da formatação jurídica aparecerá aqui em tempo real.</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.preview-pane {
		flex: 1;
		display: flex;
		flex-direction: column;
		background: #e9ecef;
		overflow: hidden;
	}

	.pane-header {
		padding: 0.5rem 1rem;
		background: #f1f3f5;
		border-bottom: 1px solid #ddd;
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		color: #666;
	}

	.paper-viewport {
		flex: 1;
		overflow-y: auto;
		padding: 40px;
		display: flex;
		justify-content: center;
	}

	.page-container {
		/* Base dimensions are in base.css, but we ensure it looks like a paper here */
		box-shadow: 0 15px 45px rgba(0,0,0,0.15);
		transition: all 0.3s ease;
	}

	/* Dark mode support for the paper in editor */
	:global([data-theme='dark']) .page-container {
		box-shadow: 0 15px 45px rgba(0,0,0,0.4);
	}

	.placeholder-msg {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #adb5bd;
		font-style: italic;
		text-align: center;
	}

	@media (max-width: 900px) {
		.paper-viewport {
			padding: 10px;
		}
		.page-container {
			width: 100%;
			min-height: auto;
			padding: 20mm 15mm;
		}
	}
</style>
