import { Marked } from 'marked';
import DOMPurify from 'dompurify';
import markedFootnote from 'marked-footnote';
import markedAlert from 'marked-alert';
import { markedHighlight } from 'marked-highlight';
import { markedEmoji } from 'marked-emoji';
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
	.use(markedEmoji({ emojis, renderer: (token) => token.emoji }));

marked.use({ breaks: true, gfm: true });

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
	const mermaid = await loadMermaid();
	const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
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
	return DOMPurify.sanitize(withDiagrams, {
		USE_PROFILES: { html: true, svg: true, svgFilters: true, mathMl: true },
		ADD_ATTR: ['target'],
	});
}

export function wrapArticle(html: string): string {
	return `<article class="petition-content">${html}</article>`;
}
