// Page layout for the live preview. The paginator walks the rendered article
// once for layout, then drives every text-related measurement through pretext:
// paragraph, heading, list-item and code-block heights, paragraph splits,
// and remainder line counts are all computed by `prepareWithSegments` +
// `layoutNextLineRange` against the page's actual content width. DOM
// measurement is reserved for blocks whose layout doesn't reduce to font
// metrics (mermaid SVG diagrams, tables, images/figures).

import {
	prepareWithSegments,
	layoutNextLineRange,
	type LayoutCursor,
	type PrepareOptions,
} from '@chenglou/pretext';

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
// Pretext-driven text measurement
// ---------------------------------------------------------------------------

// Build the pretext input for a text-bearing block. Any descendant `<br>`
// becomes a `\n` so `whiteSpace: 'pre-wrap'` mode reflows correctly. Returns
// the concatenated string; callers that need DOM offset mapping use
// `pretextLength` against the same children to stay in sync.
function buildPretextInput(el: HTMLElement): string {
	let out = '';
	const walk = (node: Node) => {
		if (node.nodeType === 3) {
			out += node.textContent ?? '';
		} else if (node.nodeType === 1) {
			const e = node as HTMLElement;
			if (e.tagName === 'BR') out += '\n';
			else for (const c of Array.from(e.childNodes)) walk(c);
		}
	};
	for (const c of Array.from(el.childNodes)) walk(c);
	return out;
}

// Length of a node's contribution to `buildPretextInput` — used to keep DOM
// offsets in sync with pretext char offsets when descending into children.
function pretextLength(node: Node): number {
	if (node.nodeType === 3) return (node.textContent ?? '').length;
	if (node.nodeType !== 1) return 0;
	const e = node as HTMLElement;
	if (e.tagName === 'BR') return 1;
	let total = 0;
	for (const c of Array.from(e.childNodes)) total += pretextLength(c);
	return total;
}

const PRE_WRAP_OPTS: PrepareOptions = { whiteSpace: 'pre-wrap' };

interface TextStyle {
	fontStr: string;
	lineHeight: number;
	marginTop: number;
	marginBottom: number;
}

function readTextStyle(el: HTMLElement): TextStyle {
	const cs = getComputedStyle(el);
	return {
		fontStr: canvasFontFromComputed(cs),
		lineHeight: pxOr(cs.lineHeight, pxOr(cs.fontSize, 16) * 1.5),
		marginTop: pxOr(cs.marginTop, 0),
		marginBottom: pxOr(cs.marginBottom, 0),
	};
}

// Count how many lines the given pretext-prepared text takes at `width`.
function countLines(
	prepared: ReturnType<typeof prepareWithSegments>,
	width: number,
): number {
	let lines = 0;
	let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
	while (true) {
		const next = layoutNextLineRange(prepared, cursor, width);
		if (!next) break;
		cursor = next.end;
		lines++;
	}
	return lines;
}

// Pretext-based content height for a text block (paragraph or list item).
// Returns null when the block has descendants that aren't flowed text and
// therefore can't be sized from font metrics:
// - Mermaid renders SVG diagrams.
// - <img>/<svg> are intrinsically sized boxes.
// Code blocks ARE text (monospace, no wrap) and are handled separately by
// `measurePreBlock` below.
function measureTextBlock(
	el: HTMLElement,
	contentWidth: number,
): { contentHeight: number; lineHeight: number } | null {
	if (el.querySelector('img,.mermaid-diagram,svg')) return null;
	const text = buildPretextInput(el);
	if (!text.trim()) return null;
	const style = readTextStyle(el);
	const prepared = prepareWithSegments(text, style.fontStr, PRE_WRAP_OPTS);
	const lines = countLines(prepared, contentWidth);
	return { contentHeight: lines * style.lineHeight, lineHeight: style.lineHeight };
}

