// src/state/sessionCache.js
// Simple in-memory cache per noteId

const cache = new Map();

function get(noteId) {
    const v = cache.get(noteId);
    if (!v) return null;
    return v;
}

function set(noteId, data) {
    cache.set(noteId, { ...data, updatedAt: Date.now() });
}

function invalidate(noteId) {
    cache.delete(noteId);
}

module.exports = { get, set, invalidate };
