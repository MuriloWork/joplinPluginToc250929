import joplin from 'api';
import { ContentScriptType } from 'api/types';
import { togglePanel } from './ui/panelManager';

joplin.plugins.register({
    onStart: async function () {
        console.info('mdpanel plugin started (etapa 3)');

        // TESTE 3: Registrar o content script e o listener de persistência
        // const test3ContentScriptId = 'h3-persistence-test';
        // await joplin.contentScripts.register(
        //     ContentScriptType.MarkdownItPlugin,
        //     test3ContentScriptId,
        //     './refat/test3_plugin.js'
        // );

        // await joplin.contentScripts.onMessage(test3ContentScriptId, async (message) => {
        //     if (message.type !== 'add_timestamp') return;

        //     console.info(`TESTE 3: Mensagem de persistência recebida para H1: "${message.content}"`);

        //     const note = await joplin.workspace.selectedNote();
        //     if (!note) {
        //         console.error('TESTE 3: Nenhuma nota selecionada.');
        //         return;
        //     }

        //     const originalH1 = `# ${message.content}`;
        //     const newH1 = `${originalH1} - Updated: ${new Date().toLocaleTimeString()}`;

        //     const newBody = note.body.split('\n').map(line => {
        //         // We do a simple trim in case of extra whitespace.
        //         // A more robust solution would use regex.
        //         if (line.trim() === originalH1) {
        //             console.info('TESTE 3: Linha do H1 encontrada. Modificando...');
        //             return newH1;
        //         }
        //         return line;
        //     }).join('\n');

        //     if (note.body === newBody) {
        //         console.warn('TESTE 3: Não foi possível encontrar a linha do H1 para modificar.');
        //         return;
        //     }

        //     console.info('TESTE 3: Salvando a nota com o novo conteúdo.');
        //     await joplin.data.put(['notes', note.id], null, { body: newBody });
        // });

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
