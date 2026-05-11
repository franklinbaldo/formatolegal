import { Marked } from 'marked';
import DOMPurify from 'dompurify';
import markedFootnote from 'marked-footnote';
import markedAlert from 'marked-alert';
import { markedHighlight } from 'marked-highlight';
import { markedEmoji } from 'marked-emoji';
import { markedSmartypants } from 'marked-smartypants';
import hljs from 'highlight.js';
import { EMOJI_MAP } from './emoji-map';

const emojis = Object.fromEntries(Object.entries(EMOJI_MAP).map(([k, v]) => [k, v]));

const marked = new Marked()
	.use(
		markedHighlight({
			langPrefix: 'hljs language-',
			highlight(code, lang) {
				if (lang === 'mermaid') return code;
				const language = hljs.getLanguage(lang) ? lang : 'plaintext';
				return hljs.highlight(code, { language }).value;
			},
		}),
	)
	.use(markedFootnote())
	.use(markedAlert())
	.use(markedEmoji({ emojis, renderer: (token) => token.emoji }))
	.use(markedSmartypants());

marked.use({ breaks: true, gfm: true });

// Insere espaço não-quebrável após abreviações jurídicas comuns para impedir
// que "art. 5º", "§ 1º", "nº 123", "fl. 42", "inc. III" quebrem entre o
// abreviativo e o número/inciso. Aplicado fora de tags e atributos.
const NBSP_PATTERNS: Array<[RegExp, string]> = [
	[/\b(arts?|artigos?)\.[ \t]+(?=\d|[IVXLCDM])/gi, '$1. '],
	[/\b(incs?|incisos?)\.[ \t]+(?=\d|[IVXLCDM])/gi, '$1. '],
	[/\b(§§?|parágrafos?)[ \t]+(?=\d|[IVXLCDM])/gi, '$1 '],
	[/\b(n[oº°]s?\.?)[ \t]+(?=\d|[IVXLCDM])/gi, '$1 '],
	[/\b(fls?|fls?\.|folhas?)[ \t]+(?=\d|[IVXLCDM])/gi, '$1 '],
	[/\b(págs?|p\.|pp\.|páginas?)[ \t]+(?=\d|[IVXLCDM])/gi, '$1 '],
	[/\b(caput|alínea|alíneas)[ \t]+(?=\d|[IVXLCDM])/gi, '$1 '],
];

function applyLegalNbsp(html: string): string {
	return html.replace(/>([^<]+)</g, (_match, text) => {
		let out = text as string;
		for (const [re, sub] of NBSP_PATTERNS) out = out.replace(re, sub);
		return `>${out}<`;
	});
}

// Vite emits a preload `<link>` for the LegalEditor CSS chunk when it
// dynamically imports mermaid. The referenced hashed file isn't always emitted
// (Astro merges that CSS into another chunk), so the preload 404s and bubbles
// up as a `vite:preloadError`, which mermaid then surfaces as a render error.
// The CSS is already on the page via the layout's eager imports, so swallow
// the false alarm. See vite-plugin/vite#11804.
if (typeof window !== 'undefined') {
	window.addEventListener('vite:preloadError', (e) => e.preventDefault());
}

let mermaidLoaded: Promise<typeof import('mermaid').default> | null = null;
function loadMermaid() {
	if (!mermaidLoaded) {
		mermaidLoaded = import('mermaid').then((m) => {
			m.default.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'default' });
			return m.default;
		});
	}
	return mermaidLoaded;
}

async function renderMermaid(html: string): Promise<string> {
	if (!html.includes('language-mermaid')) return html;
	let mermaid: typeof import('mermaid').default;
	let doc: Document;
	try {
		mermaid = await loadMermaid();
		doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
	} catch (err) {
		console.error('Mermaid setup failed', err);
		return html;
	}
	const blocks = doc.querySelectorAll('pre > code.language-mermaid');
	for (const code of Array.from(blocks)) {
		const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`;
		try {
			const { svg } = await mermaid.render(id, code.textContent ?? '');
			const wrapper = doc.createElement('div');
			wrapper.className = 'mermaid-diagram';
			wrapper.innerHTML = svg;
			code.parentElement?.replaceWith(wrapper);
		} catch (err) {
			const wrapper = doc.createElement('pre');
			wrapper.className = 'mermaid-error';
			wrapper.textContent = `Erro Mermaid: ${(err as Error).message}`;
			code.parentElement?.replaceWith(wrapper);
		}
	}
	return doc.body.firstElementChild?.innerHTML ?? html;
}

export async function renderMarkdown(raw: string): Promise<string> {
	const html = await marked.parse(raw);
	const withDiagrams = await renderMermaid(html);
	const withNbsp = applyLegalNbsp(withDiagrams);
	return DOMPurify.sanitize(withNbsp, {
		USE_PROFILES: { html: true, svg: true, svgFilters: true, mathMl: true },
		ADD_ATTR: ['target'],
	});
}

export function wrapArticle(html: string): string {
	return `<article class="petition-content">${html}</article>`;
}
