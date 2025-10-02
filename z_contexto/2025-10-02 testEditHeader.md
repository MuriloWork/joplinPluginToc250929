
- `index.ts`

    ```typescript
    import joplin from 'api';
    import { ContentScriptType } from 'api/types';
    import { registerCommands } from './commands';

    const CONTENT_SCRIPT_ID_TEST2 = 'test2_plugin';
    const CONTENT_SCRIPT_ID_TEST3 = 'test3_plugin';

    joplin.plugins.register({
        onStart: async function () {
            console.info('Test Plugin (Content Script version) started!');

            // TESTE 2: Registrar o Content Script que adiciona o botão "Test Msg"
            // Este script (test2_plugin.js) também carrega o test2_sender.js através da função 'assets'.
            await joplin.contentScripts.register(
                ContentScriptType.MarkdownItPlugin,
                CONTENT_SCRIPT_ID_TEST2,
                './refat/test2_plugin.js' // Caminho atualizado para o script dentro da pasta 'refat'
            );

            // TESTE 3: Registrar o Content Script que adiciona o botão "Test Persistence"
            await joplin.contentScripts.register(
                ContentScriptType.MarkdownItPlugin,
                CONTENT_SCRIPT_ID_TEST3,
                './refat/test3_plugin.js'
            );

            // Registrar todos os comandos da aplicação
            await registerCommands();

            // TESTE 2: Ouvir por mensagens vindas do Content Script
            // A mensagem enviada por test2_sender.js tem o tipo 'h1_button_click'
            await joplin.contentScripts.onMessage(CONTENT_SCRIPT_ID_TEST2, async (message: any) => {
                if (message.type === 'h1_button_click') {
                    console.log(`Test Plugin: Message received from content script!`);
                    console.log(`H1 content: ${message.content}`);
                }
            });

            // TESTE 3: Ouvir por mensagens de persistência
            await joplin.contentScripts.onMessage(CONTENT_SCRIPT_ID_TEST3, async (message: any) => {
                if (message.type === 'add_timestamp') {
                    console.log(`Test 3 Plugin: Persistence message received for H1: "${message.content}"`);
                    const currentNote = await joplin.workspace.selectedNote();
                    if (currentNote) {
                        const lines = currentNote.body.split('\n');
                        // Encontra o índice da linha que é um H1 e contém o texto do botão clicado.
                        const lineIndex = lines.findIndex(line => line.trim().startsWith('# ') && line.includes(message.content));

                        if (lineIndex !== -1) {
                            // Modifica apenas a linha encontrada
                            lines[lineIndex] = `${lines[lineIndex]} - (Edited @ ${new Date().toLocaleTimeString()})`;
                            const newBody = lines.join('\n');
                            await joplin.data.put(['notes', currentNote.id], null, { body: newBody });
                            console.log(`Test 3 Plugin: Successfully edited line ${lineIndex}.`);
                        } else {
                            console.warn(`Test 3 Plugin: Could not find line for H1: "${message.content}". Appending to end as fallback.`);
                            const newBody = currentNote.body + `\n\n- FAILED TO FIND LINE. Timestamp added for "${message.content}" at ${new Date().toISOString()}`;
                            await joplin.data.put(['notes', currentNote.id], null, { body: newBody });
                        }
                    }
                }
            });
        },
    });
    ```

