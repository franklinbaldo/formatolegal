<script lang="ts">
	let { htmlContent, theme, isHidden = false } = $props();
</script>

<div class="preview-pane {isHidden ? 'mobile-hidden' : ''}">
	<header class="pane-header">
		<span>Visualização em A4</span>
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
