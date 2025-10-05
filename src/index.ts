import joplin from 'api';
import { ContentScriptType } from 'api/types';

const CONTENT_SCRIPT_ID = 'mdPanelSectionHandler';

joplin.plugins.register({
    onStart: async function () {
        console.info('MDPanel: Plugin iniciado. Registrando content script.');

        // Registra o content script como um plugin markdown-it.
        // Isso injeta nossa lógica de renderização de seções no processo de conversão de Markdown para HTML do Joplin.
        await joplin.contentScripts.register(
            ContentScriptType.MarkdownItPlugin,
            CONTENT_SCRIPT_ID,
            './sectionHandler.js'
        );
    },
});