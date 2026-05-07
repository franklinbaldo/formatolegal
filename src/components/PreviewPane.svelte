<script lang="ts">
	let { htmlContent, theme, isHidden = false } = $props();

	// Calculate stats
	const wordCount = $derived(
		htmlContent ? htmlContent.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w.length > 0).length : 0
	);
	
	// Rough A4 estimate: ~500 words per page depending on theme
	const pageEstimate = $derived(Math.max(1, Math.ceil(wordCount / 450)));
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
		<div id="legal-preview-container" class="page-container legal-paper {theme}">
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
