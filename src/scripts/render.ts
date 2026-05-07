import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.use({ breaks: true, gfm: true });

export async function renderMarkdown(raw: string): Promise<string> {
  const html = await marked.parse(raw);
  return DOMPurify.sanitize(html);
}

export function wrapArticle(html: string): string {
  return `<article class="petition-content">${html}</article>`;
}
