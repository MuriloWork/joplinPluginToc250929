import joplin from 'api';
import { togglePanel } from './ui/panelManager';

joplin.plugins.register({
    onStart: async function () {
        console.info('mdpanel plugin started (etapa 3)');

        // Registrar comando para abrir/fechar painel de teste
        await joplin.commands.register({
            name: 'mdpanel.toggleTest',
            label: 'Toggle MDPanel Test',
            execute: async () => {
                await togglePanel();
            },
        });
    },
});
