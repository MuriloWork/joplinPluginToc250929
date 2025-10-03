import joplin from 'api';
import { ContentScriptType } from 'api/types';

const CONTENT_SCRIPT_ID = 'mdPanelSectionHandler';

joplin.plugins.register({
    onStart: async function () {
        console.info('MDPanel plugin (Content Script version) started!');

        // Registrar o Content Script que irá modificar a renderização do Markdown
        await joplin.contentScripts.register(
            ContentScriptType.MarkdownItPlugin,
            CONTENT_SCRIPT_ID,
            './sectionHandler.js'
        );

        // Ouvir por mensagens vindas do Content Script
        await joplin.contentScripts.onMessage(CONTENT_SCRIPT_ID, async (message: any) => {
            if (message.command === 'sectionToggled') {
                console.log(`MDPanel: Section on line ${message.line} toggled to: ${message.isOpen ? 'open' : 'closed'}`);

                const currentNote = await joplin.workspace.selectedNote();
                if (!currentNote) return;

                const lineIndex = parseInt(message.line, 10);
                if (isNaN(lineIndex)) return; // Ignora se a linha não for um número válido

                const lines = currentNote.body.split('\n');
                if (lineIndex < lines.length) {
                    let line = lines[lineIndex];
                    const wasOpen = line.trim().endsWith(' open');

                    if (message.isOpen && !wasOpen) {
                        // Adiciona ' open' se a seção foi aberta e a palavra-chave não estava lá
                        lines[lineIndex] = line + ' open';
                    } else if (!message.isOpen && wasOpen) {
                        // Remove ' open' se a seção foi fechada e a palavra-chave estava lá
                        lines[lineIndex] = line.replace(/\s*open$/, '');
                    } else {
                        return; // Não faz nada se o estado já estiver correto
                    }

                    const newBody = lines.join('\n');
                    await joplin.data.put(['notes', currentNote.id], null, { body: newBody });
                    console.log(`MDPanel: Note updated for line ${lineIndex}.`);
                }
            }
            return 'Message processed';
        });
    },
});