// `<pre>` is monospace text that the browser renders with `white-space: pre`
// (no wrapping; long lines scroll horizontally). Counting newlines is the
// honest measurement here — pretext's line-wrap math would over-count.
function measurePreBlock(pre: HTMLElement): { contentHeight: number } | null {
	if (pre.querySelector('.mermaid-diagram,svg,img')) return null;
	const inner = pre.querySelector('code') ?? pre;
	const text = inner.textContent ?? '';
	const lines = Math.max(1, text.split('\n').length - (text.endsWith('\n') ? 1 : 0));
	const innerCS = getComputedStyle(inner);
	const lineHeight = pxOr(innerCS.lineHeight, pxOr(innerCS.fontSize, 14) * 1.4);
	const preCS = getComputedStyle(pre);
	// Highlight.js places its padding on `pre code.hljs`, not on `<pre>` itself
	// (see plugins.css). Sum chrome from both elements so the height isn't
	// undercounted for highlighted code blocks.
	const chrome =
		pxOr(preCS.paddingTop, 0) +
		pxOr(preCS.paddingBottom, 0) +
		pxOr(preCS.borderTopWidth, 0) +
		pxOr(preCS.borderBottomWidth, 0) +
		(inner === pre
			? 0
			: pxOr(innerCS.paddingTop, 0) +
				pxOr(innerCS.paddingBottom, 0) +
				pxOr(innerCS.borderTopWidth, 0) +
				pxOr(innerCS.borderBottomWidth, 0));
	return { contentHeight: lines * lineHeight + chrome };
}

// ---------------------------------------------------------------------------
// Cursor → char-offset
// ---------------------------------------------------------------------------

const graphemeSegmenter =
	typeof Intl !== 'undefined' && 'Segmenter' in Intl
		? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
		: null;

function cursorToCharOffset(segments: string[], cursor: LayoutCursor): number {
	let offset = 0;
	for (let i = 0; i < cursor.segmentIndex && i < segments.length; i++) {
		offset += segments[i].length;
	}
	if (cursor.segmentIndex < segments.length && cursor.graphemeIndex > 0) {
		const seg = segments[cursor.segmentIndex];
		if (graphemeSegmenter) {
			let g = 0;
			for (const piece of graphemeSegmenter.segment(seg)) {
				if (g === cursor.graphemeIndex) break;
				offset += piece.segment.length;
				g++;
			}
		} else {
			offset += Math.min(cursor.graphemeIndex, seg.length);
		}
	}
	return offset;
}

// ---------------------------------------------------------------------------
// Paragraph splitting
// ---------------------------------------------------------------------------

interface ParagraphSplit {
	first: HTMLElement;
	second: HTMLElement;
	secondEstimatedHeight: number;
}

function splitParagraph(
	p: HTMLElement,
	availableHeight: number,
	contentWidth: number,
): ParagraphSplit | null {
	if (p.querySelector('img,.mermaid-diagram,svg')) return null;

	const style = readTextStyle(p);
	const linesThatFit = Math.floor(availableHeight / style.lineHeight);
	if (linesThatFit < 1) return null;

	const fullText = buildPretextInput(p);
	if (!fullText.trim()) return null;

	const prepared = prepareWithSegments(fullText, style.fontStr, PRE_WRAP_OPTS);
	let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
	let lastEnd: LayoutCursor | null = null;
	for (let i = 0; i < linesThatFit; i++) {
		const next = layoutNextLineRange(prepared, cursor, contentWidth);
		if (!next) return null; // fits without split
		lastEnd = next.end;
		cursor = next.end;
	}
	if (!lastEnd) return null;

	const cutOffset = cursorToCharOffset(prepared.segments, lastEnd);

	// Walk top-level children, find the one straddling `cutOffset` (using
	// pretextLength so <br> contributions stay in sync with the input).
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
		const len = pretextLength(child);
		if (consumed + len <= cutOffset) {
			first.appendChild(child.cloneNode(true));
			consumed += len;
			continue;
		}
		// This child straddles the cut.
		if (child.nodeType === 1 && (child as HTMLElement).tagName === 'BR') {
			// `<br>` is the line terminator: keep it in the first slice and start
			// the second on a fresh line (the <br> isn't repeated).
			first.appendChild(child.cloneNode(true));
		} else if (child.nodeType === 3) {
			// Text node: snap backward to the last whitespace at-or-before localCut,
			// with a forward fallback when the line has no leading whitespace.
			const localCut = Math.max(0, cutOffset - consumed);
			const txt = child.textContent ?? '';
			let snap = localCut;
			while (snap > 0 && !/\s/.test(txt[snap - 1])) snap--;
			if (snap === 0) {
				snap = localCut;
				while (snap < txt.length && !/\s/.test(txt[snap])) snap++;
			}
			const beforeText = txt.slice(0, snap).replace(/\s+$/, '');
			const afterText = txt.slice(snap).replace(/^\s+/, '');
			if (beforeText) first.appendChild(document.createTextNode(beforeText));
			if (afterText) second.appendChild(document.createTextNode(afterText));
		} else {
			// Element node (strong, em, link, code, …): cut before it.
			second.appendChild(child.cloneNode(true));
		}
		split = true;
	}

	if (!first.textContent?.trim() || !second.textContent?.trim()) return null;

	// Re-measure the remainder via pretext on the same input shape.
	const remainderText = buildPretextInput(second);
	const remainderPrepared = prepareWithSegments(remainderText, style.fontStr, PRE_WRAP_OPTS);
	const remainderLines = countLines(remainderPrepared, contentWidth);

	return {
		first,
		second,
		secondEstimatedHeight: remainderLines * style.lineHeight + style.marginBottom,
	};
}

