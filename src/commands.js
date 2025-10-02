import joplin from 'api';
import MarkdownIt from 'markdown-it';
import fs from 'fs';
import path from 'path';
import sectionHandler from './content_scripts/sectionHandler';

const DEBUG_COMMAND_NAME = 'debug.renderNoteToHtml';

/**
 * Registra os comandos da aplicação.
 */
export async function registerCommands() {
    await joplin.commands.register({
        name: DEBUG_COMMAND_NAME,
        label: 'Debug: Render Note to HTML File',
        iconName: 'fas fa-bug',
        execute: async () => {
            try {
                const note = await joplin.workspace.selectedNote();
                if (!note) {
                    console.warn('MDPanel Debug: No note selected.');
                    await joplin.views.dialogs.showMessageBox('Please select a note first.');
                    return;
                }

                // 1. Instanciar markdown-it
                const md = new MarkdownIt();

                // 2. Carregar nosso plugin
                const pluginObject = sectionHandler({ contentScriptId: 'debug' });
                md.use(pluginObject.plugin);

                // 3. Renderizar o corpo da nota
                const env = {}; // O plugin usa 'env' para manter o estado
                const renderedHtml = md.render(note.body, env);

                // 4. Salvar em um caminho absoluto para a pasta de assets do projeto para depuração.
                // AVISO: Este caminho só funcionará no seu ambiente de desenvolvimento.
                const debugFilePath = 'c:\\Users\\muril\\OneDrive\\01 mycloud\\01 sistMu\\10.01 scripts\\2025-09-28 joplin_plugin\\src\\assets\\debug_render.html';

                fs.writeFileSync(debugFilePath, renderedHtml, 'utf8');

                const successMsg = `MDPanel Debug: HTML for note "${note.title}" saved to ${debugFilePath}`;
                console.info(successMsg);
                await joplin.views.dialogs.showMessageBox(successMsg);
            } catch (error) {
                console.error('MDPanel Debug Error:', error);
                await joplin.views.dialogs.showMessageBox(`An error occurred during debug rendering: ${error.message}`);
            }
        },
    });
}