<script lang="ts">
	let { htmlContent, theme, isHidden = false } = $props();
	let previewEl = $state<HTMLElement | null>(null);

	const wordCount = $derived(
		htmlContent ? htmlContent.replace(/<[^>]*>/g, ' ').split(/\s+/).filter((w: string) => w.length > 0).length : 0
	);

	// A4 height is roughly 1123px at 96dpi
	const A4_HEIGHT_PX = 1123;
	const pageEstimate = $derived.by(() => {
		if (!previewEl) return 1;
		const contentHeight = previewEl.scrollHeight + 150;
		return Math.max(1, Math.ceil(contentHeight / A4_HEIGHT_PX));
	});
</script>

<div class="preview-pane {isHidden ? 'mobile-hidden' : ''}">
	<header class="pane-header">
		<span>Visualização em A4</span>
		<div id="status-bar" class="pane-stats">
			<span class="stat-pill">{wordCount} palavras</span>
			<span class="stat-pill">~{pageEstimate} {pageEstimate === 1 ? 'página' : 'páginas'}</span>
		</div>
	</header>
	<div class="paper-viewport">
		<div id="legal-preview-container" class="page-container legal-paper {theme}">
			{#if htmlContent}
				<article bind:this={previewEl} class="petition-content">
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html htmlContent}
				</article>
			{:else}
				<div class="placeholder-msg">
					<p class="placeholder-title">Sua peça ainda está em branco.</p>
					<p class="placeholder-sub">Cole uma minuta, escolha um padrão e veja a mágica jurídica acontecer.</p>
					<p class="placeholder-hint">Para protocolo → <strong>CNJ/STF-STJ</strong><br>Para caos controlado → <strong>Petição Festa</strong></p>
				</div>
			{/if}
		</div>
	</div>
</div>
