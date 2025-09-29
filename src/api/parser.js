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
