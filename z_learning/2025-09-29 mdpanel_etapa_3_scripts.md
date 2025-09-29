# mdpanel Plugin — Etapa 3: Webview (panel) scripts

Arquivos abaixo são o conjunto mínimo para a Etapa 3: webview shell, frontend do painel e gerenciador no plugin. Copie cada bloco para o arquivo indicado.

---

## src/ui/panelManager.js

```js
// src/ui/panelManager.js
const path = require('path');

let panelHandle = null;

async function createPanel() {
  if (panelHandle) return panelHandle;
  panelHandle = await joplin.views.panels.create('mdpanel.viewer');
  // Load shell HTML
  const html = await loadShellHtml();
  await joplin.views.panels.setHtml(panelHandle, html);
  // Add DOMPurify (optional) - copy dompurify.min.js to web/vendor and reference below
  await joplin.views.panels.addScript(panelHandle, 'web/vendor/dompurify.min.js');
  // Register onMessage to receive toggles
  await joplin.views.panels.onMessage(panelHandle, async (message) => {
    if (!message || !message.type) return;
    if (message.type === 'toggle') {
      // message: { type:'toggle', slug, open }
      const note = await joplin.workspace.selectedNote();
      if (!note) return { ok: false, reason: 'no_note' };
      // schedule toggle (debounced) via noteSync
      const noteSync = require('../api/noteSync');
      noteSync.scheduleToggle(note.id, message.slug, message.open);
      return { ok: true };
    }
  });
  return panelHandle;
}

async function loadShellHtml() {
  // load the web/index.html from plugin directory
  const fs = require('fs');
  const base = path.join(__dirname, '..', '..', 'web');
  const file = path.join(base, 'index.html');
  return fs.readFileSync(file, 'utf8');
}

async function showPanel() {
  const handle = await createPanel();
  await joplin.views.panels.show(handle);
  // trigger initial render for selected note
  await refreshPanelForSelectedNote();
}

async function refreshPanelForSelectedNote() {
  const handle = panelHandle;
  if (!handle) return;
  const note = await joplin.workspace.selectedNote();
  if (!note) return;
  const parser = require('../api/parser');
  const sectioner = require('../api/sectioner');
  const tokens = parser.parseToTokens(note.body || '');
  const sections = sectioner.sectionize(tokens);
  // convert sections -> HTML fragment
  const htmlFragment = renderSectionsToHtml(sections);
  // send to panel
  await joplin.views.panels.postMessage(handle, { type: 'init', html: htmlFragment, noteId: note.id });
}

function renderSectionsToHtml(sections) {
  // Simple conversion: build HTML from sections tokens (you can enhance later)
  function renderSection(sec) {
    const headingText = sec.heading.rawText; // includes 'open' per your choice
    const openAttr = sec.heading.hasOpenFlag ? ' open' : '';
    let inner = '';
    // convert tokens in sec.tokens to HTML using markdown-it renderer
    const md = require('../api/parser').md;
    const tokens = sec.tokens;
    inner += md.renderer.render(tokens, md.options, {});
    // render children
    for (const c of sec.children) {
      inner += renderSection(c);
    }
    return `<details${openAttr} data-slug="${require('../api/slug').slugify(headingText)}"><summary>${escapeHtml(headingText)}</summary>${inner}</details>`;
  }
  let out = '';
  for (const s of sections) out += renderSection(s);
  return out;
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

module.exports = { createPanel, showPanel, refreshPanelForSelectedNote };
```

---

## web/index.html

