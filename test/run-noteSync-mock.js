// test/run-noteSync-mock.js
// Harness to test noteSync.applyToggleNow locally using the mock joplin above.
// Place this file in your project root and run: node test/run-noteSync-mock.js

require('./mock-joplin'); // -> sets global.joplin
const fs = require('fs');
const path = require('path');

// adjust paths if running from project root
const parser = require('../src/api/parser');
const slug = require('../src/api/slug');
const noteSync = require('../src/api/noteSync');

// seed note:
const mdPath = path.join(__dirname, 'fixtures', 'simple.md');
if (!fs.existsSync(mdPath)) {
  console.error('Fixture not found at', mdPath);
  process.exit(1);
}
const md = fs.readFileSync(mdPath, 'utf8');
const noteId = 'note-1';
joplin.data.__seed({ id: noteId, body: md, updated_time: Date.now() });

// compute a slug from the first heading to test:
const tokens = parser.parseToTokens(md);
const headings = parser.extractHeadings(tokens);
if (!headings.length) {
  console.error('No headings found in fixture');
  process.exit(1);
}
const firstSlug = slug.slugify(headings[0].rawText);
console.log('Testing applyToggleNow on noteId=', noteId, 'slug=', firstSlug);

// Call applyToggleNow to remove 'open' from first heading (if present)
noteSync.applyToggleNow(noteId, firstSlug, false).then(res => {
  console.log('applyToggleNow result:', res);
  // read back and show first 200 chars of body
  joplin.data.get(['notes', noteId]).then(note => {
    console.log('--- NEW BODY (first 400 chars) ---\\n');
    console.log(note.body.substring(0, 400));
    console.log('\\n--- end ---');
  }).catch(err => console.error('readback error', err));
}).catch(err => console.error(err));
