# mdpanel Plugin — Etapa 1: Scripts (parser / sectioner / slug) and tests

Este arquivo contém a estrutura de arquivos e os scripts principais para a Etapa 1 (núcleo de parsing & sectioning) prontos para copiar/colar no seu projeto.

Use os blocos abaixo como arquivos individuais com os caminhos indicados.

---

## package.json

```json
{
  "name": "mdpanel-plugin-core",
  "version": "0.0.1",
  "private": true,
  "main": "src/main.js",
  "scripts": {
    "test": "node test/run-tests.js"
  },
  "dependencies": {
    "markdown-it": "^13.0.1"
  }
}
```

---

## src/api/parser.js

```js
// src/api/parser.js
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt({ html: true, linkify: true });

function parseToTokens(body) {
  // Returns markdown-it token stream
  return md.parse(body || '', {});
}

function tokenTextContent(token) {
  // For an inline token, concatenate children text
  if (!token) return '';
  if (token.type === 'inline') {
    return token.children ? token.children.map(t => t.content || '').join('') : token.content || '';
  }
  return token.content || '';
}

function extractHeadings(tokens) {
  // Returns array of { level, rawText, hasOpenFlag, anchor, tokenIndex }
  const headings = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'heading_open') {
      const tag = t.tag; // e.g. h2
      const level = Number(tag.slice(1));
      const inline = tokens[i + 1];
      const rawText = tokenTextContent(inline).trim();
      // detect explicit anchor like {#my-id} at end
      const anchorMatch = rawText.match(/\{#([A-Za-z0-9\-_:]+)\}\s*$/);
      const anchor = anchorMatch ? anchorMatch[1] : null;
      // detect 'open' as last word (case-insensitive)
      const withoutAnchor = anchor ? rawText.slice(0, anchorMatch.index).trim() : rawText;
      const words = withoutAnchor.split(/\s+/);
      const last = words.length ? words[words.length - 1] : '';
      const hasOpenFlag = typeof last === 'string' && last.toLowerCase() === 'open';
      headings.push({ level, rawText, hasOpenFlag, anchor, tokenIndex: i });
    }
  }
  return headings;
}

module.exports = { md, parseToTokens, extractHeadings, tokenTextContent };
```

---

## src/api/slug.js

```js
// src/api/slug.js
// Simple slugify consistent: lowercase, remove accents, replace non-alnum by '-'

function slugify(text) {
  if (!text) return '';
  // remove explicit anchor token if present
  let t = text.replace(/\{#([A-Za-z0-9\-_:]+)\}\s*$/,'').trim();
  // keep the 'open' word if present because user wants it visible and slug should reflect text-as-is by default
  // Normalize
  t = t.normalize('NFKD').replace(/\p{Diacritic}/gu, '');
  t = t.toLowerCase();
  t = t.replace(/[^a-z0-9\s\-]/g, '');
  t = t.trim().replace(/\s+/g, '-').replace(/-+/g, '-');
  return t;
}

function matchHeaderBySlug(tokens, slug) {
  // Given tokens, find heading token index whose generated slug matches
  const parser = require('./parser');
  const headings = parser.extractHeadings(tokens);
  for (const h of headings) {
    if (h.anchor && h.anchor === slug) return h;
    const s = slugify(h.rawText);
    if (s === slug) return h;
  }
  return null;
}

module.exports = { slugify, matchHeaderBySlug };
```

---

## src/api/sectioner.js

```js
// src/api/sectioner.js
// Build a nested section tree from markdown-it tokens using heading levels

const parser = require('./parser');

function sectionize(tokens) {
  // returns array of root sections; each section: { level, heading, tokens: [], children: [] }
  const headings = parser.extractHeadings(tokens);
  const sections = [];
  // Build a map from heading tokenIndex to heading meta
  const headingMap = new Map();
  for (const h of headings) headingMap.set(h.tokenIndex, h);
  
  // We'll iterate through tokens and split content into sections
  let currentSection = null;
  const stack = [];
  
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'heading_open') {
      const h = headingMap.get(i);
      if (!h) continue;
      // create new section
      const sec = { level: h.level, heading: h, tokens: [], children: [] };
      // place in tree using stack
      while (stack.length && stack[stack.length - 1].level >= sec.level) stack.pop();
      if (stack.length === 0) {
        sections.push(sec);
      } else {
        stack[stack.length - 1].children.push(sec);
      }
      stack.push(sec);
      currentSection = sec;
      // push the heading tokens (heading_open + inline + heading_close)
      currentSection.tokens.push(tokens[i]);
      // also include next token (inline)
      if (tokens[i+1]) currentSection.tokens.push(tokens[i+1]);
      // skip ahead: the following heading_close will be handled in loop if present
    } else {
      if (currentSection) currentSection.tokens.push(t);
    }
  }
  return sections;
}

module.exports = { sectionize };
```

---

## test/fixtures/simple.md

```md
# Title open

Some intro paragraph.

## Subheading closed

Content under subheading.

### Deep open

- item 1 open
- item 2

## Another

Final paragraph.
```

---

## test/run-tests.js

```js
// test/run-tests.js - simple runner without frameworks
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const parser = require('../src/api/parser');
const sectioner = require('../src/api/sectioner');
const slug = require('../src/api/slug');

function loadFixture(name) {
  return fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');
}

function testExtractHeadings() {
  const md = loadFixture('simple.md');
  const tokens = parser.parseToTokens(md);
  const headings = parser.extractHeadings(tokens);
  // Expecting headings: Title(open), Subheading(closed), Deep(open), Another
  assert.strictEqual(headings.length, 4, 'should find 4 headings');
  assert.strictEqual(headings[0].hasOpenFlag, true);
  assert.strictEqual(headings[1].hasOpenFlag, false);
  assert.strictEqual(headings[2].hasOpenFlag, true);
  assert.strictEqual(headings[3].hasOpenFlag, false);
  console.log('testExtractHeadings ok');
}

function testSectionize() {
  const md = loadFixture('simple.md');
  const tokens = parser.parseToTokens(md);
  const sections = sectioner.sectionize(tokens);
  // root sections should be: Title, Subheading, Another (Title considered root, Subheading under Title or separate?
  // Depending on parsing, we expect at least 3 top-level sections
  assert.ok(Array.isArray(sections), 'sections is array');
  assert.ok(sections.length >= 3, 'sections length >=3');
  console.log('testSectionize ok (sections count =', sections.length, ')');
}

function testSlugifyAndMatch() {
  const md = loadFixture('simple.md');
  const tokens = parser.parseToTokens(md);
  const headings = parser.extractHeadings(tokens);
  const s = slug.slugify(headings[0].rawText);
  assert.ok(typeof s === 'string' && s.length > 0);
  const found = slug.matchHeaderBySlug(tokens, s);
  assert.ok(found, 'matchHeaderBySlug should find heading by generated slug');
  console.log('testSlugifyAndMatch ok (slug=', s, ')');
}

function runAll() {
  testExtractHeadings();
  testSectionize();
  testSlugifyAndMatch();
  console.log('\nAll tests passed');
}

runAll();
```

---

## notes.txt (instruções rápidas)

```
- Copie os arquivos para a estrutura do projeto.
- Rode `npm install` para instalar markdown-it.
- Rode `npm test` para executar os testes simples (test/run-tests.js).
- Os scripts são um ponto de partida: refine sectioner e patching na Etapa 2.
```

---

Se quiser eu gero agora o *skeleton* real (arquivos individuais no repositório) ou já gero também a etapa 2 com `noteSync.js` e o pseudocódigo. O que prefere?```

