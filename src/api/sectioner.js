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
            if (tokens[i + 1]) currentSection.tokens.push(tokens[i + 1]);
            // skip ahead: the following heading_close will be handled in loop if present
        } else {
            if (currentSection) currentSection.tokens.push(t);
        }
    }
    return sections;
}

module.exports = { sectionize };
