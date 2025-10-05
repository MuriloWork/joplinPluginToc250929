/* eslint-disable no-undef */

module.exports = function (context) {
    return {
        plugin: function (md, _options) {
            const fence = md.renderer.rules.fence;
            md.renderer.rules.fence = function (tokens, idx, options, env, slf) {
                const token = tokens[idx];
                if (token.info === 'md-panel') {
                    return '';
                }
                return fence(tokens, idx, options, env, slf);
            };

            let levelStack = [];

            function findLevel(level, stack) {
                for (let i = 0; i < stack.length; i++) {
                    if (stack[i].level === level) return i;
                }
                return -1;
            }

            md.core.ruler.push('md_panel_rule', function (state) {
                let tokens = state.tokens;
                let newTokens = [];
                let listLevelStack = [];
                for (let i = 0; i < tokens.length; i++) {
                    const token = tokens[i];
                    if (token.type === 'heading_open') {
                        const level = parseInt(token.tag.substring(1));
                        let closeTags = '';
                        while (levelStack.length > 0 && level <= levelStack[levelStack.length - 1]) {
                            closeTags += '</details>';
                            levelStack.pop();
                        }

                        const contentToken = tokens[i + 1];
                        const isOpen = contentToken.content.trim().endsWith(' open');
                        const openAttr = isOpen ? ' open' : '';

                        const line = token.map[0];
                        token.attrSet('data-line', line);
                        // Adiciona o estilo para o título ficar na mesma linha do triângulo
                        token.attrSet('style', 'display: inline;');

                        const openTag = new state.Token('html_inline', '', 0);
                        openTag.content = `${closeTags}<details class="md-panel" data-content-script-id="${context.contentScriptId}" ${openAttr}><summary>`;
                        newTokens.push(openTag);
                        newTokens.push(token);
                        levelStack.push(level);
                    } else if (token.type === 'heading_close') {
                        newTokens.push(token);
                        const closeTag = new state.Token('html_inline', '', 0);
                        closeTag.content = '</summary>';
                        newTokens.push(closeTag);
                    } else if (token.type === 'list_item_open') {
                        newTokens.push(token);
                    } else if (token.type === 'paragraph_open' && i > 0 && tokens[i - 1].type === 'list_item_open') {
                        // A sequência de tokens para um item de lista com filhos é:
                        // (list_item_open) -> paragraph_open -> inline -> paragraph_close -> bullet_list_open
                        const hasChildren = (i + 3 < tokens.length && (tokens[i + 3].type === 'bullet_list_open' || tokens[i + 3].type === 'ordered_list_open'));

                        if (hasChildren) {
                            const inlineToken = tokens[i + 1]; // O token com o texto do item
                            const isOpen = inlineToken.content.trim().endsWith(' open');
                            const openAttr = isOpen ? ' open' : '';
                            const line = tokens[i - 1].map[0];

                            const openTag = new state.Token('html_inline', '', 0);
                            openTag.content = `<details class="md-panel-list" data-content-script-id="${context.contentScriptId}" ${openAttr}><summary>`;
                            newTokens.push(openTag);

                            // Adiciona o data-line e o estilo ao parágrafo
                            token.attrSet('data-line', line);
                            token.attrSet('style', 'display: inline;');
                            newTokens.push(token);
                        } else {
                            newTokens.push(token);
                        }
                    } else if (token.type === 'paragraph_close' && i > 1 && tokens[i - 2].type === 'list_item_open' && tokens[i - 1].attrGet('data-line')) {
                        // Fecha o summary apenas se ele foi aberto para um item com filhos
                        newTokens.push(token);
                        const closeSummary = new state.Token('html_inline', '', 0);
                        closeSummary.content = '</summary>';
                        newTokens.push(closeSummary);
                    } else if (token.type === 'list_item_close') {
                        // Se o item anterior era um item com filhos, precisamos fechar o <details>
                        const prevPara = tokens[i - 2];
                        if (prevPara && prevPara.attrGet('data-line')) {
                            const closeTag = new state.Token('html_inline', '', 0);
                            closeTag.content = '</details>';
                            newTokens.push(closeTag);
                        }
                        newTokens.push(token);
                    } else {
                        newTokens.push(token);
                    }
                }

                if (levelStack.length > 0) {
                    const finalClose = new state.Token('html_inline', '', 0);
                    finalClose.content = '</details>'.repeat(levelStack.length);
                    newTokens.push(finalClose);
                    levelStack = [];
                }

                state.tokens = newTokens;
            });
        },
        assets: function () {
            return [{ name: 'toggle-handler.js' }];
        },
    };
};