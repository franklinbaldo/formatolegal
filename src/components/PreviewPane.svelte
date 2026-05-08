<script lang="ts">
	import { countWords } from '../scripts/utils';

	let { htmlContent, theme, isHidden = false } = $props();
</script>

<div class="preview-pane {isHidden ? 'mobile-hidden' : ''}">
	<header class="pane-header">
		<span>Visualização em A4</span>
		<div id="status-bar" class="pane-stats">
			<span class="stat-pill">{countWords(htmlContent)} palavras</span>
		</div>
	</header>
	<div class="paper-viewport">
		<div id="legal-preview-container" class="page-container legal-paper {theme}">
			{#if htmlContent}
				<article class="petition-content">
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
