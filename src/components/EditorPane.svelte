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

	const quickStart: { key: string; label: string; desc: string }[] = [
		{ key: 'apelacao',    label: 'Apelação',         desc: 'Para quando a sentença saiu errada, obviamente.' },
		{ key: 'contestacao', label: 'Contestação',      desc: 'Para rebater o que o outro lado inventou.' },
		{ key: 'embargos',    label: 'Embargos',         desc: 'Para pedir que o óbvio fique explícito.' },
		{ key: 'parecer',     label: 'Parecer',          desc: 'Opinião com fundamento legal. Pelo menos teoricamente.' },
		{ key: 'contrato',    label: 'Contrato',         desc: 'Porque até o caos precisa de cláusulas.' },
		{ key: 'peticao',     label: 'Petição simples',  desc: 'Para começar sem cerimônia.' },
	];

	let textareaEl: HTMLTextAreaElement;
	let dragActive = $state(false);

	function handleTemplateChange(e: Event & { currentTarget: HTMLSelectElement }) {
		const target = e.currentTarget;
		const val = target.value;
		const tpl = templates[val];
		if (tpl) {
			onTemplate(tpl);
			target.value = '';
		}
	}

	function loadQuickStart(key: string) {
		const tpl = templates[key];
		if (tpl) onTemplate(tpl);
	}

	function focusTextarea() {
		textareaEl?.focus();
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

	{#if !content}
		<div class="quick-start">
			<p class="quick-start-headline">Sua peça ainda está em branco.</p>
			<p class="quick-start-sub">Cole uma minuta, escolha um padrão e veja a mágica jurídica acontecer.<br>Para protocolo, escolha <strong>CNJ/STF-STJ</strong>. Para caos controlado, escolha <strong>Petição Festa</strong>.</p>
			<div class="quick-start-grid">
				{#each quickStart as item (item.key)}
					<button class="quick-start-card" onclick={() => loadQuickStart(item.key)}>
						<span class="qs-label">{item.label}</span>
						<span class="qs-desc">{item.desc}</span>
					</button>
				{/each}
			</div>
			<button class="secondary outline qs-paste-btn" onclick={focusTextarea}>
				↓ Colar minha minuta
			</button>
		</div>
	{/if}

	<textarea
		id="markdown-input"
		bind:this={textareaEl}
		bind:value={content}
		placeholder="Cole seu Markdown aqui ou arraste um arquivo..."
		class={!content ? 'textarea-compact' : ''}
	></textarea>
</div>
