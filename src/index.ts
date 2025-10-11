import joplin from 'api';
import { ContentScriptType, SettingItemType, ToolbarButtonLocation } from 'api/types';

// ID para o content script das seções recolhíveis
const LEGACY_CONTENT_SCRIPT_ID = 'mdPanelSectionHandler';

// ID para o content script do word wrap
const CM_CONTENT_SCRIPT_ID = 'wordWrapToggler';

const WRAP_COMMAND = 'toggleWordWrap';
const WRAP_SETTING = 'lineWrappingEnabled';

joplin.plugins.register({
    onStart: async function () {
        console.info('MDPanel: Plugin iniciado.');

        // --- 1. Funcionalidade: Seções Recolhíveis ---
        await joplin.contentScripts.register(
            ContentScriptType.MarkdownItPlugin,
            LEGACY_CONTENT_SCRIPT_ID,
            './sectionHandler.js'
        );
        console.info('MDPanel: Módulo de seções recolhíveis registrado.');

        // --- 2. Funcionalidade: Toggle Word Wrap ---
        await joplin.settings.registerSection('wordWrapSettings', {
            label: 'MDPanel: Word Wrap',
            iconName: 'fas fa-text-width',
        });

        await joplin.settings.registerSettings({
            [WRAP_SETTING]: {
                value: false, // Desabilitado por padrão
                type: SettingItemType.Bool,
                public: true,
                label: 'Enable line wrapping for notes',
                section: 'wordWrapSettings',
            },
        });

        await joplin.contentScripts.register(
            ContentScriptType.CodeMirrorPlugin,
            CM_CONTENT_SCRIPT_ID,
            './lineWrapContentScript.js' // Usando o nome de arquivo correto e final
        );

        // Listener para o content script obter o estado inicial do word wrap
        await joplin.contentScripts.onMessage(CM_CONTENT_SCRIPT_ID, async (message: any) => {
            if (message === 'getWordWrapState') {
                return await joplin.settings.value(WRAP_SETTING);
            }
        });

        await joplin.commands.register({
            name: WRAP_COMMAND,
            label: 'Toggle Word Wrap',
            iconName: 'fas fa-text-width',
            enabledCondition: 'markdownEditorPaneVisible',
            execute: async () => {
                const currentVal = await joplin.settings.value(WRAP_SETTING);
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
