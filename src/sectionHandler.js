/* eslint-disable no-undef */

module.exports = {
    default: function (context) {
        return {
            plugin: function (markdownIt, _options) {
                const defaultRender = markdownIt.renderer.rules.heading_open || function (tokens, idx, options, env, self) {
                    return self.renderToken(tokens, idx, options);
                };

                markdownIt.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
                    const token = tokens[idx];
                    // Apenas para títulos de nível 1, como no nosso teste
                    if (token.tag === 'h1') {
                        // token.map[0] contém o número da linha (base 0) do título no markdown
                        const lineNumber = token.map[0];

                        const buttonHtml = ` <button class="md-panel-test-button" data-content-script-id="${context.contentScriptId}" data-line="${lineNumber}">Test</button>`;

                        // Retorna a tag de abertura original e adiciona nosso botão ao lado dela.
                        // O erro estava aqui: o buttonHtml não estava sendo concatenado.
                        return defaultRender(tokens, idx, options, env, self) + buttonHtml;
                    }
                    return defaultRender(tokens, idx, options, env, self);
                };
            },
            assets: function () {
                return [{ name: 'toggle-handler.js' }];
            },
        };
    },
};