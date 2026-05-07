import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		localStorage.clear();
	});
});

async function gotoReady(page: import('@playwright/test').Page) {
	await page.goto('/formatolegal/');
	await page.locator('[data-hydrated="true"]').waitFor({ timeout: 15000 });
}

test('page loads with title and toolbar', async ({ page }) => {
	await gotoReady(page);
	await expect(page).toHaveTitle(/Formato Legal/);
	await expect(page.getByRole('heading', { name: 'Formato Legal' })).toBeVisible();
	await expect(page.getByRole('button', { name: /Salvar PDF/ })).toBeVisible();
});

test('typing markdown renders headings in preview', async ({ page }) => {
	await gotoReady(page);
	await page.locator('#markdown-input').fill('# Título da Petição\n\nCorpo do texto.');
	const preview = page.locator('#legal-preview-container');
	await expect(preview.locator('h1')).toHaveText('Título da Petição');
	await expect(preview.locator('p')).toContainText('Corpo do texto.');
});

test('clear button empties textarea after confirm', async ({ page }) => {
	await gotoReady(page);
	await page.locator('#markdown-input').fill('# Conteúdo');
	page.on('dialog', (d) => d.accept());
	await page.getByRole('button', { name: 'Limpar tudo' }).click();
	await expect(page.locator('#markdown-input')).toHaveValue('');
});

test('theme switch updates preview class', async ({ page }) => {
	await gotoReady(page);
	await page.locator('#theme-select').selectOption('theme-classic');
	await expect(page.locator('#legal-preview-container')).toHaveClass(/theme-classic/);
});

test('apelacao template loads non-empty content', async ({ page }) => {
	await gotoReady(page);
	await page.locator('#template-select').selectOption('apelacao');
	const value = await page.locator('#markdown-input').inputValue();
	expect(value.length).toBeGreaterThan(200);
	expect(value).toContain('APELAÇÃO');
});

test('contestacao template loads realistic content', async ({ page }) => {
	await gotoReady(page);
	await page.locator('#template-select').selectOption('contestacao');
	const value = await page.locator('#markdown-input').inputValue();
	expect(value.length).toBeGreaterThan(200);
	expect(value).toContain('CONTESTAÇÃO');
});

test('word count updates after input', async ({ page }) => {
	await gotoReady(page);
	await page.locator('#markdown-input').fill('uma duas tres quatro cinco');
	await expect(page.locator('#status-bar')).toContainText('5 palavras');
});

test('all BR-legal themes are selectable', async ({ page }) => {
	await gotoReady(page);
	for (const theme of ['theme-abnt', 'theme-cnj', 'theme-oab', 'theme-contrato']) {
		await page.locator('#theme-select').selectOption(theme);
		await expect(page.locator('#legal-preview-container')).toHaveClass(new RegExp(theme));
	}
});

test('all fun themes are selectable', async ({ page }) => {
	await gotoReady(page);
	for (const theme of [
		'theme-cyberpunk',
		'theme-vintage',
		'theme-pastel',
		'theme-brutalist',
		'theme-festa',
	]) {
		await page.locator('#theme-select').selectOption(theme);
		await expect(page.locator('#legal-preview-container')).toHaveClass(new RegExp(theme));
	}
});

test('footnotes render with refs and backref links', async ({ page }) => {
	await gotoReady(page);
	await page.locator('#markdown-input').fill(
		'Texto com nota[^1].\n\n[^1]: Definição da nota.',
	);
	const preview = page.locator('#legal-preview-container');
	await expect(preview.locator('.footnotes')).toBeVisible();
	await expect(preview.locator('[data-footnote-ref]').first()).toBeVisible();
});

test('GitHub alerts render with title', async ({ page }) => {
	await gotoReady(page);
	await page.locator('#markdown-input').fill('> [!WARNING]\n> Atenção ao prazo.');
	await expect(
		page.locator('#legal-preview-container .markdown-alert-warning'),
	).toBeVisible();
});

test('emoji shortcodes are converted', async ({ page }) => {
	await gotoReady(page);
	await page.locator('#markdown-input').fill('Equilíbrio :balance_scale: jurídico.');
	await expect(page.locator('#legal-preview-container article')).toContainText('⚖️');
});

test('code block gets highlight.js classes', async ({ page }) => {
	await gotoReady(page);
	await page.locator('#markdown-input').fill('```js\nconst x = 1;\n```');
	await expect(
		page.locator('#legal-preview-container pre code.hljs.language-js'),
	).toBeVisible();
});

test('mermaid block renders an SVG', async ({ page }) => {
	await gotoReady(page);
	await page
		.locator('#markdown-input')
		.fill('```mermaid\ngraph LR\nA-->B\n```');
	const svg = page.locator('#legal-preview-container .mermaid-diagram svg');
	await expect(svg).toBeVisible({ timeout: 10000 });
});

test('katex renders math', async ({ page }) => {
	await gotoReady(page);
	await page.locator('#markdown-input').fill('Equação: $a^2 + b^2 = c^2$.');
	await expect(page.locator('#legal-preview-container .katex')).toBeVisible();
});

test('downloaded HTML is visible (page-container not hidden by editor CSS)', async ({ page }) => {
	await gotoReady(page);
	await page.locator('#markdown-input').fill('# Título\n\nConteúdo do documento.');

	const downloadPromise = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Exportar HTML' }).click();
	const download = await downloadPromise;
	const stream = await download.createReadStream();
	const chunks: Buffer[] = [];
	for await (const chunk of stream) chunks.push(chunk as Buffer);
	const html = Buffer.concat(chunks).toString('utf-8');

	expect(html).toContain('<main>');
	expect(html).toContain('class="page-container');
	expect(html).toContain('Conteúdo do documento.');

	// Open the downloaded HTML directly and assert content is visible.
	await page.setContent(html);
	await expect(page.locator('main > .page-container')).toBeVisible();
	await expect(page.locator('main > .page-container article')).toContainText(
		'Conteúdo do documento.',
	);
});
