<script lang="ts">
	let { htmlContent, theme, isHidden = false } = $props();
	let previewEl = $state<HTMLElement | null>(null);

	// Calculate stats
	const wordCount = $derived(
		htmlContent ? htmlContent.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w.length > 0).length : 0
	);
	
	// A4 height is roughly 1123px at 96dpi
	const A4_HEIGHT_PX = 1123;
	const pageEstimate = $derived.by(() => {
		if (!previewEl) return 1;
		// Use scrollHeight for a better physical estimate
		return Math.max(1, Math.ceil(previewEl.scrollHeight / A4_HEIGHT_PX));
	});
</script>

<div class="preview-pane {isHidden ? 'mobile-hidden' : ''}">
	<header class="pane-header">
		<span>Visualização em A4</span>
		<div class="pane-stats">
			<span>{wordCount} palavras</span>
			<span class="separator">|</span>
			<span>~{pageEstimate} {pageEstimate === 1 ? 'página' : 'páginas'}</span>
		</div>
	</header>
	<div class="paper-viewport">
		<div id="legal-preview-container" bind:this={previewEl} class="page-container legal-paper {theme}">
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
