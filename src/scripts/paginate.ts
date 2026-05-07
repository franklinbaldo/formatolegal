// Page layout for the live preview: walks the rendered article, measures each
// top-level block via DOM, and packs blocks into A4-sized pages. Pages are
// filled eagerly: paragraphs (including ones with inline formatting), lists,
// and blockquotes are split so each page fills as much vertical space as it
// can. Pretext finds the line index where a paragraph crosses a page boundary
// without DOM thrashing.

import { prepareWithSegments, layoutNextLineRange, type LayoutCursor } from '@chenglou/pretext';

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
	const style = cs.fontStyle && cs.fontStyle !== 'normal' ? cs.fontStyle : '';
	const weight = cs.fontWeight && cs.fontWeight !== 'normal' ? cs.fontWeight : '';
	return [style, weight, cs.fontSize, cs.fontFamily].filter(Boolean).join(' ');
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

// ---------------------------------------------------------------------------
// Splitting primitives
// ---------------------------------------------------------------------------

interface ParagraphSplit {
	first: HTMLElement;
	second: HTMLElement;
	secondEstimatedHeight: number;
}

// Split a paragraph (with or without inline children) into two paragraphs at
// the line index that fits in `availableHeight`. Inline formatting (strong,
// em, links, code, …) is preserved; cuts snap to whitespace and never go
// inside an inline element.
function splitParagraph(
	p: HTMLElement,
	availableHeight: number,
	contentWidth: number,
): ParagraphSplit | null {
	const cs = getComputedStyle(p);
	const lineHeight = pxOr(cs.lineHeight, pxOr(cs.fontSize, 16) * 1.5);
	const linesThatFit = Math.floor(availableHeight / lineHeight);
	if (linesThatFit < 1) return null;

	const fontStr = canvasFontFromComputed(cs);
	const fullText = p.textContent ?? '';
	if (!fullText.trim()) return null;

	const prepared = prepareWithSegments(fullText, fontStr);
	let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
	let lastEnd: LayoutCursor | null = null;
	for (let i = 0; i < linesThatFit; i++) {
		const next = layoutNextLineRange(prepared, cursor, contentWidth);
		if (!next) return null; // fits without split
		lastEnd = next.end;
		cursor = next.end;
	}
	if (!lastEnd) return null;

	// Translate (segmentIndex, graphemeIndex) → char offset in fullText.
	const segments = prepared.segments;
	let cutOffset = 0;
	for (let i = 0; i < lastEnd.segmentIndex && i < segments.length; i++) {
		cutOffset += segments[i].length;
	}
	if (lastEnd.segmentIndex < segments.length) {
		cutOffset += Math.min(lastEnd.graphemeIndex, segments[lastEnd.segmentIndex].length);
	}

	// Walk DOM children, find the node that straddles `cutOffset`.
	const first = p.cloneNode(false) as HTMLElement;
	const second = p.cloneNode(false) as HTMLElement;
	first.classList.add('paginated-slice');
	second.classList.add('paginated-continuation');

	let consumed = 0;
	let split = false;
	for (const child of Array.from(p.childNodes)) {
		if (split) {
			second.appendChild(child.cloneNode(true));
			continue;
		}
		const childText = child.textContent ?? '';
		if (consumed + childText.length <= cutOffset) {
			first.appendChild(child.cloneNode(true));
			consumed += childText.length;
			continue;
		}
		// This child straddles the cut.
		if (child.nodeType === 3) {
			// Text node: split inside the text, snap to whitespace.
			const localCut = Math.max(0, cutOffset - consumed);
			const txt = childText;
			let snap = localCut;
			while (snap < txt.length && !/\s/.test(txt[snap])) snap++;
			const beforeText = txt.slice(0, snap).trimEnd();
			const afterText = txt.slice(snap).trimStart();
			if (beforeText) first.appendChild(document.createTextNode(beforeText));
			if (afterText) second.appendChild(document.createTextNode(afterText));
		} else {
			// Element node: cut before it (don't split inline elements).
			second.appendChild(child.cloneNode(true));
		}
		split = true;
	}

	if (!first.textContent?.trim() || !second.textContent?.trim()) return null;

	const remainderText = second.textContent ?? '';
	const remainderPrepared = prepareWithSegments(remainderText, fontStr);
	let remainderLines = 0;
	let walk: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
	while (true) {
		const next = layoutNextLineRange(remainderPrepared, walk, contentWidth);
		if (!next) break;
		walk = next.end;
		remainderLines++;
	}
	const marginBottom = pxOr(cs.marginBottom, 0);
	return {
		first,
		second,
		secondEstimatedHeight: remainderLines * lineHeight + marginBottom,
	};
}

interface ContainerSplit {
	first: HTMLElement;
	second: HTMLElement;
	firstHeight: number;
	secondHeight: number;
}

