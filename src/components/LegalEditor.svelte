<script lang="ts">
	import { onMount } from 'svelte';
	import { renderMarkdown } from '../scripts/render';
	import { STORAGE_KEYS, type Theme } from '../scripts/themes';
	import { buildStandaloneHtml, downloadBlob } from '../scripts/download';
	import Toolbar from './Toolbar.svelte';
	import EditorPane from './EditorPane.svelte';
	import PreviewPane from './PreviewPane.svelte';

	// Runes (Svelte 5)
	let content = $state('');
	let theme = $state<Theme>('theme-default');
	let htmlContent = $state('');
	let mobileTab = $state<'editor' | 'preview'>('editor');
	let mounted = $state(false);

	// Derived values (Sync rendering)
	$effect(() => {
		const update = async () => {
			if (!content.trim()) {
				htmlContent = '';
				return;
			}
			htmlContent = await renderMarkdown(content);
		};
		update();
		
		// Auto-save (only after mount to avoid clearing storage with initial empty string)
		if (mounted) {
			localStorage.setItem(STORAGE_KEYS.content, content);
		}
	});

	$effect(() => {
		if (mounted) {
			localStorage.setItem(STORAGE_KEYS.theme, theme);
		}
	});

	onMount(() => {
		const savedContent = localStorage.getItem(STORAGE_KEYS.content);
		if (savedContent) content = savedContent;

		const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) as Theme;
		if (savedTheme) theme = savedTheme;
		
		mounted = true;
	});

	function handlePrint() {
		// Update the print-article in the DOM (used by LegalLayout/CSS)
		const printArticle = document.getElementById('print-article');
		if (printArticle) {
			printArticle.innerHTML = htmlContent;
			// Ensure the container has the correct theme class
			const container = printArticle.parentElement;
			if (container) {
				container.className = `page-container ${theme}`;
			}
		}
		window.print();
	}

	async function handleDownload() {
		const html = await buildStandaloneHtml(theme, htmlContent);
		const blob = new Blob([html], { type: 'text/html' });
		downloadBlob('peticao.html', blob);
	}

	function handleClear() {
		if (confirm('Deseja limpar todo o conteúdo?')) {
			content = '';
		}
	}

	function handleUpload(text: string) {
		content = text;
	}

	function handleTemplate(text: string) {
		content = text;
	}
</script>

<div class="editor-interface no-print">
	<Toolbar 
		bind:theme={theme} 
		onPrint={handlePrint} 
		onDownload={handleDownload}
		onClear={handleClear} 
		onUpload={handleUpload}
	/>
	
	<div class="pane-tabs" role="tablist" aria-label="Painéis">
		<button
			type="button"
			role="tab"
			aria-selected={mobileTab === 'editor'}
			class={mobileTab !== 'editor' ? 'secondary outline' : ''}
			onclick={() => (mobileTab = 'editor')}
		>
			Editor
		</button>
		<button
			type="button"
			role="tab"
			aria-selected={mobileTab === 'preview'}
			class={mobileTab !== 'preview' ? 'secondary outline' : ''}
			onclick={() => (mobileTab = 'preview')}
		>
			Visualização
		</button>
	</div>

	<div class="main-split">
		<EditorPane 
			bind:content={content} 
			onTemplate={handleTemplate} 
			isHidden={mobileTab !== 'editor'}
		/>
		<PreviewPane 
			{htmlContent} 
			{theme} 
			isHidden={mobileTab !== 'preview'}
		/>
	</div>
</div>
