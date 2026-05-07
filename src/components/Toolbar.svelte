<script lang="ts">
	import { THEME_LABELS, THEME_GROUPS } from '../scripts/themes';
	let { theme = $bindable(), onPrint, onDownload, onCopyHtml, copyLabel = 'Copiar HTML', onOpenInGoogleDocs, docsLabel = 'Abrir no Google Docs', onClear, onUpload } = $props();

	let menuOpen = $state(false);
	let menuEl: HTMLDivElement | undefined = $state();
	let toggleEl: HTMLButtonElement | undefined = $state();

	function handleFileChange(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		// eslint-disable-next-line no-undef
		reader.onload = (e: ProgressEvent<FileReader>) => {
			if (typeof e.target?.result === 'string') {
				onUpload(e.target.result);
			}
		};
		reader.readAsText(file);
		target.value = '';
	}

	let fileInput: HTMLInputElement;

	function closeMenu() {
		menuOpen = false;
	}

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function runAndClose(fn: () => void) {
		return () => {
			fn();
			closeMenu();
		};
	}

	$effect(() => {
		if (!menuOpen) return;
		// eslint-disable-next-line no-undef
		const onDocClick = (e: MouseEvent) => {
			// eslint-disable-next-line no-undef
			const t = e.target as Node;
			if (menuEl && !menuEl.contains(t) && toggleEl && !toggleEl.contains(t)) closeMenu();
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				closeMenu();
				toggleEl?.focus();
			}
		};
		document.addEventListener('click', onDocClick);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('click', onDocClick);
			document.removeEventListener('keydown', onKey);
		};
	});
</script>

<nav class="container-fluid toolbar no-print" aria-label="Barra de ferramentas">
	<ul>
		<li class="brand">
			<span class="icon" aria-hidden="true">⚖️</span>
			<strong role="heading" aria-level="1">Formato Legal</strong>
		</li>
		<li class="privacy-badge" aria-label="Privacidade">
			<span title="Sua minuta não é enviada a servidores. Tudo roda no seu navegador.">🔒 Processamento local</span>
		</li>
	</ul>

	<ul class="toolbar-actions">
		<li class="theme-select-wrap">
			<select id="theme-select" bind:value={theme} aria-label="Selecione o estilo">
				{#each THEME_GROUPS as group (group.label)}
					<optgroup label={group.label}>
						{#each group.themes as t (t)}
							<option value={t}>{THEME_LABELS[t]}</option>
						{/each}
					</optgroup>
				{/each}
			</select>
		</li>

		<input type="file" bind:this={fileInput} accept=".md,.txt,.html" hidden onchange={handleFileChange} />

		<li class="desktop-only">
			<button class="secondary outline" onclick={() => fileInput.click()}>Importar minuta</button>
		</li>
		<li class="desktop-only">
			<button class="secondary outline" onclick={onDownload}>Exportar HTML</button>
		</li>
		<li class="desktop-only">
			<button class="secondary outline copy-html-btn" onclick={onCopyHtml}>{copyLabel}</button>
		</li>
		<li class="desktop-only">
			<button class="secondary outline docs-btn" onclick={onOpenInGoogleDocs}>{docsLabel}</button>
		</li>
		<li class="desktop-only">
			<button class="secondary outline" onclick={onClear}>Limpar tudo</button>
		</li>

		<li>
			<button class="primary-action" onclick={onPrint}>Salvar/Imprimir PDF</button>
		</li>

		<li class="hamburger-wrap mobile-only">
			<button
				bind:this={toggleEl}
				type="button"
				class="hamburger-btn"
				aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
				aria-expanded={menuOpen}
				aria-controls="toolbar-menu"
				onclick={toggleMenu}
			>
				<span class="hamburger-icon" class:open={menuOpen} aria-hidden="true">
					<span></span><span></span><span></span>
				</span>
			</button>

			{#if menuOpen}
				<div bind:this={menuEl} id="toolbar-menu" class="toolbar-menu" role="menu">
					<button role="menuitem" onclick={runAndClose(() => fileInput.click())}>
						<span class="mi-icon" aria-hidden="true">📥</span> Importar minuta
					</button>
					<button role="menuitem" onclick={runAndClose(onDownload)}>
						<span class="mi-icon" aria-hidden="true">💾</span> Exportar HTML
					</button>
					<button role="menuitem" onclick={runAndClose(onCopyHtml)}>
						<span class="mi-icon" aria-hidden="true">📋</span> {copyLabel}
					</button>
					<button role="menuitem" onclick={runAndClose(onOpenInGoogleDocs)}>
						<span class="mi-icon" aria-hidden="true">📝</span> {docsLabel}
					</button>
					<hr />
					<button role="menuitem" class="danger" onclick={runAndClose(onClear)}>
						<span class="mi-icon" aria-hidden="true">🗑️</span> Limpar tudo
					</button>
				</div>
			{/if}
		</li>
	</ul>
</nav>