// ---------------------------------------------------------------------------
// Container splits (lists, blockquotes)
// ---------------------------------------------------------------------------

interface ContainerSplit {
	first: HTMLElement;
	second: HTMLElement;
	secondHeight: number;
}

// Cumulative heights of a container's children. For lists, prefer
// pretext-based li sizing; for everything else (e.g. blockquotes) fall back
// to DOM measurement so we still handle nested blocks.
function childCumulativeBottoms(
	el: HTMLElement,
	children: HTMLElement[],
	contentWidth: number,
): number[] {
	const isList = el.tagName === 'OL' || el.tagName === 'UL';
	const elRect = el.getBoundingClientRect();

	if (isList) {
		// Each <li> stacks below the previous; pretext gives us the text height.
		// Use the first item's actual offset from the container top to pick up
		// the list's top padding/border, then accumulate measured li heights.
		const containerCS = getComputedStyle(el);
		const padLeft = pxOr(containerCS.paddingLeft, 0);
		const padRight = pxOr(containerCS.paddingRight, 0);
		const borderLeft = pxOr(containerCS.borderLeftWidth, 0);
		const borderRight = pxOr(containerCS.borderRightWidth, 0);
		const padTop = pxOr(containerCS.paddingTop, 0);
		const borderTop = pxOr(containerCS.borderTopWidth, 0);
		// list-item text is rendered inside the list's content box, narrower
		// than the page by the list's horizontal padding/border (e.g. the 3em
		// padding-left from base.css).
		const liWidth = Math.max(40, contentWidth - padLeft - padRight - borderLeft - borderRight);
		let y = padTop + borderTop;
		const out: number[] = [];
		for (const li of children) {
			const measured = measureTextBlock(li, liWidth);
			let liHeight: number;
			if (measured) {
				const liStyle = readTextStyle(li);
				liHeight = measured.contentHeight + liStyle.marginTop + liStyle.marginBottom;
			} else {
				liHeight = li.getBoundingClientRect().height;
			}
			y += liHeight;
			out.push(y);
		}
		return out;
	}

	// Blockquote / generic: child positions relative to the container's outer top.
	return children.map((c) => c.getBoundingClientRect().bottom - elRect.top);
}

