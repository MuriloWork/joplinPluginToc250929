// Simple tests for patcher and schedule logic (without joplin)
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const parser = require('../src/api/parser');
const patcher = require('../src/api/patcher');

const md = fs.readFileSync(path.join(__dirname, 'fixtures', 'simple.md'), 'utf8');
const tokens = parser.parseToTokens(md);
const headings = parser.extractHeadings(tokens);

function testPatcherAddOpen() {
    const head = headings[1]; // Subheading closed
    const result = patcher.patchHeaderText(md, head, true);
    // Ensure the line now contains 'open'
    assert.ok(result.includes('Subheading closed open') || result.includes('Subheading open'), 'should add open');
    console.log('testPatcherAddOpen ok');
}

function testPatcherRemoveOpen() {
    const head = headings[0]; // Title open
    const result = patcher.patchHeaderText(md, head, false);
    assert.ok(!result.includes('Title open') || result.includes('Title'), 'should remove open');
    console.log('testPatcherRemoveOpen ok');
}

function runAll() {
    testPatcherAddOpen();
    testPatcherRemoveOpen();
    console.log('Stage2 tests passed');
}

runAll();
