import joplin from 'api';
import { ContentScriptType, SettingItemType, ToolbarButtonLocation } from 'api/types';

// Content script for legacy collapsible sections
const LEGACY_CONTENT_SCRIPT_ID = 'mdPanelSectionHandler';

// ID for the new CodeMirror content script
const CM_CONTENT_SCRIPT_ID = 'wordWrapToggler';

const WRAP_COMMAND = 'toggleWordWrap';
const WRAP_SETTING = 'lineWrappingEnabled';

joplin.plugins.register({
    onStart: async function () {
        console.info('MDPanel: Plugin iniciado.');

        // 1. Registra o content script para as seções recolhíveis (legado)
        await joplin.contentScripts.register(
            ContentScriptType.MarkdownItPlugin,
            LEGACY_CONTENT_SCRIPT_ID,
            './sectionHandler.js'
        );

        // 2. Lógica para o botão de quebra de linha

        await joplin.settings.registerSection('wordWrapSettings', {
            label: 'MDPanel: Word Wrap',
            iconName: 'fas fa-text-width',
        });

        await joplin.settings.registerSettings({
            [WRAP_SETTING]: {
                value: true, // Habilitado por padrão
                type: SettingItemType.Bool,
                public: true,
                label: 'Enable line wrapping for notes',
                section: 'wordWrapSettings',
            },
        });

        await joplin.contentScripts.register(
            ContentScriptType.CodeMirrorPlugin,
            CM_CONTENT_SCRIPT_ID,
            './contentScript.js'
        );

        // O content script precisa disso para a inicialização
        await joplin.contentScripts.onMessage(CM_CONTENT_SCRIPT_ID, async (message: any) => {
            if (message === 'getWordWrapState') {
                const settings = await joplin.settings.values([WRAP_SETTING]);
                return settings[WRAP_SETTING];
            }
        });

        await joplin.commands.register({
            name: WRAP_COMMAND,
            label: 'Toggle Word Wrap',
            iconName: 'fas fa-text-width',
            enabledCondition: 'markdownEditorPaneVisible',
            execute: async () => {
                const settings = await joplin.settings.values([WRAP_SETTING]);
                const currentVal = settings[WRAP_SETTING];
                const newVal = !currentVal;
                await joplin.settings.setValue(WRAP_SETTING, newVal);

                // Envia um comando diretamente para o editor com o novo estado
                await joplin.commands.execute('editor.execCommand', {
                    name: 'updateWordWrapState',
                    args: [newVal]
                });
            },
        });

        await joplin.views.toolbarButtons.create('wordWrapToggleButton', WRAP_COMMAND, ToolbarButtonLocation.EditorToolbar);

        console.info('MDPanel: Botão de toggle word wrap adicionado e pronto.');
    },
});
