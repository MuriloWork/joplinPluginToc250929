import joplin from 'api';
import { ContentScriptType, ToolbarButtonLocation } from 'api/types';

const CONTENT_SCRIPT_ID = 'mdPanelSectionHandler';

joplin.plugins.register({
    onStart: async function () {
        // Variável para notificar o script da webview sobre mudanças na configuração.
        // Funciona como um "semáforo" para o long-polling.
        let onSettingsChange: () => void = () => { };

        console.info('MDPanel plugin started!');

        // --- REGISTRO DAS CONFIGURAÇÕES, COMANDOS E BOTÃO ---

        // 1. Registrar a seção de configurações do plugin
        await joplin.settings.registerSection('mdPanelSection', {
            label: 'Markdown Panels',
            iconName: 'fas fa-layer-group',
        });

        // 2. Registrar a configuração para o estado do plugin
        await joplin.settings.registerSettings({
            'mdPanelPluginEnabled': {
                value: true,
                type: 2, // Boolean
                section: 'mdPanelSection',
                public: true,
                label: 'Enable Markdown Panels',
            },
        });

        // 3. Registrar o comando para alternar o estado
        await joplin.commands.register({
            name: 'toggleMdPanel',
            label: 'Toggle Markdown Panels',
            execute: async () => {
                const currentVal = await joplin.settings.value('mdPanelPluginEnabled');
                const newVal = !currentVal;
                await joplin.settings.setValue('mdPanelPluginEnabled', newVal);
            },
        });

        // 4. Criar o botão na barra de ferramentas do editor
        await joplin.views.toolbarButtons.create('mdPanelToggleButton', 'toggleMdPanel', ToolbarButtonLocation.NoteToolbar);

        // Registrar o Content Script que irá modificar a renderização do Markdown
        await joplin.contentScripts.register(
            ContentScriptType.MarkdownItPlugin,
            CONTENT_SCRIPT_ID,
            './sectionHandler.js' // A função register aceita apenas 3 argumentos.
        );

        // Ouve por mudanças na nossa configuração específica
        joplin.settings.onChange(async (event: any) => {
            if (event.keys.includes('mdPanelPluginEnabled')) {
                onSettingsChange();
            }
        });

        // Adiciona o "ouvinte" para responder aos pedidos do Content Script
        await joplin.contentScripts.onMessage(CONTENT_SCRIPT_ID, async (message: any) => {
            if (message.name === 'getSettingValue') {
                return await joplin.settings.value(message.key);
            }

            if (message.name === 'waitForSettingChange') {
                // O script da webview está pedindo para ser notificado da próxima mudança.
                // Retornamos uma Promise que só será resolvida quando a configuração mudar.
                return new Promise<void>(resolve => {
                    // Armazena a função 'resolve' para que possa ser chamada pelo 'onChange' da configuração.
                    const lastOnSettingsChange = onSettingsChange;
                    onSettingsChange = () => { lastOnSettingsChange(); resolve(); };
                });
            }
        });
    },
});