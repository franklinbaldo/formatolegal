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

export function buildStandaloneHtml(themeClass: string, articleHtml: string): string {
	const styles = collectInlineStyles();
	return `<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="utf-8" />
<title>Petição</title>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Montserrat:wght@400;700&display=swap" rel="stylesheet">
<style>${styles}</style>
</head>
<body>
<div class="page-container ${themeClass}">
<article class="petition-content">${articleHtml}</article>
</div>
</body>
</html>`;
}
