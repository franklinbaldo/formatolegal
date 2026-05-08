export function pickRandom<T>(arr: readonly T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

export function stripHtml(html: string): string {
	return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function countWords(html: string): number {
	if (!html) return 0;
	return stripHtml(html).split(/\s+/).filter((w) => w.length > 0).length;
}
