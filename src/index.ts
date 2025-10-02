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
            './sectionHandler.js' // Caminho correto relativo à raiz do plugin após a compilação
        );

        // Registrar todos os comandos da aplicação
        await registerCommands();

        // Ouvir por mensagens vindas do Content Script
        await joplin.contentScripts.onMessage(CONTENT_SCRIPT_ID, async (message: any) => {
            if (message.command === 'testButtonClick') {
                console.log(`MDPanel: Message received from content script for H1: "${message.content}"`);

                const currentNote = await joplin.workspace.selectedNote();
                if (currentNote) {
                    const lines = currentNote.body.split('\n');
                    // Encontra o índice da linha que é um H1 e contém o texto do botão clicado.
                    const lineIndex = lines.findIndex(line => line.trim().startsWith('# ') && line.includes(message.content));

                    if (lineIndex !== -1) {
                        const timestamp = new Date().toLocaleTimeString();
                        lines[lineIndex] = `${lines[lineIndex]} [Updated: ${timestamp}]`;

                        const newBody = lines.join('\n');
                        await joplin.data.put(['notes', currentNote.id], null, { body: newBody });
                        console.log(`MDPanel: Successfully edited line ${lineIndex}.`);
                    } else {
                        console.warn(`MDPanel: Could not find line for H1: "${message.content}".`);
                    }
                }
            }
            return 'Message processed';
        });
    },
});