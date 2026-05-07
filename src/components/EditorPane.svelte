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
