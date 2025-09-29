// src/api/noteSync.js
// Implements scheduleToggle(noteId, slug, open) that debounces writes and performs safe read-modify-write

const parser = require('./parser');
const slugUtil = require('./slug');
const patcher = require('./patcher');
const sessionCache = require('../state/sessionCache');

const pending = new Map(); // noteId -> { timer, lastRequested }
const DEFAULT_DEBOUNCE = 800;

async function readNoteBody(noteId) {
    // In plugin runtime, use joplin.data.get(['notes', noteId], { fields: ['body','id','updated_time'] })
    if (!global.joplin || !joplin.data) throw new Error('joplin.data API not available in this environment');
    const note = await joplin.data.get(['notes', noteId], { fields: ['body', 'id', 'updated_time'] });
    return note;
}

async function writeNoteBody(noteId, newBody) {
    if (!global.joplin || !joplin.data) throw new Error('joplin.data API not available in this environment');
    await joplin.data.put(['notes', noteId], null, { body: newBody });
}

async function applyToggleNow(noteId, slug, openFlag) {
    // read note fresh
    const note = await readNoteBody(noteId);
    const body = note.body || '';
    const tokens = parser.parseToTokens(body);
    const matched = slugUtil.matchHeaderBySlug(tokens, slug);
    if (!matched) {
        console.warn('applyToggleNow: header not found for slug', slug);
        return { ok: false, reason: 'not_found' };
    }
    // patch body
    const newBody = patcher.patchHeaderText(body, matched, openFlag);
    if (newBody === body) return { ok: true, reason: 'no_change' };
    // write safely
    await writeNoteBody(noteId, newBody);
    // invalidate cache
    sessionCache.invalidate(noteId);
    return { ok: true };
}

function scheduleToggle(noteId, slug, openFlag, debounceMs = DEFAULT_DEBOUNCE) {
    // store last requested action, restart timer
    if (pending.has(noteId)) {
        const p = pending.get(noteId);
        clearTimeout(p.timer);
    }
    const timer = setTimeout(async () => {
        try {
            const result = await applyToggleNow(noteId, slug, openFlag);
            // you can emit events or callbacks here
        } catch (e) {
            console.error('Error applying toggle:', e);
        } finally {
            pending.delete(noteId);
        }
    }, debounceMs);
    pending.set(noteId, { timer, lastRequested: { slug, openFlag } });
}

module.exports = { scheduleToggle, applyToggleNow };
