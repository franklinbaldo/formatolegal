<script lang="ts">
	import apelacaoTemplate from '../templates/apelacao.md?raw';
	import contestacaoTemplate from '../templates/contestacao.md?raw';
	import { renderMarkdown } from '../scripts/render';
	import { isTheme, STORAGE_KEYS, THEMES, THEME_LABELS, type Theme } from '../scripts/themes';
	import { buildStandaloneHtml, downloadBlob } from '../scripts/download';

	const TEMPLATES: Record<string, string> = {
		apelacao: apelacaoTemplate,
		contestacao: contestacaoTemplate,
	};

	let markdown = $state('');
	let theme = $state<Theme>('theme-default');
	let numberedParagraphs = $state(false);
	let renderedHtml = $state('');
	let mobileTab = $state<'editor' | 'preview'>('editor');
	let dragOver = $state(false);
	let templateChoice = $state('');
	let previewEl: HTMLDivElement | undefined = $state();
	let fileInputEl: HTMLInputElement | undefined = $state();
	let printHtml = $state('');

	const wordCount = $derived(markdown.trim() ? markdown.trim().split(/\s+/).length : 0);
	const pageCount = $derived.by(() => {
		if (!previewEl || !markdown.trim()) return 0;
		const a4Px = 297 * (96 / 25.4);
		return Math.max(1, Math.ceil(previewEl.scrollHeight / a4Px));
	});
	const statusText = $derived(
		wordCount === 0
			? ''
			: `${wordCount} palavras · ~${pageCount} ${pageCount === 1 ? 'página' : 'páginas'}`,
	);

	$effect(() => {
		const saved = localStorage.getItem(STORAGE_KEYS.content);
		if (saved) markdown = saved;
		const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
		if (savedTheme && isTheme(savedTheme)) theme = savedTheme;
		const savedNumbered = localStorage.getItem(STORAGE_KEYS.numberedParagraphs);
		if (savedNumbered === '1') numberedParagraphs = true;
	});

	$effect(() => {
		localStorage.setItem(STORAGE_KEYS.content, markdown);
	});

	$effect(() => {
		localStorage.setItem(STORAGE_KEYS.theme, theme);
	});

	$effect(() => {
		localStorage.setItem(STORAGE_KEYS.numberedParagraphs, numberedParagraphs ? '1' : '0');
	});

	$effect(() => {
		const raw = markdown;
		let cancelled = false;
		void renderMarkdown(raw).then((html) => {
			if (!cancelled) renderedHtml = html;
		});
		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		const handler = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
				e.preventDefault();
				downloadMarkdown();
			}
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	});

	function readFile(file: File): void {
		const reader = new FileReader();
		reader.onload = (e) => {
			const result = e.target?.result;
			if (typeof result === 'string') markdown = result;
		};
		reader.readAsText(file);
	}

	function onFileChange(e: Event): void {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) readFile(file);
		target.value = '';
	}

	function onDrop(e: DragEvent): void {
		e.preventDefault();
		dragOver = false;
		const file = e.dataTransfer?.files?.[0];
		if (file) readFile(file);
	}

	function onDragOver(e: DragEvent): void {
		e.preventDefault();
		dragOver = true;
	}

	function onTemplateChange(): void {
		const value = templateChoice;
		if (value && TEMPLATES[value]) markdown = TEMPLATES[value];
		templateChoice = '';
	}

	function clear(): void {
		if (confirm('Deseja limpar todo o conteúdo?')) markdown = '';
	}

	async function print(): Promise<void> {
		printHtml = await renderMarkdown(markdown);
		await new Promise((r) => requestAnimationFrame(() => r(null)));
		window.print();
	}

	function downloadMarkdown(): void {
		if (!markdown.trim()) return;
		downloadBlob('peticao.md', new Blob([markdown], { type: 'text/markdown' }));
	}

	async function downloadHtml(): Promise<void> {
		if (!markdown.trim()) return;
		const html = await renderMarkdown(markdown);
		const doc = buildStandaloneHtml(theme, html);
		downloadBlob('peticao.html', new Blob([doc], { type: 'text/html' }));
	}
