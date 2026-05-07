<script lang="ts">
	import { THEME_LABELS, THEMES } from '../scripts/themes';
	let { theme = $bindable(), onPrint, onDownload, onClear, onUpload } = $props();

	function handleFileChange(e: any) {
		const file = e.target.files[0];
		if (!file) return;
		
		const reader = new FileReader();
		reader.onload = (e: any) => {
			onUpload(e.target.result);
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

<style>
	.toolbar {
		background: #1a2a44;
		color: white;
		padding: 0.5rem 1rem;
		box-shadow: 0 2px 10px rgba(0,0,0,0.2);
		z-index: 1100;
		border-bottom: none;
	}

	.toolbar strong {
		font-size: 1.2rem;
		color: white;
	}

	.toolbar select, .toolbar button {
		margin-bottom: 0;
		font-size: 0.8rem;
		padding: 0.4rem 0.8rem;
	}

	.toolbar select {
		background: rgba(255,255,255,0.1);
		color: white;
		border-color: rgba(255,255,255,0.2);
	}

	.toolbar select option {
		color: black;
	}

	.icon {
		font-size: 1.5rem;
	}

	@media (max-width: 900px) {
		.toolbar strong {
			display: none;
		}
	}
</style>
