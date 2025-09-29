// src/commands.js
// Registers a simple test command that toggles the first heading of the selected note

const parser = require('./api/parser');
const slugUtil = require('./api/slug');
const noteSync = require('./api/noteSync');

async function registerCommands() {
    await joplin.commands.register({
        name: 'mdpanel.toggleTest',
        label: 'Toggle first heading open (test)'
    });

    await joplin.views.menuItems.create('mdpanelToggleTest', 'mdpanel.toggleTest', joplin.views.menuItemLocation.Tools);

    joplin.commands.registerHandler('mdpanel.toggleTest', async () => {
        const note = await joplin.workspace.selectedNote();
        if (!note) return;
        const tokens = parser.parseToTokens(note.body || '');
        const headings = parser.extractHeadings(tokens);
        if (!headings.length) return;
        const first = headings[0];
        const slug = slugUtil.slugify(first.rawText);
        const newOpen = !first.hasOpenFlag;
        noteSync.scheduleToggle(note.id, slug, newOpen);
    });
}

module.exports = { registerCommands };
