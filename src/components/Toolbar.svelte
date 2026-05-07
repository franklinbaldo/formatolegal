<script lang="ts">
	import { THEME_LABELS, THEME_GROUPS } from '../scripts/themes';
	let { theme = $bindable(), onPrint, onDownload, onCopyHtml, copyLabel = 'Copiar HTML', onOpenInGoogleDocs, docsLabel = 'Abrir no Google Docs', onClear, onUpload } = $props();

	// eslint-disable-next-line no-undef
	let menuDetails: HTMLDetailsElement | undefined = $state();

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
		if (menuDetails) menuDetails.open = false;
	}

	function runAndClose(fn: () => void) {
		return () => {
			fn();
			closeMenu();
		};
	}
</script>

<nav class="toolbar no-print" data-theme="dark" aria-label="Barra de ferramentas">
	<ul>
		<li class="brand">
			<span class="icon" aria-hidden="true">⚖️</span>
			<strong role="heading" aria-level="1">Formato Legal</strong>
		</li>
		<li class="privacy-badge">
			<small title="Sua minuta não é enviada a servidores. Tudo roda no seu navegador.">🔒 Processamento local</small>
		</li>
	</ul>

	<ul>
		<li>
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
			<button class="secondary outline" onclick={onCopyHtml}>{copyLabel}</button>
		</li>
		<li class="desktop-only">
			<button class="secondary outline" onclick={onOpenInGoogleDocs}>{docsLabel}</button>
		</li>
		<li class="desktop-only">
			<button class="secondary outline" onclick={onClear}>Limpar tudo</button>
		</li>

		<li>
			<button onclick={onPrint}>Salvar/Imprimir PDF</button>
		</li>

		<li class="mobile-only">
			<details class="dropdown" bind:this={menuDetails}>
				<summary aria-label="Mais ações" class="hamburger-summary secondary outline">
					<span class="hamburger-icon" aria-hidden="true">
						<span></span><span></span><span></span>
					</span>
				</summary>
				<ul dir="rtl">
					<li><button class="contrast outline" onclick={runAndClose(() => fileInput.click())}>📥 Importar minuta</button></li>
					<li><button class="contrast outline" onclick={runAndClose(onDownload)}>💾 Exportar HTML</button></li>
					<li><button class="contrast outline" onclick={runAndClose(onCopyHtml)}>📋 {copyLabel}</button></li>
					<li><button class="contrast outline" onclick={runAndClose(onOpenInGoogleDocs)}>📝 {docsLabel}</button></li>
					<li><button class="contrast outline danger-item" onclick={runAndClose(onClear)}>🗑️ Limpar tudo</button></li>
				</ul>
			</details>
		</li>
	</ul>
</nav>