function splitContainer(
	el: HTMLElement,
	availableHeight: number,
	contentWidth: number,
): ContainerSplit | null {
	const children = Array.from(el.children) as HTMLElement[];
	if (children.length < 2) return null;

	const containerCS = getComputedStyle(el);
	const padTop = pxOr(containerCS.paddingTop, 0);
	const padBottom = pxOr(containerCS.paddingBottom, 0);
	const borderTop = pxOr(containerCS.borderTopWidth, 0);
	const borderBottom = pxOr(containerCS.borderBottomWidth, 0);
	const marginBottom = pxOr(containerCS.marginBottom, 0);
	const bottomChrome = padBottom + borderBottom;
	const heightBudget = availableHeight - marginBottom;
	if (heightBudget <= 0) return null;

	const childBottoms = childCumulativeBottoms(el, children, contentWidth);

	let cutIdx = -1;
	for (let i = 0; i < childBottoms.length; i++) {
		if (childBottoms[i] + bottomChrome <= heightBudget) cutIdx = i;
		else break;
	}
	if (cutIdx < 0 || cutIdx >= children.length - 1) return null;

	const first = el.cloneNode(false) as HTMLElement;
	const second = el.cloneNode(false) as HTMLElement;
	first.classList.add('paginated-slice');
	second.classList.add('paginated-continuation');

	for (let i = 0; i <= cutIdx; i++) first.appendChild(children[i].cloneNode(true));
	for (let i = cutIdx + 1; i < children.length; i++) second.appendChild(children[i].cloneNode(true));

	if (el.tagName === 'OL') {
		const originalStart = parseInt(el.getAttribute('start') ?? '1', 10) || 1;
		(second as HTMLOListElement).start = originalStart + cutIdx + 1;
		second.style.setProperty('--continuation-start', String(originalStart + cutIdx + 1));
	}

	const lastBottom = childBottoms[childBottoms.length - 1];
	const secondHeight = lastBottom - childBottoms[cutIdx] + padTop + padBottom + borderTop + borderBottom;

	return { first, second, secondHeight };
}

// ---------------------------------------------------------------------------
// Pagination loop
// ---------------------------------------------------------------------------

const SPLITTABLE_CONTAINERS = new Set(['UL', 'OL', 'BLOCKQUOTE']);
// Atomic blocks aren't flowed text and don't currently split mid-block:
// tables (2D layout), images/figures (intrinsic boxes), and KaTeX/mermaid
// blocks (custom 2D layouts). Code blocks are atomic for splitting too, but
// their height IS pretext-measurable (just newline count).
const ATOMIC_TAGS = new Set(['PRE', 'TABLE', 'IMG', 'FIGURE']);
const TEXT_BLOCK_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6']);

// Best-effort block height. Pretext sizes any block whose layout is
// "flowed text" (paragraphs, headings, list items, code blocks). Tables,
// images, mermaid diagrams, and KaTeX displays fall back to DOM measurement
// because their layout doesn't reduce to font metrics.
function blockHeight(block: HTMLElement, contentWidth: number): number {
	if (block.tagName === 'PRE') {
		const measured = measurePreBlock(block);
		if (measured) return measured.contentHeight;
	} else if (TEXT_BLOCK_TAGS.has(block.tagName)) {
		const measured = measureTextBlock(block, contentWidth);
		if (measured) return measured.contentHeight;
	}
	return block.getBoundingClientRect().height;
}

function packBlock(
	block: HTMLElement,
	pages: HTMLElement[][],
	currentY: number,
	budget: PageBudget,
): number {
	const margins = (() => {
		const cs = getComputedStyle(block);
		return { top: pxOr(cs.marginTop, 0), bottom: pxOr(cs.marginBottom, 0) };
	})();
	const height = blockHeight(block, budget.contentWidth);
	const isFirstOnPage = currentY === 0;
	const totalHeight = isFirstOnPage ? height + margins.bottom : margins.top + height + margins.bottom;

	if (totalHeight <= budget.contentHeight - currentY) {
		pages[pages.length - 1].push(block);
		return currentY + totalHeight;
	}

	const remaining = budget.contentHeight - currentY - (isFirstOnPage ? 0 : margins.top);

	if (block.tagName === 'P' && remaining > 0) {
		const split = splitParagraph(block, remaining, budget.contentWidth);
		if (split) {
			pages[pages.length - 1].push(split.first);
			pages.push([split.second]);
			return split.secondEstimatedHeight;
		}
	}

	if (SPLITTABLE_CONTAINERS.has(block.tagName) && remaining > 0) {
		const split = splitContainer(block, remaining, budget.contentWidth);
		if (split) {
			pages[pages.length - 1].push(split.first);
			pages.push([split.second]);
			return split.secondHeight + margins.bottom;
		}
	}

	if (!ATOMIC_TAGS.has(block.tagName) && pages[pages.length - 1].length === 0) {
		pages[pages.length - 1].push(block);
		return height + margins.bottom;
	}
	pages.push([block]);
	return height + margins.bottom;
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

	return pages.filter((p) => p.length > 0).map((bs) => bs.map((b) => b.outerHTML).join(''));
}
