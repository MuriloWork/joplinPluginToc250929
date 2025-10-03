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

    },
});