// src/api/patcher.js
// Functions to patch a heading line in the raw markdown body: add/remove the word 'open'

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function patchHeaderText(body, headingMeta, setOpen) {
    // headingMeta: { level, rawText, anchor, tokenIndex }
    // Strategy: find the header line starting with '#' repeated level times and containing the heading's base text.
    // Preserve anchor {#id} placement. If setOpen === true ensure ' open' exists before anchor or EOL; if false remove it.

    const lines = body.split(/\r?\n/);
    const raw = headingMeta.rawText.trim();
    const core = raw.replace(/\{#([A-Za-z0-9\-_:]+)\}\s*$/, '').trim();
    const headingPrefix = '#'.repeat(headingMeta.level);
    const pattern = new RegExp('^\\s*' + escapeRegExp(headingPrefix) + '\\s+' + '(.*?)\\s*$');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const m = line.match(pattern);
        if (!m) continue;
        // m[1] is the heading text part
        const lineText = m[1].trim();
        // check if core is included in lineText (loose match)
        if (!lineText.toLowerCase().includes(core.toLowerCase())) continue;
        // Now we have the heading line index i
        // Separate anchor if present
        const anchorMatch = lineText.match(/\{#([A-Za-z0-9\-_:]+)\}\s*$/);
        const anchor = anchorMatch ? anchorMatch[0] : '';
        let beforeAnchor = anchor ? lineText.slice(0, anchorMatch.index).trim() : lineText.trim();
        // Determine presence of 'open'
        const words = beforeAnchor.split(/\s+/);
        const lastWord = words.length ? words[words.length - 1] : '';
        const hasOpen = lastWord.toLowerCase() === 'open';
        if (setOpen) {
            if (!hasOpen) beforeAnchor = (beforeAnchor + ' open').trim();
        } else {
            if (hasOpen) {
                words.pop();
                beforeAnchor = words.join(' ');
            }
        }
        const newLineText = headingPrefix + ' ' + (beforeAnchor + (anchor ? ' ' + anchor : '')).trim();
        lines[i] = newLineText;
        return lines.join('\n');
    }
    // if not found, return body unchanged
    return body;
}

module.exports = { patchHeaderText };
