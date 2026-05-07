<script lang="ts">
	import apelacaoTemplate from '../templates/apelacao.md?raw';
	import contestacaoTemplate from '../templates/contestacao.md?raw';

	let { content = $bindable(), onTemplate, isHidden = false } = $props();

	const templates: Record<string, string> = {
		apelacao: apelacaoTemplate,
		contestacao: contestacaoTemplate,
	};

	function handleTemplateChange(e: Event) {
		const target = e.currentTarget as HTMLSelectElement;
		const val = target.value;
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
			// eslint-disable-next-line no-undef
			reader.onload = (e: ProgressEvent<FileReader>) => {
				if (typeof e.target?.result === 'string') {
					content = e.target.result;
				}
			};
			reader.readAsText(file);
		}
	}
</script>

<div 
	class="editor-pane {isHidden ? 'mobile-hidden' : ''}" 
	ondragover={handleDragOver} 
	ondragleave={handleDragLeave} 
	ondrop={handleDrop}
	role="region"
	aria-label="Editor de Markdown"
>
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
