import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		localStorage.clear();
	});
});

test('page loads with title and toolbar', async ({ page }) => {
	await page.goto('/formatolegal/');
	await expect(page).toHaveTitle(/Formato Legal/);
	await expect(page.getByRole('heading', { name: 'Formato Legal' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Imprimir PDF' })).toBeVisible();
});

test('typing markdown renders headings in preview', async ({ page }) => {
	await page.goto('/formatolegal/');
	await page.locator('#markdown-input').fill('# Título da Petição\n\nCorpo do texto.');
	const preview = page.locator('#legal-preview-container');
	await expect(preview.locator('h1')).toHaveText('Título da Petição');
	await expect(preview.locator('p')).toContainText('Corpo do texto.');
});

test('clear button empties textarea after confirm', async ({ page }) => {
	await page.goto('/formatolegal/');
	await page.locator('#markdown-input').fill('# Conteúdo');
	page.on('dialog', (d) => d.accept());
	await page.getByRole('button', { name: 'Limpar' }).click();
	await expect(page.locator('#markdown-input')).toHaveValue('');
});

test('theme switch updates preview class', async ({ page }) => {
	await page.goto('/formatolegal/');
	await page.locator('#theme-select').selectOption('theme-classic');
	await expect(page.locator('#legal-preview-container')).toHaveClass(/theme-classic/);
});

test('apelacao template loads non-empty content', async ({ page }) => {
	await page.goto('/formatolegal/');
	await page.locator('#template-select').selectOption('apelacao');
	const value = await page.locator('#markdown-input').inputValue();
	expect(value.length).toBeGreaterThan(200);
	expect(value).toContain('APELAÇÃO');
});

test('contestacao template loads realistic content', async ({ page }) => {
	await page.goto('/formatolegal/');
	await page.locator('#template-select').selectOption('contestacao');
	const value = await page.locator('#markdown-input').inputValue();
	expect(value.length).toBeGreaterThan(200);
	expect(value).toContain('CONTESTAÇÃO');
});

test('word count updates after input', async ({ page }) => {
	await page.goto('/formatolegal/');
	await page.locator('#markdown-input').fill('uma duas tres quatro cinco');
	await expect(page.locator('#status-bar')).toContainText('5 palavras');
});