</script>

<div class="editor-interface no-print pico">
	<header class="toolbar">
		<nav>
			<ul>
				<li>
					<h1>
						<span aria-hidden="true">⚖️</span> Formato Legal
					</h1>
				</li>
			</ul>
			<ul>
				<li>
					<select id="theme-select" aria-label="Tema" bind:value={theme}>
						{#each THEMES as t (t)}
							<option value={t}>{THEME_LABELS[t]}</option>
						{/each}
					</select>
				</li>
				<li>
					<label class="numbered-toggle">
						<input
							id="numbered-paragraphs"
							type="checkbox"
							role="switch"
							bind:checked={numberedParagraphs}
						/>
						Numerar §
					</label>
				</li>
				<li>
					<input
						type="file"
						id="file-upload"
						accept=".md,.txt,.html"
						hidden
						bind:this={fileInputEl}
						onchange={onFileChange}
					/>
					<button id="upload-btn" class="secondary" onclick={() => fileInputEl?.click()}>
						Subir Arquivo
					</button>
				</li>
				<li>
					<button id="download-html-btn" class="secondary" onclick={downloadHtml}>
						Baixar HTML
					</button>
				</li>
				<li>
					<button id="clear-btn" class="secondary outline" onclick={clear}>Limpar</button>
				</li>
				<li>
					<button id="print-btn" onclick={print}>Imprimir PDF</button>
				</li>
			</ul>
		</nav>
	</header>

	<div class="mobile-tabs" role="tablist" aria-label="Painéis">
		<button
			id="tab-editor"
			type="button"
			role="tab"
			aria-selected={mobileTab === 'editor'}
			class={mobileTab === 'editor' ? '' : 'outline'}
			onclick={() => (mobileTab = 'editor')}
		>
			Editor
		</button>
		<button
			id="tab-preview"
			type="button"
			role="tab"
			aria-selected={mobileTab === 'preview'}
			class={mobileTab === 'preview' ? '' : 'outline'}
			onclick={() => (mobileTab = 'preview')}
		>
			Visualização
		</button>
	</div>

	<div class="main-split">
		<section
			class="editor-pane"
			class:drag-over={dragOver}
			class:mobile-hidden={mobileTab !== 'editor'}
			aria-label="Editor de Markdown"
			ondragover={onDragOver}
			ondragleave={() => (dragOver = false)}
			ondrop={onDrop}
		>
			<header class="pane-header">
				<small><strong>Markdown / Texto</strong></small>
				<select
					id="template-select"
					aria-label="Modelo"
					bind:value={templateChoice}
					onchange={onTemplateChange}
				>
					<option value="">Carregar Exemplo...</option>
					<option value="apelacao">Apelação Cível</option>
					<option value="contestacao">Contestação</option>
				</select>
			</header>
			<textarea
				id="markdown-input"
				placeholder="Cole seu Markdown aqui..."
				bind:value={markdown}
			></textarea>
		</section>

		<section class="preview-pane" class:mobile-hidden={mobileTab !== 'preview'}>
			<header class="pane-header">
				<small><strong>Visualização em A4</strong></small>
				<small id="status-bar">{statusText}</small>
			</header>
			<div
				id="legal-preview-container"
				class="legal-paper {theme}"
				class:numbered-paragraphs={numberedParagraphs}
				bind:this={previewEl}
			>
				{#if markdown.trim()}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitized via DOMPurify in renderMarkdown -->
					<article class="petition-content">{@html renderedHtml}</article>
				{:else}
					<div class="placeholder-msg">
						<p>O resultado da formatação jurídica aparecerá aqui em tempo real.</p>
					</div>
				{/if}
			</div>
		</section>
	</div>
</div>

<div class="page-container {theme}" class:numbered-paragraphs={numberedParagraphs}>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitized via DOMPurify in renderMarkdown -->
	<article id="print-article">{@html printHtml}</article>
</div>

<style>
	.editor-interface {
		display: flex;
		flex-direction: column;
		height: 100vh;
		width: 100vw;
		position: fixed;
		top: 0;
		left: 0;
		background: var(--pico-background-color);
		z-index: 1000;
	}

	.editor-interface > header.toolbar {
		padding: 0 1rem;
		background: var(--pico-card-background-color);
		border-bottom: 1px solid var(--pico-muted-border-color);
	}

	.editor-interface > header.toolbar :global(nav) {
		padding: 0;
	}

	.editor-interface > header.toolbar h1 {
		font-size: 1.1rem;
		margin: 0;
		padding: 0;
		color: var(--pico-primary);
	}

	.editor-interface > header.toolbar :global(nav ul li) {
		padding: 0.5rem 0.25rem;
	}

	.editor-interface > header.toolbar :global(select),
	.editor-interface > header.toolbar :global(button) {
		margin: 0;
	}

	.mobile-tabs {
		display: none;
		padding: 0;
		gap: 0;
		border-bottom: 1px solid var(--pico-muted-border-color);
	}

	.mobile-tabs button {
		flex: 1;
		margin: 0;
		border-radius: 0;
	}

	.main-split {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.editor-pane {
		width: 40%;
		display: flex;
		flex-direction: column;
		border-right: 1px solid var(--pico-muted-border-color);
		transition: background-color 0.15s;
	}

	.editor-pane.drag-over {
		background: var(--pico-primary-background);
	}

	.preview-pane {
		flex: 1;
		display: flex;
		flex-direction: column;
		background: var(--pico-secondary-background, #e9ecef);
		overflow-y: auto;
	}

	.preview-pane > .legal-paper {
		margin: 2rem auto;
	}

	.pane-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 1rem;
		background: var(--pico-card-sectioning-background-color, var(--pico-card-background-color));
		border-bottom: 1px solid var(--pico-muted-border-color);
		margin: 0;
	}

	.pane-header :global(select) {
		width: auto;
		min-width: 200px;
		margin: 0;
	}

	#markdown-input {
		flex: 1;
		margin: 0;
		border: none;
		border-radius: 0;
		font-family: 'Fira Code', 'Cascadia Code', monospace;
		font-size: 0.875rem;
		line-height: 1.6;
		resize: none;
	}

	.legal-paper {
		background: white;
		width: var(--paper-width, 210mm);
		min-height: var(--paper-height, 297mm);
		padding: var(--margin-top, 30mm) var(--margin-right, 20mm) var(--margin-bottom, 25mm)
			var(--margin-left, 30mm);
		box-shadow: 0 15px 45px rgba(0, 0, 0, 0.15);
		box-sizing: border-box;
	}

	.numbered-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		margin: 0;
		font-size: 0.875rem;
		color: var(--pico-color);
		white-space: nowrap;
	}

	.numbered-toggle :global(input) {
		margin: 0;
	}

	.placeholder-msg {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--pico-muted-color);
		font-style: italic;
		text-align: center;
	}

	:global(body > .page-container) {
		display: none;
	}

	@media (max-width: 900px) {
		.mobile-tabs {
			display: flex;
		}
		.main-split {
			flex-direction: column;
		}
		.editor-pane {
			width: 100%;
			border-right: none;
			border-bottom: 1px solid var(--pico-muted-border-color);
		}
		.editor-pane.mobile-hidden,
		.preview-pane.mobile-hidden {
			display: none;
		}
		.legal-paper {
			width: 100%;
			min-height: 0;
			padding: 20mm 12mm;
		}
	}

	@media print {
		.no-print {
			display: none !important;
		}
		:global(body > .page-container) {
			display: block !important;
		}
	}
</style>
