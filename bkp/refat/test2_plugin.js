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