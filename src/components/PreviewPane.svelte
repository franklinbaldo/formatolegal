<script lang="ts">
	import { paginate } from '../scripts/paginate';
	import { countWords } from '../scripts/utils';

	let { htmlContent, theme, isHidden = false } = $props();

	let pages = $state<string[]>([]);
	let resizeNonce = $state(0);

	const wordCount = $derived(countWords(htmlContent));

	$effect(() => {
		// Re-paginate whenever content, theme, or window size changes.
		void resizeNonce;
		if (!htmlContent) {
			pages = [];
			return;
		}
		pages = paginate(htmlContent, theme);
	});

	$effect(() => {
		const onResize = () => {
			resizeNonce++;
		};
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	});

	const pageCountLabel = $derived(pages.length || 1);

	const pageSnark = $derived.by(() => {
		const n = pages.length;
		if (n >= 100) return 'cliente vai pagar caro';
		if (n >= 50) return 'juiz vai dormir';
		if (n >= 30) return 'alguém leu o art. 489?';
		if (n >= 15) return 'rumo à Súmula Vinculante';
		return '';
	});
</script>

<div class="preview-pane {isHidden ? 'mobile-hidden' : ''}">
	<header class="pane-header">
		<span>Visualização em A4</span>
		<div id="status-bar" class="pane-stats">
			<span class="stat-pill">{wordCount} palavras</span>
			<span class="stat-pill" title={pageSnark}>{pageCountLabel} {pageCountLabel === 1 ? 'página' : 'páginas'}{pageSnark ? ` · ${pageSnark}` : ''}</span>
		</div>
	</header>
	<div class="paper-viewport">
		{#if pages.length > 0}
			{#each pages as pageHtml, i (i)}
				<div class="page-frame" data-page-number={i + 1}>
					<div
						id={i === 0 ? 'legal-preview-container' : undefined}
						class="page-container legal-paper {theme}"
					>
						<article class="petition-content">
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html pageHtml}
						</article>
					</div>
				</div>
			{/each}
		{:else}
			<div class="page-frame">
				<div id="legal-preview-container" class="page-container legal-paper {theme}">
					<div class="placeholder-msg">
						<p class="placeholder-title">Sua peça ainda está em branco.</p>
						<p class="placeholder-sub">Cole uma minuta, escolha um padrão e veja a mágica jurídica acontecer.</p>
						<p class="placeholder-hint">Para protocolo → <strong>CNJ/STF-STJ</strong><br>Para caos controlado → <strong>Petição Festa</strong></p>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