- `test2_plugin.js`
    ```javascript
    // refat/test2_plugin.js
    module.exports = {
        default: function(context) {
            // O objeto de contexto nos dá o ID do nosso script, necessário para enviar a mensagem de volta.
            const contentScriptId = context.contentScriptId;
            let lastH1Content = '';

            return {
                plugin: function(md, options) {
                    // Etapa 1: Embrulhar a regra 'heading_open' para capturar o texto do H1.
                    const defaultHeadingOpen = md.renderer.rules.heading_open || function(tokens, idx, options, env, self) { return self.renderToken(tokens, idx, options); };
                    md.renderer.rules.heading_open = function(tokens, idx, options, env, self) {
                        if (tokens[idx].tag === 'h1') {
                            // O conteúdo de texto de um cabeçalho está no próximo token, do tipo 'inline'.
                            lastH1Content = tokens[idx + 1].content;
                        }
                        return defaultHeadingOpen(tokens, idx, options, env, self);
                    };

                    // Etapa 2: Embrulhar a regra 'heading_close' para injetar o HTML do botão.
                    const defaultHeadingClose = md.renderer.rules.heading_close || function(tokens, idx, options, env, self) { return self.renderToken(tokens, idx, options); };
                    md.renderer.rules.heading_close = function(tokens, idx, options, env, self) {
                        // Apenas adiciona o botão se a tag de fechamento for de um H1.
                        if (tokens[idx].tag === 'h1') {
                            // Escapa o conteúdo do H1 para que possa ser usado com segurança dentro de uma string JavaScript no HTML.
                            const escapedContent = lastH1Content.replace(/'/g, "\'").replace(/"/g, "&quot;");
                            const buttonHtml = ` <button onclick="sendTestMessage('${contentScriptId}', '${escapedContent}')">Test Msg</button>`;
                            
                            // Retorna o HTML do botão + a tag de fechamento original (ex: "</h1">").
                            return buttonHtml + defaultHeadingClose(tokens, idx, options, env, self);
                        }
                        return defaultHeadingClose(tokens, idx, options, env, self);
                    };
                },
                assets: function() {
                    // Diz ao Joplin para carregar nosso script 'sender' na webview.
                    return [{ name: 'test2_sender.js' }];
                },
            }
        }
    }
    ```

- `test2_sender.js`

    ```javascript
    // refat/test2_sender.js
    // Esta função será chamada pelo evento onclick do botão.
    // Ela envia uma mensagem para o plugin principal com o conteúdo do H1.
    function sendTestMessage(contentScriptId, h1Content) {
        if (webviewApi && webviewApi.postMessage) {
            webviewApi.postMessage(contentScriptId, {
                type: 'h1_button_click',
                content: h1Content,
            });
        }
    }
    ```

- `test3_plugin.js`

    ```javascript
    // refat/test3_plugin.js
    module.exports = {
        default: function(context) {
            const contentScriptId = context.contentScriptId;
            let lastH1Content = '';

            return {
                plugin: function(md, options) {
                    const defaultHeadingOpen = md.renderer.rules.heading_open || function(tokens, idx, options, env, self) { return self.renderToken(tokens, idx, options); };
                    md.renderer.rules.heading_open = function(tokens, idx, options, env, self) {
                        if (tokens[idx].tag === 'h1') {
                            lastH1Content = tokens[idx + 1].content;
                        }
                        return defaultHeadingOpen(tokens, idx, options, env, self);
                    };

                    const defaultHeadingClose = md.renderer.rules.heading_close || function(tokens, idx, options, env, self) { return self.renderToken(tokens, idx, options); };
                    md.renderer.rules.heading_close = function(tokens, idx, options, env, self) {
                        if (tokens[idx].tag === 'h1') {
                            const escapedContent = lastH1Content.replace(/'/g, "'").replace(/"/g, "&quot;");
                            const buttonHtml = ` <button onclick="sendPersistenceTest('${contentScriptId}', '${escapedContent}')">Test Persistence</button>`;
                            return buttonHtml + defaultHeadingClose(tokens, idx, options, env, self);
                        }
                        return defaultHeadingClose(tokens, idx, options, env, self);
                    };
                },
                assets: function() {
                    return [{ name: 'test3_sender.js' }];
                },
            }
        }
    }
    ```

- `test3_sender.js`

    ```javascript
    // refat/test3_sender.js
    function sendPersistenceTest(contentScriptId, h1Content) {
        if (webviewApi && webviewApi.postMessage) {
            webviewApi.postMessage(contentScriptId, {
                type: 'add_timestamp',
                content: h1Content,
            });
        }
    }
    ```
