# Formato Legal

**Formato Legal** é uma ferramenta web moderna projetada para advogados e profissionais do direito que desejam transformar petições em Markdown ou HTML em documentos jurídicos impecavelmente formatados no padrão A4.

Acesse: [https://franklinbaldo.github.io/formatolegal/](https://franklinbaldo.github.io/formatolegal/)

## Funcionalidades

- **Editor em tempo real**: cole seu texto ou Markdown à esquerda e veja a formatação jurídica aplicada instantaneamente à direita.
- **Identidade jurídica**: fontes elegantes (Lora e Montserrat), margens A4 precisas (30/20mm), recuo de parágrafo e citações destacadas.
- **Temas jurídicos brasileiros**: alterne entre os formatos comumente usados na advocacia brasileira. A preferência é salva no navegador.
  - **Padrão** — Lora/Montserrat com identidade visual.
  - **Clássico** — Times New Roman tradicional.
  - **ABNT** — Times 12pt, espaçamento 1,5, margens 3/2/2/3cm, recuo 1,25cm (NBR 14724).
  - **CNJ / STF-STJ** — Arial 12pt, 1,5, margens 3/2/2/3cm (Resolução CNJ 234).
  - **OAB Tradicional** — Times 12, h2 numerado automaticamente em algarismos romanos (I, II, III...), recuo 2cm.
  - **Contrato** — Times 11pt, single-spaced, listas ordenadas renderizadas como cláusulas hierárquicas (1.1, 1.2.3).
- **Numerar parágrafos**: toggle independente que numera cada `<p>` automaticamente — útil para memoriais.
- **Numeração de páginas em impressão**: rodapé "Pág. X de Y" via `@page` CSS (suportado em navegadores Chromium-based).
- **Múltiplas formas de entrada**: copiar e colar, upload de arquivo `.md`/`.txt`/`.html` ou drag & drop diretamente no editor.
- **Exportação**:
  - **Imprimir PDF** otimizado para A4.
  - **Baixar HTML** — gera um arquivo HTML autocontido com os estilos embutidos.
  - **Ctrl/Cmd+S** baixa o conteúdo bruto em `.md`.
- **Templates**: modelos pré-carregados de Apelação Cível e Contestação para acelerar a redação.
- **Status**: contagem de palavras e estimativa de páginas em tempo real.
- **Autosave**: o conteúdo é preservado no `localStorage` entre sessões.
- **Layout responsivo**: em telas pequenas, alterne entre Editor e Visualização por abas.
- **Privacidade**: todo o processamento ocorre localmente no navegador. Nenhum conteúdo é enviado a servidores. A renderização Markdown passa por sanitização (DOMPurify).

## Tecnologias

- [Astro](https://astro.build/) — framework web de alta performance.
- [Marked](https://marked.js.org/) — compilador de Markdown.
- [DOMPurify](https://github.com/cure53/DOMPurify) — sanitização de HTML.
- [Playwright](https://playwright.dev/) — testes end-to-end.
- [GitHub Actions](https://github.com/features/actions) — CI e deploy automatizado.

## Como usar

1. Acesse o site oficial.
2. Digite ou cole sua petição usando a sintaxe Markdown.
3. Use `#` para títulos, `**` para negrito, `>` para citações e `---` para quebra de página.
4. Visualize o resultado no "papel" virtual à direita.
5. Clique em **Imprimir PDF** para salvar ou imprimir o documento final.

## Desenvolvimento

Pré-requisitos: Node.js 22+.

```bash
npm install
npm run dev          # servidor de desenvolvimento
npm run build        # build de produção
npm run check        # type-check (astro check)
npm run lint         # ESLint
npm run format       # Prettier
npm test             # smoke tests (Playwright)
```

A pipeline de CI (`.github/workflows/ci.yml`) executa `astro check`, lint, build e testes em cada PR.

---

Desenvolvido por [Franklin Baldo](https://github.com/franklinbaldo).