// Split a container element (ul, ol, blockquote) by its block children
// (li for lists, child blocks for blockquote) so its first half fills the
// available space and its second half goes on the next page.
function splitContainer(
	el: HTMLElement,
	availableHeight: number,
): ContainerSplit | null {
	const childTag = el.tagName === 'OL' || el.tagName === 'UL' ? 'LI' : null;
	const children = Array.from(el.children) as HTMLElement[];
	if (children.length < 2) return null;

	const elRect = el.getBoundingClientRect();
	const containerCS = getComputedStyle(el);
	const padTop = pxOr(containerCS.paddingTop, 0);
	const padBottom = pxOr(containerCS.paddingBottom, 0);
	const marginBottom = pxOr(containerCS.marginBottom, 0);
	const containerOverhead = padTop + padBottom;
	// Reserve margin-bottom: the cloned first slice keeps it, and that space
	// has to fit on the current page too.
	const heightBudget = availableHeight - marginBottom;
	if (heightBudget <= 0) return null;

	// Cumulative bottom offset of each child relative to the container's top.
	const childBottoms: number[] = [];
	for (const child of children) {
		const r = child.getBoundingClientRect();
		childBottoms.push(r.bottom - elRect.top);
	}

	let cutIdx = -1;
	for (let i = 0; i < childBottoms.length; i++) {
		if (childBottoms[i] + containerOverhead <= heightBudget) cutIdx = i;
		else break;
	}
	if (cutIdx < 0 || cutIdx >= children.length - 1) return null;

	const first = el.cloneNode(false) as HTMLElement;
	const second = el.cloneNode(false) as HTMLElement;
	first.classList.add('paginated-slice');
	second.classList.add('paginated-continuation');

	for (let i = 0; i <= cutIdx; i++) first.appendChild(children[i].cloneNode(true));
	for (let i = cutIdx + 1; i < children.length; i++) second.appendChild(children[i].cloneNode(true));

	// Preserve ordered-list numbering across the page break: the continuation's
	// `start` is the original `start` (default 1) plus the number of items
	// already on the previous page.
	if (childTag === 'LI' && el.tagName === 'OL') {
		const originalStart = parseInt(el.getAttribute('start') ?? '1', 10) || 1;
		(second as HTMLOListElement).start = originalStart + cutIdx + 1;
		// For themes that rely on CSS counters, also drive a CSS custom property
		// so they can pick the right offset (e.g. `counter-reset: item var(--continuation-start)`).
		second.style.setProperty('--continuation-start', String(originalStart + cutIdx + 1));
	}

	const firstHeight = childBottoms[cutIdx] + containerOverhead;
	const lastBottom = childBottoms[childBottoms.length - 1];
	const secondHeight = lastBottom - childBottoms[cutIdx];

	return { first, second, firstHeight, secondHeight };
}

// ---------------------------------------------------------------------------
// Pagination loop
// ---------------------------------------------------------------------------

function getMargins(el: HTMLElement): { top: number; bottom: number } {
	const cs = getComputedStyle(el);
	return { top: pxOr(cs.marginTop, 0), bottom: pxOr(cs.marginBottom, 0) };
}

const SPLITTABLE_CONTAINERS = new Set(['UL', 'OL', 'BLOCKQUOTE']);
const ATOMIC_TAGS = new Set(['PRE', 'TABLE', 'IMG', 'FIGURE']);

function packBlock(
	block: HTMLElement,
	pages: HTMLElement[][],
	currentY: number,
	budget: PageBudget,
): number {
	const margins = getMargins(block);
	const blockHeight = block.getBoundingClientRect().height;
	const isFirstOnPage = currentY === 0;
	const totalHeight = isFirstOnPage ? blockHeight + margins.bottom : margins.top + blockHeight + margins.bottom;

	if (totalHeight <= budget.contentHeight - currentY) {
		pages[pages.length - 1].push(block);
		return currentY + totalHeight;
	}

	const remaining = budget.contentHeight - currentY - (isFirstOnPage ? 0 : margins.top);

	// Try paragraph split (preserves inline formatting).
	if (block.tagName === 'P' && remaining > 0 && !block.querySelector('.katex,img,.mermaid-diagram')) {
		const split = splitParagraph(block, remaining, budget.contentWidth);
		if (split) {
			pages[pages.length - 1].push(split.first);
			pages.push([split.second]);
			return split.secondEstimatedHeight;
		}
	}

	// Try container split (lists, blockquotes).
	if (SPLITTABLE_CONTAINERS.has(block.tagName) && remaining > 0) {
		const split = splitContainer(block, remaining);
		if (split) {
			pages[pages.length - 1].push(split.first);
			pages.push([split.second]);
			return split.secondHeight + margins.bottom;
		}
	}

	// Atomic / unsplittable block — push to a fresh page.
	if (!ATOMIC_TAGS.has(block.tagName) && pages[pages.length - 1].length === 0) {
		// Empty page and the block still doesn't fit: place it anyway (overflows).
		pages[pages.length - 1].push(block);
		return blockHeight + margins.bottom;
	}
	pages.push([block]);
	return blockHeight + margins.bottom;
}

export function paginate(html: string, themeClass: string): string[] {
	if (!html.trim()) return [];
	const { container, article } = getMeasurer(themeClass);
	article.innerHTML = html;
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
		currentY = packBlock(block, pages, currentY, budget);
	}

	return pages
		.filter((p) => p.length > 0)
		.map((blocks) => blocks.map((b) => b.outerHTML).join(''));
}
