<script lang="ts">
	import { THEME_LABELS, THEMES } from '../scripts/themes';
	let { theme = $bindable(), onPrint, onDownload, onClear, onUpload } = $props();

	function handleFileChange(e: Event & { target: HTMLInputElement & { files: FileList } }) {
		const file = e.target.files[0];
		if (!file) return;
		
		const reader = new FileReader();
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
	</ul>
	<ul>
		<li>
			<select bind:value={theme} aria-label="Selecione o estilo">
				{#each THEMES as t}
					<option value={t}>{THEME_LABELS[t]}</option>
				{/each}
			</select>
		</li>
		<li>
			<input type="file" bind:this={fileInput} accept=".md,.txt,.html" style="display: none;" onchange={handleFileChange} />
			<button class="secondary outline" onclick={() => fileInput.click()}>Subir</button>
		</li>
		<li>
			<button class="secondary outline" onclick={onDownload}>Baixar HTML</button>
		</li>
		<li>
			<button class="secondary outline" onclick={onClear}>Limpar</button>
		</li>
		<li>
			<button onclick={onPrint}>Imprimir PDF</button>
		</li>
	</ul>
</nav>
