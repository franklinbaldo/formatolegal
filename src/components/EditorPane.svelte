<script lang="ts">
	import apelacaoTemplate from '../templates/apelacao.md?raw';
	import contestacaoTemplate from '../templates/contestacao.md?raw';

	let { content = $bindable(), onTemplate } = $props();

	const templates: Record<string, string> = {
		apelacao: apelacaoTemplate,
		contestacao: contestacaoTemplate,
	};

	function handleTemplateChange(e: any) {
		const val = e.target.value;
		if (val && templates[val]) {
			onTemplate(templates[val]);
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		const el = e.currentTarget as HTMLElement;
		el.style.background = '#f0f7ff';
	}

	function handleDragLeave(e: DragEvent) {
		const el = e.currentTarget as HTMLElement;
		el.style.background = 'white';
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		const el = e.currentTarget as HTMLElement;
		el.style.background = 'white';
		const file = e.dataTransfer?.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e: any) => {
				content = e.target.result;
			};
			reader.readAsText(file);
		}
	}
</script>

<div class="editor-pane" ondragover={handleDragOver} ondragleave={handleDragLeave} ondrop={handleDrop}>
	<header class="pane-header">
		<span>Markdown / Texto</span>
		<select onchange={handleTemplateChange} aria-label="Modelos">
			<option value="">Carregar Exemplo...</option>
			<option value="apelacao">Apelação Cível</option>
			<option value="contestacao">Contestação</option>
		</select>
	</header>
	<textarea bind:value={content} placeholder="Cole seu Markdown aqui ou arraste um arquivo..."></textarea>
</div>

<style>
	.editor-pane {
		width: 40%;
		display: flex;
		flex-direction: column;
		border-right: 1px solid #ddd;
		background: white;
	}

	.pane-header {
		padding: 0.5rem 1rem;
		background: #f1f3f5;
		border-bottom: 1px solid #ddd;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		color: #666;
	}

	.pane-header select {
		width: auto;
		margin-bottom: 0;
		font-size: 10px;
		padding: 2px 10px;
		height: 24px;
	}

	textarea {
		flex: 1;
		padding: 20px;
		font-family: 'Fira Code', 'Cascadia Code', monospace;
		font-size: 14px;
		line-height: 1.6;
		border: none;
		outline: none;
		resize: none;
		color: #2c3e50;
		margin-bottom: 0;
	}
</style>
