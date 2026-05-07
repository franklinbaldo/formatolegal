<script lang="ts">
	import { THEME_LABELS, THEME_GROUPS } from '../scripts/themes';
	let {
		theme = $bindable(),
		onPrint,
		onDownload,
		onCopyHtml,
		copyLabel = 'Copiar HTML',
		onClear,
		onUpload,
		onGavel,
		privacyTooltip = 'Sua minuta não é enviada a servidores. Tudo roda no seu navegador.',
	} = $props();

	// eslint-disable-next-line no-undef
	let menuDetails: HTMLDetailsElement | undefined = $state();

	function handleFileChange(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		// eslint-disable-next-line no-undef
		reader.onload = (e: ProgressEvent<FileReader>) => {
			if (typeof e.target?.result === 'string') onUpload(e.target.result);
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

	const justCopied = $derived(copyLabel !== 'Copiar HTML');
</script>

<nav class="toolbar no-print" aria-label="Barra de ferramentas">
	<ul>
		<li class="brand">
			<button type="button" class="gavel" onclick={onGavel} aria-label="Bater o martelo">
				<span class="icon" aria-hidden="true">⚖️</span>
			</button>
			<strong role="heading" aria-level="1">Formato Legal</strong>
		</li>
		<li class="privacy-badge">
			<small title={privacyTooltip}>🔒 Local</small>
		</li>
	</ul>

	<ul class="toolbar-actions">
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
			<button class="icon-btn secondary outline" title="Importar minuta" aria-label="Importar minuta" onclick={() => fileInput.click()}>📥</button>
		</li>
		<li class="desktop-only">
			<button class="icon-btn secondary outline" title="Exportar HTML" aria-label="Exportar HTML" onclick={onDownload}>💾</button>
		</li>
		<li class="desktop-only">
			<button
				class="icon-btn secondary outline"
				title={justCopied ? copyLabel : 'Copiar HTML'}
				aria-label={justCopied ? copyLabel : 'Copiar HTML'}
				onclick={onCopyHtml}
			>
				{justCopied ? '✓' : '📋'}
			</button>
		</li>
		<li class="desktop-only">
			<button class="icon-btn secondary outline" title="Limpar tudo" aria-label="Limpar tudo" onclick={onClear}>🗑️</button>
		</li>

		<li>
			<button class="primary-action" onclick={onPrint}>🖨️ Salvar PDF</button>
		</li>

		<li class="mobile-only">
			<details class="dropdown" bind:this={menuDetails}>
				<summary aria-label="Mais ações" class="hamburger-summary secondary outline">
					<span class="hamburger-icon" aria-hidden="true">
						<span></span><span></span><span></span>
					</span>
				</summary>
				<ul>
					<li><button class="contrast outline" onclick={runAndClose(() => fileInput.click())}>📥 Importar</button></li>
					<li><button class="contrast outline" onclick={runAndClose(onDownload)}>💾 Exportar HTML</button></li>
					<li><button class="contrast outline" onclick={runAndClose(onCopyHtml)}>📋 {justCopied ? copyLabel : 'Copiar HTML'}</button></li>
					<li><button class="contrast outline danger-item" onclick={runAndClose(onClear)}>🗑️ Limpar tudo</button></li>
				</ul>
			</details>
		</li>
	</ul>
	<span class="sr-only" aria-live="polite" aria-atomic="true">
		{justCopied ? copyLabel : ''}
	</span>
</nav>
