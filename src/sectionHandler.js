/* eslint-disable no-undef */

module.exports = {
    default: function (context) {
        const plugin = function (md, _options) {
            const contentScriptId = context.contentScriptId;
            const openKeywordRegex = /\s+open\s*$/;

            // Armazena a pilha de níveis de cabeçalho
            const stack = [];

            // Sobrescreve o renderizador de `heading_open`
            md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
                const token = tokens[idx];
                const level = parseInt(token.tag.substring(1), 10);

                // Fecha seções de nível igual ou superior que estão na pilha
                let closingTags = '';
                while (stack.length > 0 && stack[stack.length - 1] >= level) {
                    stack.pop();
                    closingTags += '</details>';
                }

                // Verifica se a palavra-chave 'open' está presente no conteúdo do título
                const inlineToken = tokens[idx + 1];
                const hasOpen = inlineToken && openKeywordRegex.test(inlineToken.content);
                const openAttr = hasOpen ? ' open' : '';

                // Adiciona o número da linha ao token do cabeçalho para referência no JS
                if (token.map) {
                    token.attrSet('data-line', token.map[0]);
                }

                // Adiciona o estilo para manter o título na mesma linha do marcador <details>
                token.attrSet('style', 'display: inline');

                stack.push(level);

                // Injeta as tags <details> e <summary>
                return `${closingTags}<details class="md-panel" data-content-script-id="${contentScriptId}"${openAttr}><summary>` + self.renderToken(tokens, idx, options);
            };

            // Sobrescreve o renderizador de `heading_close` para fechar o <summary>
            md.renderer.rules.heading_close = (tokens, idx, options, env, self) => {
                return self.renderToken(tokens, idx, options) + '</summary>';
            };

            // Adiciona uma regra no final para fechar todas as tags <details> abertas
            md.core.ruler.after('inline', 'section_closer', (state) => {
                let finalClosingTags = '';
                while (stack.length > 0) {
                    stack.pop();
                    finalClosingTags += '</details>';
                }
                if (finalClosingTags) {
                    const token = new state.Token('html_block', '', 0);
                    token.content = finalClosingTags;
                    state.tokens.push(token);
                }
                // Limpa a pilha para a próxima renderização
                stack.length = 0;
            });
        };

        return {
            plugin: plugin,
            assets: function () {
                return [
                    { name: 'toggle-handler.js' },
                ];
            },
        };
    }
};