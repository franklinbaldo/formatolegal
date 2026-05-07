// Page layout for the live preview: walks the rendered article, measures each
// top-level block via DOM, and packs blocks into A4-sized pages. When a plain
// paragraph would overflow the current page, pretext is used to decide the
// line index where it should be split (no DOM reflow per measurement).

import { prepareWithSegments, layoutNextLineRange, type LayoutCursor } from '@chenglou/pretext';

export interface PaginateResult {
	pagesHtml: string[];
}

const MEASURER_ID = '__formatolegal_paginator';

function getMeasurer(themeClass: string): { container: HTMLElement; article: HTMLElement } {
	let container = document.getElementById(MEASURER_ID) as HTMLElement | null;
	if (!container) {
		container = document.createElement('div');
		container.id = MEASURER_ID;
		container.style.position = 'absolute';
		container.style.visibility = 'hidden';
		container.style.left = '-99999px';
		container.style.top = '0';
		container.style.pointerEvents = 'none';
		container.style.zIndex = '-1';
		const article = document.createElement('article');
		container.appendChild(article);
		document.body.appendChild(container);
	}
	container.className = `page-container ${themeClass}`;
	const article = container.querySelector('article') as HTMLElement;
	return { container, article };
}

function canvasFontFromComputed(cs: CSSStyleDeclaration): string {
	// Canvas font format: "[style] [variant] [weight] size/lineHeight family"
	const style = cs.fontStyle && cs.fontStyle !== 'normal' ? cs.fontStyle : '';
	const weight = cs.fontWeight && cs.fontWeight !== 'normal' ? cs.fontWeight : '';
	const size = cs.fontSize;
	const family = cs.fontFamily;
	return [style, weight, `${size}`, family].filter(Boolean).join(' ');
}

function pxOr(value: string, fallback: number): number {
	const n = parseFloat(value);
	return Number.isFinite(n) ? n : fallback;
}

interface PageBudget {
	contentHeight: number;
	contentWidth: number;
}

function measureBudget(container: HTMLElement, article: HTMLElement): PageBudget {
	const cs = getComputedStyle(container);
	const minH = pxOr(cs.minHeight, container.clientHeight);
	const padTop = pxOr(cs.paddingTop, 0);
	const padBottom = pxOr(cs.paddingBottom, 0);
	const contentHeight = Math.max(100, minH - padTop - padBottom);
	const contentWidth = article.clientWidth || pxOr(cs.width, 600);
	return { contentHeight, contentWidth };
}

interface SplitResult {
	beforeText: string;
	afterText: string;
}

function splitPlainParagraph(
	text: string,
	fontStr: string,
	maxWidth: number,
	lineHeight: number,
	availableHeight: number,
): SplitResult | null {
	const linesThatFit = Math.floor(availableHeight / lineHeight);
	if (linesThatFit < 1) return null;

	const prepared = prepareWithSegments(text, fontStr);
	let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
	let lastEnd: LayoutCursor | null = null;
	for (let i = 0; i < linesThatFit; i++) {
		const next = layoutNextLineRange(prepared, cursor, maxWidth);
		if (!next) return null; // text fits in fewer lines than budget — no split needed
		lastEnd = next.end;
		cursor = next.end;
	}
	if (!lastEnd) return null;

	// Map (segmentIndex, graphemeIndex) → character offset in the original text.
	const segments = prepared.segments;
	let charOffset = 0;
	for (let i = 0; i < lastEnd.segmentIndex && i < segments.length; i++) {
		charOffset += segments[i].length;
	}
	if (lastEnd.segmentIndex < segments.length) {
		charOffset += Math.min(lastEnd.graphemeIndex, segments[lastEnd.segmentIndex].length);
	}

	// Snap to the next whitespace so we never break mid-word.
	let cut = charOffset;
	while (cut < text.length && !/\s/.test(text[cut])) cut++;
	const before = text.slice(0, cut).trimEnd();
	const after = text.slice(cut).trimStart();
	if (!before || !after) return null;
	return { beforeText: before, afterText: after };
}

function isPlainParagraph(el: HTMLElement): boolean {
	if (el.tagName !== 'P') return false;
	if (el.children.length !== 0) return false;
	if ((el.textContent ?? '').trim().length < 80) return false;
	return true;
}

function makeContinuation(p: HTMLElement, text: string): HTMLElement {
	const clone = p.cloneNode(false) as HTMLElement;
	clone.textContent = text;
	clone.classList.add('paginated-continuation');
	return clone;
}

function makeSliced(p: HTMLElement, text: string): HTMLElement {
	const clone = p.cloneNode(false) as HTMLElement;
	clone.textContent = text;
	clone.classList.add('paginated-slice');
	return clone;
}

export function paginate(html: string, themeClass: string): string[] {
	if (!html.trim()) return [];
	const { container, article } = getMeasurer(themeClass);
	article.innerHTML = html;
	// Force layout — required for getBoundingClientRect on children.
	void article.offsetHeight;

	const budget = measureBudget(container, article);
	const pages: HTMLElement[][] = [[]];
	let currentY = 0;

	const blocks = Array.from(article.children) as HTMLElement[];
	for (const block of blocks) {
		if (block.tagName === 'HR') {
			if (pages[pages.length - 1].length > 0) {
				pages.push([]);
				currentY = 0;
			}
			continue;
		}

		const cs = getComputedStyle(block);
		const marginTop = pxOr(cs.marginTop, 0);
		const marginBottom = pxOr(cs.marginBottom, 0);
		const blockHeight = block.getBoundingClientRect().height;
		const totalHeight = marginTop + blockHeight + marginBottom;

		if (currentY === 0) {
			// First block on a page: collapse top margin (matches CSS page break behavior).
			const collapsed = blockHeight + marginBottom;
			if (collapsed <= budget.contentHeight) {
				pages[pages.length - 1].push(block);
				currentY = collapsed;
				continue;
			}
		} else if (currentY + totalHeight <= budget.contentHeight) {
			pages[pages.length - 1].push(block);
			currentY += totalHeight;
			continue;
		}

		const remaining = budget.contentHeight - currentY - marginTop;
		if (remaining > 0 && isPlainParagraph(block)) {
			const fontStr = canvasFontFromComputed(cs);
			const lineHeight = pxOr(cs.lineHeight, pxOr(cs.fontSize, 16) * 1.5);
			const split = splitPlainParagraph(
				block.textContent ?? '',
				fontStr,
				budget.contentWidth,
				lineHeight,
				remaining,
			);
			if (split) {
				pages[pages.length - 1].push(makeSliced(block, split.beforeText));
				pages.push([makeContinuation(block, split.afterText)]);
				// Estimate carryover height with pretext.
				const preparedRemainder = prepareWithSegments(split.afterText, fontStr);
				let lineCount = 0;
				let walk: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
				while (true) {
					const next = layoutNextLineRange(preparedRemainder, walk, budget.contentWidth);
					if (!next) break;
					walk = next.end;
					lineCount++;
				}
				currentY = lineCount * lineHeight + marginBottom;
				continue;
			}
		}

		pages.push([block]);
		currentY = blockHeight + marginBottom;
	}

	const html_pages = pages
		.filter((p) => p.length > 0)
		.map((blocks) => blocks.map((b) => b.outerHTML).join(''));
	return html_pages;
}
