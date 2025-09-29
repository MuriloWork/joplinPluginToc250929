import joplin from 'api';
import * as parser from '../api/parser';
import * as sectioner from '../api/sectioner';
import * as slug from '../api/slug';
import * as noteSync from '../api/noteSync';

let panelHandle = null;
let isVisible = false; // New state variable

export async function createPanel() {
    if (panelHandle) return panelHandle;
    panelHandle = await joplin.views.panels.create('mdpanel.viewer');
    // Load shell HTML
    const html = await loadShellHtml();
    await joplin.views.panels.setHtml(panelHandle, html);
    // Add CSS
    await joplin.views.panels.addCss(panelHandle, 'web/styles.css');
    // Add DOMPurify (optional) - copy dompurify.min.js to web/vendor and reference below
    await joplin.views.panels.addScript(panelHandle, 'web/vendor/dompurify.min.js');
    await joplin.views.panels.addScript(panelHandle, 'web/panel.js'); // Ensure panel.js is loaded
    // Register onMessage to receive toggles
    await joplin.views.panels.onMessage(panelHandle, async (message) => {
        if (!message || !message.type) return;
        if (message.type === 'toggle') {
            // message: { type:'toggle', slug, open }
            const note = await joplin.workspace.selectedNote();
            if (!note) return { ok: false, reason: 'no_note' };
            // schedule toggle (debounced) via noteSync
            noteSync.scheduleToggle(note.id, message.slug, message.open);
            return { ok: true };
        }
    });
    return panelHandle;
}

async function loadShellHtml() {
    // The HTML content is now injected as a global variable by Webpack.
    return __JOPLIN_WEBVIEW_HTML__;
}

export async function showPanel() {
    const handle = await createPanel();
    await joplin.views.panels.show(handle);
    isVisible = true; // Update state
    // trigger initial render for selected note
    await refreshPanelForSelectedNote();
}

export async function refreshPanelForSelectedNote() {
    const handle = panelHandle;
    if (!handle) return;
    const note = await joplin.workspace.selectedNote();
    if (!note) return;
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
        const md = parser.md; // Use imported parser.md
        const tokens = sec.tokens;
        inner += md.renderer.render(tokens, md.options, {});
        // render children
        for (const c of sec.children) {
            inner += renderSection(c);
        }
        return `<details${openAttr} data-slug="${slug.slugify(headingText)}"><summary>${escapeHtml(headingText)}</summary>${inner}</details>`;
    }
    let out = '';
    for (const s of sections) out += renderSection(s);
    return out;
}

function escapeHtml(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function hidePanel() {
    if (!panelHandle) return;
    await joplin.views.panels.hide(panelHandle);
    isVisible = false; // Update state
}

export async function togglePanel() {
    if (isVisible) { // Use isVisible state
        await hidePanel();
    } else {
        await showPanel();
    }
}
