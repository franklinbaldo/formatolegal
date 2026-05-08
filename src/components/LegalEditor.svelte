<script lang="ts">
	import { onMount } from 'svelte';
	import { renderMarkdown } from '../scripts/render';
	import { STORAGE_KEYS, type Theme, isTheme, safeLocalStorage } from '../scripts/themes';
	import { buildStandaloneHtml, downloadBlob, copyHtmlToClipboard } from '../scripts/download';
	import { pickRandom } from '../scripts/utils';
	import Toolbar from './Toolbar.svelte';
	import EditorPane from './EditorPane.svelte';
	import PreviewPane from './PreviewPane.svelte';

	const CONFETTI_DURATION_MS = 3500;
	const TOAST_DURATION_MS = 3000;
	const COPY_LABEL_RESET_MS = 2200;

	let content = $state('');
	let theme = $state<Theme>('theme-default');
	let htmlContent = $state('');
	let mobileTab = $state<'editor' | 'preview'>('editor');
	let mounted = $state(false);
	let copyLabel = $state('Copiar HTML');
	let gavelClicks = $state(0);
	let toastMsg = $state('');
	let confettiActive = $state(false);

	// Easter-egg pools
	const COPY_SUCCESS_MSGS = [
		'✓ Copiado!',
		'✓ Na área de transferência (não no STF).',
		'✓ Copiado. Pole onde quiser, salvo em juízo.',
		'✓ Ctrl+V em vigor.',
		'✓ Habeas copium concedido.',
	];
	const PRIVACY_TOOLTIPS = [
		'Sua minuta não é enviada a servidores. Tudo roda no seu navegador.',
		'Sigilo absoluto: nem o estagiário vê.',
		'Processado localmente. Nem a NSA, nem o CADE, nem sua sogra.',
		'Não vendemos seus dados. Nem em prequestionamento.',
		'Roda offline. Como o judiciário em greve.',
	];
	const GAVEL_REACTIONS = [
		{ at: 5, msg: '⚖️ Ordem! Ordem na sala!' },
		{ at: 10, msg: '⚖️ Defiro a martelagem.' },
		{ at: 20, msg: '⚖️ Por unanimidade: chega.' },
		{ at: 50, msg: '⚖️ Tribunal de exceção declarado.' },
	];

	let privacyTooltip = $state(PRIVACY_TOOLTIPS[0]);

	$effect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === 's') {
				e.preventDefault();
				handleDownload();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	});

	$effect(() => {
		const current = content;
		let cancelled = false;
		(async () => {
			if (!current.trim()) {
				htmlContent = '';
				return;
			}
			const rendered = await renderMarkdown(current);
			if (!cancelled) htmlContent = rendered;
		})();
		if (mounted) {
			safeLocalStorage.set(STORAGE_KEYS.content, current);
		}
		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		if (mounted) {
			safeLocalStorage.set(STORAGE_KEYS.theme, theme);
		}
	});

	// Konami code → "modo festa": switch to the festa theme and rain confetti.
	$effect(() => {
		const sequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
		let idx = 0;
		const onKey = (e: KeyboardEvent) => {
			const expected = sequence[idx];
			if (e.key.toLowerCase() === expected.toLowerCase()) {
				idx++;
				if (idx === sequence.length) {
					idx = 0;
					triggerFesta();
				}
			} else {
				idx = 0;
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	function triggerFesta() {
		theme = 'theme-festa' as Theme;
		confettiActive = true;
		showToast('🎉 Modo Petição Festa ativado. Que comece o show!');
		setTimeout(() => (confettiActive = false), CONFETTI_DURATION_MS);
	}

	function showToast(msg: string) {
		toastMsg = msg;
		setTimeout(() => {
			if (toastMsg === msg) toastMsg = '';
		}, TOAST_DURATION_MS);
	}

	function handleGavel() {
		gavelClicks++;
		const reaction = GAVEL_REACTIONS.find((r) => r.at === gavelClicks);
		if (reaction) showToast(reaction.msg);
	}

	onMount(() => {
		const savedContent = safeLocalStorage.get(STORAGE_KEYS.content);
		if (savedContent) content = savedContent;
		const savedTheme = safeLocalStorage.get(STORAGE_KEYS.theme);
		if (savedTheme && isTheme(savedTheme)) theme = savedTheme;
		privacyTooltip = pickRandom(PRIVACY_TOOLTIPS);
		mounted = true;
	});

	async function handlePrint() {
		htmlContent = await renderMarkdown(content);
		const printArticle = document.getElementById('print-article');
		if (printArticle) {
			printArticle.innerHTML = htmlContent;
			const container = printArticle.parentElement;
			if (container) {
				container.className = `page-container ${theme}`;
			}
		}
		window.print();
	}

	async function handleDownload() {
		const html = await buildStandaloneHtml(theme, htmlContent);
		const blob = new Blob([html], { type: 'text/html' });
		downloadBlob('peticao.html', blob);
	}

	function handleClear() {
		if (confirm('Deseja limpar todo o conteúdo? (Sem direito a embargos.)')) {
			content = '';
		}
	}

	async function handleCopyHtml() {
		if (!htmlContent) return;
		await copyHtmlToClipboard(htmlContent);
		copyLabel = pickRandom(COPY_SUCCESS_MSGS);
		setTimeout(() => (copyLabel = 'Copiar HTML'), COPY_LABEL_RESET_MS);
	}

	function setContent(text: string) {
		content = text;
	}
</script>

<div class="editor-interface no-print" data-hydrated={mounted}>
	<Toolbar
		bind:theme={theme}
		onPrint={handlePrint}
		onDownload={handleDownload}
		onCopyHtml={handleCopyHtml}
		{copyLabel}
		onClear={handleClear}
		onUpload={setContent}
		onGavel={handleGavel}
		{privacyTooltip}
	/>

	<div class="pane-tabs" role="tablist" aria-label="Painéis">
		<button
			type="button"
			role="tab"
			aria-selected={mobileTab === 'editor'}
			class={mobileTab !== 'editor' ? 'secondary outline' : ''}
			onclick={() => (mobileTab = 'editor')}
		>
			Editor
		</button>
		<button
			type="button"
			role="tab"
			aria-selected={mobileTab === 'preview'}
			class={mobileTab !== 'preview' ? 'secondary outline' : ''}
			onclick={() => (mobileTab = 'preview')}
		>
			Visualização
		</button>
	</div>

	<div class="main-split">
		<EditorPane
			bind:content={content}
			onTemplate={setContent}
			isHidden={mobileTab !== 'editor'}
		/>
		<PreviewPane
			{htmlContent}
			{theme}
			isHidden={mobileTab !== 'preview'}
		/>
	</div>

	{#if toastMsg}
		<div class="toast" role="status" aria-live="polite">{toastMsg}</div>
	{/if}

	{#if confettiActive}
		<div class="confetti-rain" aria-hidden="true">
			{#each Array(40) as _, i (i)}
				<span style="--i: {i};">{['🎉', '🎊', '⚖️', '📜', '🥳', '✨'][i % 6]}</span>
			{/each}
		</div>
	{/if}
</div>
