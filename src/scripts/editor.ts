import apelacaoTemplate from '../templates/apelacao.md?raw';
import contestacaoTemplate from '../templates/contestacao.md?raw';
import { renderMarkdown, wrapArticle } from './render';
import { isTheme, STORAGE_KEYS, THEMES, THEME_LABELS, type Theme } from './themes';

function qs<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

const input = qs<HTMLTextAreaElement>('markdown-input');
const preview = qs<HTMLDivElement>('legal-preview-container');
const printBtn = qs<HTMLButtonElement>('print-btn');
const clearBtn = qs<HTMLButtonElement>('clear-btn');
const uploadBtn = qs<HTMLButtonElement>('upload-btn');
const downloadHtmlBtn = qs<HTMLButtonElement>('download-html-btn');
const fileInput = qs<HTMLInputElement>('file-upload');
const templateSelect = qs<HTMLSelectElement>('template-select');
const themeSelect = qs<HTMLSelectElement>('theme-select');
const status = qs<HTMLDivElement>('status-bar');
const tabEditorBtn = document.getElementById('tab-editor') as HTMLButtonElement | null;
const tabPreviewBtn = document.getElementById('tab-preview') as HTMLButtonElement | null;
const editorPane = document.querySelector<HTMLDivElement>('.editor-pane')!;
const previewPane = document.querySelector<HTMLDivElement>('.preview-pane')!;

const templates: Record<string, string> = {
  apelacao: apelacaoTemplate,
  contestacao: contestacaoTemplate,
};

const PLACEHOLDER_HTML =
  '<div class="placeholder-msg"><p>O resultado da formatação jurídica aparecerá aqui em tempo real.</p></div>';

let currentTheme: Theme = 'theme-default';

function applyTheme(theme: Theme): void {
  currentTheme = theme;
  preview.className = `legal-paper ${theme}`;
  const pageContainer = document.querySelector('.page-container');
  if (pageContainer) pageContainer.className = `page-container ${theme}`;
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

function updateStatus(text: string): void {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const previewHeight = preview.scrollHeight;
  const a4Px = 297 * (96 / 25.4);
  const pages = previewHeight > 0 ? Math.max(1, Math.ceil(previewHeight / a4Px)) : 0;
  status.textContent = words === 0 ? '' : `${words} palavras · ~${pages} ${pages === 1 ? 'página' : 'páginas'}`;
}

let renderToken = 0;
async function updatePreview(): Promise<void> {
  const raw = input.value;
  const token = ++renderToken;
  if (!raw.trim()) {
    preview.innerHTML = PLACEHOLDER_HTML;
    updateStatus('');
    localStorage.setItem(STORAGE_KEYS.content, '');
    return;
  }
  const html = await renderMarkdown(raw);
  if (token !== renderToken) return;
  preview.innerHTML = wrapArticle(html);
  updateStatus(raw);
  localStorage.setItem(STORAGE_KEYS.content, raw);
}

function debounce<F extends (...args: never[]) => void>(fn: F, ms: number): F {
  let t: ReturnType<typeof setTimeout> | undefined;
  return ((...args: never[]) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  }) as F;
}

const debouncedUpdate = debounce(updatePreview, 150);

function setContent(text: string): void {
  input.value = text;
  input.dispatchEvent(new Event('input'));
}

function readFile(file: File): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target?.result;
    if (typeof result === 'string') setContent(result);
  };
  reader.readAsText(file);
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function downloadHtml(): Promise<void> {
  const raw = input.value;
  if (!raw.trim()) return;
  const html = await renderMarkdown(raw);
  const layoutStyles = Array.from(document.querySelectorAll('style'))
    .map((s) => s.textContent ?? '')
    .join('\n');
  const doc = `<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="utf-8" />
<title>Petição</title>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Montserrat:wght@400;700&display=swap" rel="stylesheet">
<style>${layoutStyles}</style>
</head>
<body>
<div class="page-container ${currentTheme}">
${wrapArticle(html)}
</div>
</body>
</html>`;
  downloadBlob('peticao.html', new Blob([doc], { type: 'text/html' }));
}

function downloadMarkdown(): void {
  const raw = input.value;
  if (!raw.trim()) return;
  downloadBlob('peticao.md', new Blob([raw], { type: 'text/markdown' }));
}

function setMobileTab(which: 'editor' | 'preview'): void {
  if (!tabEditorBtn || !tabPreviewBtn) return;
  editorPane.classList.toggle('mobile-hidden', which !== 'editor');
  previewPane.classList.toggle('mobile-hidden', which !== 'preview');
  tabEditorBtn.classList.toggle('outline', which !== 'editor');
  tabPreviewBtn.classList.toggle('outline', which !== 'preview');
  tabEditorBtn.setAttribute('aria-selected', String(which === 'editor'));
  tabPreviewBtn.setAttribute('aria-selected', String(which === 'preview'));
}

themeSelect.innerHTML = THEMES.map(
  (t) => `<option value="${t}">${THEME_LABELS[t]}</option>`,
).join('');

themeSelect.addEventListener('change', () => {
  const value = themeSelect.value;
  if (isTheme(value)) applyTheme(value);
});

uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (file) readFile(file);
  fileInput.value = '';
});

editorPane.addEventListener('dragover', (e) => {
  e.preventDefault();
  editorPane.classList.add('drag-over');
});
editorPane.addEventListener('dragleave', () => {
  editorPane.classList.remove('drag-over');
});
editorPane.addEventListener('drop', (e) => {
  e.preventDefault();
  editorPane.classList.remove('drag-over');
  const file = e.dataTransfer?.files?.[0];
  if (file) readFile(file);
});

input.addEventListener('input', debouncedUpdate);

printBtn.addEventListener('click', async () => {
  const printArticle = document.getElementById('print-article');
  if (printArticle) {
    const html = await renderMarkdown(input.value);
    printArticle.innerHTML = html;
  }
  window.print();
});

clearBtn.addEventListener('click', () => {
  if (confirm('Deseja limpar todo o conteúdo?')) setContent('');
});

downloadHtmlBtn.addEventListener('click', () => {
  void downloadHtml();
});

templateSelect.addEventListener('change', () => {
  const val = templateSelect.value;
  if (val && templates[val]) setContent(templates[val]);
});

window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    downloadMarkdown();
  }
});

tabEditorBtn?.addEventListener('click', () => setMobileTab('editor'));
tabPreviewBtn?.addEventListener('click', () => setMobileTab('preview'));

window.addEventListener('load', () => {
  const savedContent = localStorage.getItem(STORAGE_KEYS.content);
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);

  if (savedTheme && isTheme(savedTheme)) {
    themeSelect.value = savedTheme;
    applyTheme(savedTheme);
  } else {
    applyTheme('theme-default');
  }

  if (savedContent) {
    input.value = savedContent;
    void updatePreview();
  }
});
