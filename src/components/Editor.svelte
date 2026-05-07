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
	let renderedHtml = $state('');
	let mobileTab = $state<'editor' | 'preview'>('editor');
	let dragOver = $state(false);
	let templateChoice = $state('');
	let previewEl: HTMLElement | undefined = $state();
	let fileInputEl: HTMLInputElement | undefined = $state();
	let printHtml = $state('');
	let hydrated = $state(false);

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

	const DARK_THEMES = new Set(['theme-cyberpunk']);
	const paperDataTheme = $derived(DARK_THEMES.has(theme) ? 'dark' : 'light');

	$effect(() => {
		const saved = localStorage.getItem(STORAGE_KEYS.content);
		if (saved) markdown = saved;
		const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
		if (savedTheme && isTheme(savedTheme)) theme = savedTheme;
		hydrated = true;
	});

	$effect(() => {
		localStorage.setItem(STORAGE_KEYS.content, markdown);
	});

	$effect(() => {
		localStorage.setItem(STORAGE_KEYS.theme, theme);
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

	$effect(() => {
		const onPreloadError = (e: Event) => e.preventDefault();
		window.addEventListener('vite:preloadError', onPreloadError);
		return () => window.removeEventListener('vite:preloadError', onPreloadError);
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
		const doc = await buildStandaloneHtml(theme, html);
		downloadBlob('peticao.html', new Blob([doc], { type: 'text/html' }));
	}
</script>

<div class="editor-shell no-print pico" data-hydrated={hydrated ? 'true' : undefined}>
	<header class="toolbar">
		<nav aria-label="Configurações do documento">
			<ul>
				<li>
					<h1 class="brand" aria-label="Formato Legal">
						<span aria-hidden="true">⚖️</span>
						<span class="brand-text">Formato Legal</span>
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
			</ul>
		</nav>
		<nav aria-label="Ações do documento">
			<ul role="group" class="action-group">
				<li>
					<input
						type="file"
						id="file-upload"
						accept=".md,.txt,.html"
						hidden
						bind:this={fileInputEl}
						onchange={onFileChange}
					/>
					<button class="secondary" onclick={() => fileInputEl?.click()}>
						<span aria-hidden="true">📂</span>
						<span class="btn-label">Subir</span>
					</button>
				</li>
				<li>
					<button class="secondary" onclick={downloadHtml}>
						<span aria-hidden="true">⬇️</span>
						<span class="btn-label">Baixar HTML</span>
					</button>
				</li>
				<li>
					<button class="secondary outline" onclick={clear}>
						<span aria-hidden="true">🗑️</span>
						<span class="btn-label">Limpar</span>
					</button>
				</li>
			</ul>
			<ul>
				<li>
					<button onclick={print}>
						<span aria-hidden="true">🖨️</span>
						<span>Imprimir PDF</span>
					</button>
				</li>
			</ul>
		</nav>
	</header>

	<div class="pane-tabs" role="tablist" aria-label="Painéis">
		<button
			type="button"
			role="tab"
			aria-controls="editor-pane"
			aria-selected={mobileTab === 'editor'}
			class:outline={mobileTab !== 'editor'}
			onclick={() => (mobileTab = 'editor')}
		>
			Editor
		</button>
		<button
			type="button"
			role="tab"
			aria-controls="preview-pane"
			aria-selected={mobileTab === 'preview'}
			class:outline={mobileTab !== 'preview'}
			onclick={() => (mobileTab = 'preview')}
		>
			Visualização
		</button>
	</div>

	<main class="workspace">
		<section
			id="editor-pane"
			class="editor-pane"
			class:drag-over={dragOver}
			class:mobile-hidden={mobileTab !== 'editor'}
			aria-label="Editor de Markdown"
			ondragover={onDragOver}
			ondragleave={() => (dragOver = false)}
			ondrop={onDrop}
		>
			<header>
				<hgroup>
					<small><strong>Markdown / Texto</strong></small>
				</hgroup>
				<select
					id="template-select"
					aria-label="Modelo"
					bind:value={templateChoice}
					onchange={onTemplateChange}
				>
					<option value="">Carregar Exemplo…</option>
					<option value="apelacao">Apelação Cível</option>
					<option value="contestacao">Contestação</option>
				</select>
			</header>
			<textarea
				id="markdown-input"
				placeholder="Cole ou arraste um arquivo .md aqui…"
				bind:value={markdown}
				aria-label="Markdown source"
			></textarea>
		{#if dragOver}
			<div class="drop-overlay" aria-hidden="true">
				<span>📂</span>
				<span>Solte o arquivo .md aqui</span>
			</div>
		{/if}
		</section>

		<section
			id="preview-pane"
			class="preview-pane"
			class:mobile-hidden={mobileTab !== 'preview'}
			aria-label="Visualização em A4"
		>
			<header>
				<hgroup>
					<small><strong>Visualização em A4</strong></small>
				</hgroup>
				<output id="status-bar" aria-live="polite"><small>{statusText}</small></output>
			</header>
			<div
				id="legal-preview-container"
				class="legal-paper {theme}"
				data-theme={paperDataTheme}
				bind:this={previewEl}
			>
				{#if markdown.trim()}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitized via DOMPurify in renderMarkdown -->
					<article class="petition-content">{@html renderedHtml}</article>
				{:else}
					<p class="placeholder-msg">
						O resultado da formatação jurídica aparecerá aqui em tempo real.
					</p>
				{/if}
			</div>
		</section>
	</main>
</div>

<div class="page-container {theme}">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitized via DOMPurify in renderMarkdown -->
	<article id="print-article">{@html printHtml}</article>
</div>

<style>
	.editor-shell {
		display: flex;
		flex-direction: column;
		height: 100dvh;
		width: 100vw;
		position: fixed;
		inset: 0;
		background: var(--pico-background-color);
		z-index: 1000;
	}

	.toolbar {
		display: flex;
		flex-direction: column;
		padding: 0.5rem 1rem;
		gap: 0.25rem;
		background: var(--pico-card-background-color);
		border-bottom: 1px solid var(--pico-muted-border-color);
	}

	.toolbar :global(nav) {
		flex-wrap: wrap;
		row-gap: 0.25rem;
	}

	.toolbar :global(nav ul) {
		flex-wrap: wrap;
		gap: 0.25rem 0.5rem;
		margin: 0;
		padding: 0;
	}

	.toolbar :global(nav ul li) {
		padding: 0.25rem 0;
	}

	.toolbar :global(select),
	.toolbar :global(button) {
		margin: 0;
	}

	.toolbar :global(button) {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.75rem;
		font-size: 0.875rem;
		white-space: nowrap;
	}

	.toolbar :global(select#theme-select) {
		min-width: 9rem;
		max-width: 14rem;
		padding: 0.4rem 2rem 0.4rem 0.6rem;
		font-size: 0.875rem;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		margin: 0;
		padding: 0;
		font-size: 1.05rem;
		font-weight: 600;
		line-height: 1.2;
		color: var(--pico-primary);
		white-space: nowrap;
	}

	.pane-tabs {
		display: none;
		border-bottom: 1px solid var(--pico-muted-border-color);
	}

	.pane-tabs :global(button) {
		flex: 1;
		margin: 0;
		border-radius: 0;
	}

	.workspace {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.editor-pane {
		width: 40%;
		display: flex;
		flex-direction: column;
		border-right: 1px solid var(--pico-muted-border-color);
		position: relative;
	}

	.drop-overlay {
		position: absolute;
		inset: 0;
		background: color-mix(in srgb, var(--pico-primary) 12%, transparent);
		border: 3px dashed var(--pico-primary);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-size: 2rem;
		font-weight: 600;
		color: var(--pico-primary);
		pointer-events: none;
		z-index: 10;
	}

	.drop-overlay span:last-child {
		font-size: 1rem;
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

	.editor-pane > header,
	.preview-pane > header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: var(--pico-card-sectioning-background-color, var(--pico-card-background-color));
		border-bottom: 1px solid var(--pico-muted-border-color);
		margin: 0;
		flex-wrap: wrap;
	}

	.editor-pane :global(hgroup),
	.preview-pane :global(hgroup) {
		margin: 0;
	}

	.editor-pane :global(select#template-select) {
		width: auto;
		min-width: 9rem;
		margin: 0;
		padding: 0.35rem 1.75rem 0.35rem 0.55rem;
		font-size: 0.8rem;
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
		background: var(--paper-bg, white);
		color: var(--paper-color, #333);
		width: var(--paper-width, 210mm);
		min-height: var(--paper-height, 297mm);
		padding: var(--margin-top, 30mm) var(--margin-right, 20mm) var(--margin-bottom, 25mm)
			var(--margin-left, 30mm);
		box-shadow: 0 15px 45px rgba(0, 0, 0, 0.15);
		box-sizing: border-box;
	}

	.placeholder-msg {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--pico-muted-color);
		font-style: italic;
		text-align: center;
		margin: 0;
	}

	:global(body > .page-container) {
		display: none;
	}

	@media (max-width: 900px) {
		.pane-tabs {
			display: flex;
		}
		.workspace {
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
		.preview-pane > .legal-paper {
			margin: 1rem auto;
		}
		.legal-paper {
			width: 100%;
			min-height: 0;
			padding: 20mm 12mm;
		}
	}

	@media (max-width: 640px) {
		.toolbar {
			padding: 0.5rem 0.625rem;
		}
		.brand-text {
			display: none;
		}
		.toolbar :global(select#theme-select) {
			min-width: 0;
			flex: 1 1 auto;
		}
		.action-group :global(.btn-label) {
			display: none;
		}
		.action-group :global(button) {
			padding: 0.45rem 0.6rem;
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
