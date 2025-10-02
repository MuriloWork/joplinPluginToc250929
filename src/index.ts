import joplin from 'api';
import { ContentScriptType } from 'api/types';
import { registerCommands } from './commands';

const CONTENT_SCRIPT_ID = 'mdPanelSectionHandler';

joplin.plugins.register({
    onStart: async function () {
        console.info('MDPanel plugin (Content Script version) started!');

        // Registrar o Content Script que irá modificar a renderização do Markdown
        await joplin.contentScripts.register(
            ContentScriptType.MarkdownItPlugin,
            CONTENT_SCRIPT_ID,
            './content_scripts/sectionHandler.js'
        );

        // Registrar todos os comandos da aplicação
        await registerCommands();

        // Ouvir por mensagens vindas do Content Script
        await joplin.contentScripts.onMessage(CONTENT_SCRIPT_ID, async (message: any) => {
            if (message.command === 'testButtonClick') {
                console.log(`MDPanel: Message received from content script to update line: ${message.line}`);

                const note = await joplin.workspace.selectedNote();
                if (!note) return;

                const lineIndex = parseInt(message.line, 10);
                if (isNaN(lineIndex)) return 'Invalid line number';

                const lines = note.body.split('\n');
                if (lineIndex < lines.length) {
                    const timestamp = new Date().toLocaleTimeString();
                    lines[lineIndex] = `${lines[lineIndex]} [Updated: ${timestamp}]`;

                    const newBody = lines.join('\n');
                    await joplin.data.put(['notes', note.id], null, {
                        body: newBody
                    });
                    console.log('MDPanel: Note updated successfully.');
                }
            }
            return 'Message processed';
        });
    },
});