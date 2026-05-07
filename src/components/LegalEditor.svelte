<script lang="ts">
	import { onMount } from 'svelte';
	import { renderMarkdown } from '../scripts/render';
	import { STORAGE_KEYS, type Theme } from '../scripts/themes';
	import Toolbar from './Toolbar.svelte';
	import EditorPane from './EditorPane.svelte';
	import PreviewPane from './PreviewPane.svelte';

	// Runes (Svelte 5)
	let content = $state('');
	let theme = $state<Theme>('theme-default');
	let htmlContent = $state('');

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
		
		// Auto-save
		localStorage.setItem(STORAGE_KEYS.content, content);
	});

	$effect(() => {
		localStorage.setItem(STORAGE_KEYS.theme, theme);
	});

	onMount(() => {
		const savedContent = localStorage.getItem(STORAGE_KEYS.content);
		if (savedContent) content = savedContent;

		const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) as Theme;
		if (savedTheme) theme = savedTheme;
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

	function handleDownload() {
		const blob = new Blob([htmlContent], { type: 'text/html' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'peticao.html';
		a.click();
		URL.revokeObjectURL(url);
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
	
	<div class="main-split">
		<EditorPane bind:content={content} onTemplate={handleTemplate} />
		<PreviewPane {htmlContent} {theme} />
	</div>
</div>