```html
<!-- web/index.html -->
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>mdpanel viewer</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app">
    <aside id="toc" aria-label="Table of contents"></aside>
    <main id="content">Carregando...</main>
  </div>
  <script>
    // webview environment: webviewApi is provided by Joplin
    function onMessage(msg) {
      if (!msg || !msg.type) return;
      if (msg.type === 'init') {
        const content = msg.html || '';
        const noteId = msg.noteId || '';
        const root = document.getElementById('content');
        // sanitize if DOMPurify available
        if (window.DOMPurify) root.innerHTML = DOMPurify.sanitize(content);
        else root.innerHTML = content;
        attachHandlers();
      }
    }

    function attachHandlers() {
      document.querySelectorAll('details').forEach(d => {
        const summary = d.querySelector('summary');
        if (summary && !summary._attached) {
          summary._attached = true;
          summary.addEventListener('click', (ev) => {
            // delay to allow open state to update
            setTimeout(() => {
              const open = d.hasAttribute('open');
              const slug = d.getAttribute('data-slug');
              if (window.webviewApi && window.webviewApi.postMessage) {
                window.webviewApi.postMessage({ type: 'toggle', slug, open });
              } else if (window.parent && window.parent.postMessage) {
                window.parent.postMessage({ type: 'toggle', slug, open }, '*');
              }
            }, 50);
          });
        }
      });
    }

    // register listener
    if (window.webviewApi && window.webviewApi.onMessage) {
      window.webviewApi.onMessage(onMessage);
      // notify ready
      window.webviewApi.postMessage({ type: 'ready' });
    } else {
      window.addEventListener('message', (e) => onMessage(e.data));
    }
  </script>
</body>
</html>
```

---

## web/panel.js

```js
// web/panel.js - optional extra frontend logic (if you prefer separate file)
// This file can be included via <script src="panel.js"></script> in index.html instead of inline script.

(function(){
  function onMessage(msg) {
    if (!msg || !msg.type) return;
    if (msg.type === 'init') {
      const content = msg.html || '';
      const root = document.getElementById('content');
      if (window.DOMPurify) root.innerHTML = DOMPurify.sanitize(content);
      else root.innerHTML = content;
      attachHandlers();
    }
  }

  function attachHandlers() {
    document.querySelectorAll('details').forEach(d => {
      const summary = d.querySelector('summary');
      if (summary && !summary._attached) {
        summary._attached = true;
        summary.addEventListener('click', () => {
          setTimeout(() => {
            const open = d.hasAttribute('open');
            const slug = d.getAttribute('data-slug');
            if (window.webviewApi && window.webviewApi.postMessage) {
              window.webviewApi.postMessage({ type: 'toggle', slug, open });
            }
          }, 50);
        });
      }
    });
  }

  if (window.webviewApi && window.webviewApi.onMessage) {
    window.webviewApi.onMessage(onMessage);
    window.webviewApi.postMessage({ type: 'ready' });
  } else {
    window.addEventListener('message', (e) => onMessage(e.data));
  }
})();
```

---

## web/styles.css

```css
/* web/styles.css - minimal responsive layout */
:root { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }
html,body,#app { height: 100%; margin: 0; padding: 0; }
#app { display: flex; gap: 12px; padding: 8px; box-sizing: border-box; }
#toc { width: 220px; max-width: 30%; overflow: auto; border-right: 1px solid #eee; padding-right: 8px; }
#content { flex: 1; overflow: auto; padding-left: 8px; }
details { margin: 8px 0; padding: 6px; border-radius: 6px; border: 1px solid #f0f0f0; }
summary { cursor: pointer; font-weight: 600; }
@media (max-width: 700px) { #toc { display: none; } }
```

---

## Instruções rápidas de integração

- Copie `src/ui/panelManager.js` para o projeto e importe/chame `showPanel()` a partir do `src/main.js` quando o plugin iniciar ou quando o comando para abrir o painel for executado.
- Coloque os arquivos `web/index.html`, `web/panel.js`, `web/styles.css` na pasta `web/` do plugin.
- Coloque `dompurify.min.js` em `web/vendor/` se quiser sanitização no cliente e `panelManager` já referencia esse arquivo com `addScript`.
- Depois de instalar o plugin no diretório `plugins` do Joplin, abra uma nota e execute o comando/menu para abrir o painel; o painel deverá exibir as sections como `<details>` e enviar toggles ao plugin (que irá chamar `noteSync.scheduleToggle`).

Se quiser, eu já escrevo o trecho de `src/main.js` que registra o comando e chama `panelManager.showPanel()` no `onStart` do plugin. Deseja que eu gere esse trecho também?```}

