<script lang="ts">
	import { THEME_LABELS, THEME_GROUPS } from '../scripts/themes';
	let { theme = $bindable(), onPrint, onDownload, onCopyHtml, copyLabel = 'Copiar HTML', onClear, onUpload } = $props();

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
	}

	let fileInput: HTMLInputElement;
</script>

<nav class="container-fluid toolbar no-print">
	<ul>
		<li>
			<span class="icon">⚖️</span>
			<strong>Formato Legal</strong>
		</li>
		<li class="privacy-badge">
			<span title="Sua minuta não é enviada a servidores. Tudo roda no seu navegador.">🔒 Processamento local</span>
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
		<li>
			<input type="file" bind:this={fileInput} accept=".md,.txt,.html" style="display: none;" onchange={handleFileChange} />
			<button class="secondary outline" onclick={() => fileInput.click()}>Importar minuta</button>
		</li>
		<li>
			<button class="secondary outline" onclick={onDownload}>Exportar HTML</button>
		</li>
		<li>
			<button class="secondary outline copy-html-btn" onclick={onCopyHtml}>{copyLabel}</button>
		</li>
		<li>
			<button class="secondary outline" onclick={onClear}>Limpar tudo</button>
		</li>
		<li>
			<button onclick={onPrint}>Salvar/Imprimir PDF</button>
		</li>
	</ul>
</nav>
