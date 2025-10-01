import joplin from 'api';
import * as parser from '../api/parser';
import * as sectioner from '../api/sectioner';
import * as slug from '../api/slug';
import * as noteSync from '../api/noteSync';
import { buildCompleteHtml } from './mainHtml.js';

let panelHandle = null;
let isVisible = false;

export async function createPanel() {
    if (panelHandle) return panelHandle;

    panelHandle = await joplin.views.panels.create('mdpanel.viewer');

    // Load the complete, self-contained HTML from our new HTML factory
    const html = await buildCompleteHtml();
    await joplin.views.panels.setHtml(panelHandle, html);

    // Register onMessage to receive toggles from the webview
    await joplin.views.panels.onMessage(panelHandle, async (message) => {
        if (!message || !message.type) return;

        if (message.type === 'toggle') {
            const note = await joplin.workspace.selectedNote();
            if (!note) return { ok: false, reason: 'no_note' };
            
            noteSync.scheduleToggle(note.id, message.slug, message.open);
            return { ok: true };
        }
    });

    return panelHandle;
}

export async function showPanel() {
    const handle = await createPanel();
    await joplin.views.panels.show(handle);
    isVisible = true;
    await refreshPanelForSelectedNote();
}

export async function refreshPanelForSelectedNote() {
    const handle = panelHandle;
    if (!handle || !isVisible) return;

    const note = await joplin.workspace.selectedNote();
    if (!note) {
        // Optionally clear the panel or show a message when no note is selected
        await joplin.views.panels.postMessage(handle, { type: 'init', html: 'Please select a note.' });
        return;
    }

    const tokens = parser.parseToTokens(note.body || '');
    const sections = sectioner.sectionize(tokens);
    const htmlFragment = renderSectionsToHtml(sections);

    // Send the HTML FRAGMENT to the webview. The inlined panel.js will handle inserting it.
    await joplin.views.panels.postMessage(handle, { type: 'init', html: htmlFragment, noteId: note.id });
}

function renderSectionsToHtml(sections) {
    function renderSection(sec) {
        const headingText = sec.heading.rawText;
        const openAttr = sec.heading.hasOpenFlag ? ' open' : '';
        let inner = '';
        
        const md = parser.md;
        const tokens = sec.tokens;
        inner += md.renderer.render(tokens, md.options, {});

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
    isVisible = false;
}

export async function togglePanel() {
    if (isVisible) {
        await hidePanel();
    } else {
        await showPanel();
    }
}