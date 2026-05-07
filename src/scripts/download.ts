export function downloadBlob(filename: string, blob: Blob): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

export function collectInlineStyles(): string {
	return Array.from(document.querySelectorAll('style'))
		.map((s) => s.textContent ?? '')
		.join('\n');
}

export async function collectAllStyles(): Promise<string> {
	const inline = collectInlineStyles();
	const linkUrls = Array.from(
		document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
	)
		.map((l) => l.href)
		.filter((href) => href && !href.startsWith('https://fonts.googleapis.com'));

	const fetched = await Promise.all(
		linkUrls.map(async (url) => {
			try {
				const res = await fetch(url);
				if (!res.ok) return '';
				return await res.text();
			} catch {
				return '';
			}
		}),
	);

	return [...fetched, inline].join('\n');
}

import { GOOGLE_FONTS_URL } from '../styles/fonts';

export async function buildStandaloneHtml(
	themeClass: string,
	articleHtml: string,
): Promise<string> {
	const styles = await collectAllStyles();
	// Nest .page-container inside <main> so editor CSS rules that target
	// `body > .page-container` (used in-app to hide the print mirror) do not
	// match in the exported document and hide its entire body.
	return `<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="utf-8" />
<title>Petição</title>
<link href="${GOOGLE_FONTS_URL}" rel="stylesheet">
<style>${styles}</style>
</head>
<body>
<main>
<div class="page-container ${themeClass}">
<article class="petition-content">${articleHtml}</article>
</div>
</main>
</body>
</html>`;
}
