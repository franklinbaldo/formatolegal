<script lang="ts">
	import apelacaoTemplate from '../templates/apelacao.md?raw';
	import contestacaoTemplate from '../templates/contestacao.md?raw';
	import embargosTemplate from '../templates/embargos.md?raw';
	import parecerTemplate from '../templates/parecer.md?raw';
	import contratoTemplate from '../templates/contrato.md?raw';
	import peticaoTemplate from '../templates/peticao.md?raw';

	let { content = $bindable(), onTemplate, isHidden = false } = $props();

	const templates: Record<string, string> = {
		apelacao: apelacaoTemplate,
		contestacao: contestacaoTemplate,
		embargos: embargosTemplate,
		parecer: parecerTemplate,
		contrato: contratoTemplate,
		peticao: peticaoTemplate,
	};

	let dragActive = $state(false);

	function handleTemplateChange(e: Event & { currentTarget: HTMLSelectElement }) {
		const target = e.currentTarget;
		const tpl = templates[target.value];
		if (tpl) {
			onTemplate(tpl);
			target.value = '';
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dragActive = true;
	}

	function handleDragLeave() {
		dragActive = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragActive = false;
		const file = e.dataTransfer?.files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (ev) => {
			if (typeof ev.target?.result === 'string') {
				content = ev.target.result;
			}
		};
		reader.readAsText(file);
	}
</script>

<div
	class="editor-pane {isHidden ? 'mobile-hidden' : ''} {dragActive ? 'drag-active' : ''}"
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	role="region"
	aria-label="Editor de Markdown"
>
	<header class="pane-header">
		<span>Markdown / Texto</span>
		<select id="template-select" onchange={handleTemplateChange} aria-label="Modelos">
			<option value="">Carregar modelo...</option>
			<option value="apelacao">Apelação Cível</option>
			<option value="contestacao">Contestação</option>
			<option value="embargos">Embargos de Declaração</option>
			<option value="parecer">Parecer Jurídico</option>
			<option value="contrato">Contrato</option>
			<option value="peticao">Petição Simples</option>
		</select>
	</header>

	<textarea
		id="markdown-input"
		bind:value={content}
		placeholder="Cole seu Markdown aqui ou arraste um arquivo..."
	></textarea>
</div>
