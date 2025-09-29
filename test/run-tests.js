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

// Updated testSectionize to reflect the expected nested structure from sectionize
function testSectionize() {
    const md = loadFixture('simple.md');
    const tokens = parser.parseToTokens(md);
    const sections = sectioner.sectionize(tokens);
    // Expect one root section: "Title open"
    assert.strictEqual(sections.length, 1, 'should be 1 root section');
    const root = sections[0];
    assert.strictEqual(root.heading.rawText, 'Title open', 'root heading should be "Title open"');

    // Root should have 2 children: "Subheading closed" and "Another"
    assert.strictEqual(root.children.length, 2, 'root should have 2 children');
    const child1 = root.children[0];
    const child2 = root.children[1];
    assert.strictEqual(child1.heading.rawText, 'Subheading closed', 'first child should be "Subheading closed"');
    assert.strictEqual(child2.heading.rawText, 'Another', 'second child should be "Another"');

    // "Subheading closed" should have one child: "Deep open"
    assert.strictEqual(child1.children.length, 1, 'first child should have 1 child');
    const subchild = child1.children[0];
    assert.strictEqual(subchild.heading.rawText, 'Deep open', 'child of first child should be "Deep open"');
    console.log('testSectionize ok (sections structure validated)');
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
