// src/api/slug.js
// Simple slugify consistent: lowercase, remove accents, replace non-alnum by '-'

function slugify(text) {
    if (!text) return '';
    // remove explicit anchor token if present
    let t = text.replace(/\{#([A-Za-z0-9\-_:]+)\}\s*$/, '').trim();
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
