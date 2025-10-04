/* eslint-disable no-undef */

module.exports = {
    default: function (context) {
        const plugin = function (md, _options) {
            const contentScriptId = context.contentScriptId;
            const openKeywordRegex = /\s+open\s*$/;

            // Armazena a pilha de níveis de cabeçalho
            const stack = [];
            // Rastreia se estamos dentro de um item de lista que foi convertido para <details>
            // e precisa ter seu <summary> e <details> fechados.
            let listDetailsToClose = null;

            const originalListItemOpen = md.renderer.rules.list_item_open || function (tokens, idx, options, env, self) { return self.renderToken(tokens, idx, options); };
            const originalBulletListOpen = md.renderer.rules.bullet_list_open || function (tokens, idx, options, env, self) { return self.renderToken(tokens, idx, options); };
            const originalListItemClose = md.renderer.rules.list_item_close || function (tokens, idx, options, env, self) { return self.renderToken(tokens, idx, options); };
            const originalBulletListClose = md.renderer.rules.bullet_list_close || function (tokens, idx, options, env, self) { return self.renderToken(tokens, idx, options); };

            const originalHeadingOpen = md.renderer.rules.heading_open || function (tokens, idx, options, env, self) { return self.renderToken(tokens, idx, options); };

            // Sobrescreve o renderizador de `heading_open`
            md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
                const token = tokens[idx];
                const level = parseInt(token.tag.substring(1), 10);

                let closingTags = '';
                if (listDetailsToClose) {
                    closingTags += '</summary></details>';
                    listDetailsToClose = null;
                }

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

            // Sobrescreve o renderizador de `list_item_open`
            md.renderer.rules.list_item_open = (tokens, idx, options, env, self) => {
                const currentToken = tokens[idx];
                let hasChildren = false;

                // Verifica os tokens seguintes para ver se uma nova lista começa
                // antes do item de lista atual ser fechado.
                for (let i = idx + 1; i < tokens.length; i++) {
                    if (tokens[i].type === 'list_item_close' && tokens[i].level === currentToken.level) break;
                    if (tokens[i].type === 'bullet_list_open' || tokens[i].type === 'ordered_list_open') {
                        hasChildren = true;
                        break;
                    }
                }

                if (hasChildren) {
                    // O conteúdo do item de lista está no token 'inline', que vem depois de 'list_item_open' e 'paragraph_open'.
                    const inlineToken = tokens[idx + 2];

                    if (!inlineToken || inlineToken.type !== 'inline') return originalListItemOpen(tokens, idx, options, env, self);

                    let hasOpen = false;
                    // Condição 1: Verifica se a linha inteira termina com "open" (caso padrão)
                    if (openKeywordRegex.test(inlineToken.content)) {
                        hasOpen = true;
                    } else if (inlineToken.children) {
                        // Condição 2: Verifica se o texto dentro de um link termina com "open" (caso do TOC)
                        const linkTextToken = inlineToken.children.find(t => t.type === 'text');
                        if (linkTextToken && openKeywordRegex.test(linkTextToken.content)) {
                            hasOpen = true;
                        }
                    }

                    const openAttr = hasOpen ? ' open' : '';

                    if (currentToken.map) {
                        // Adicionamos o data-line ao parágrafo que virá dentro do summary
                        // para que o toggle-handler possa encontrá-lo.
                        const pToken = tokens[idx + 1];
                        pToken.attrSet('data-line', currentToken.map[0]);
                    }

                    // Marca que o próximo bullet_list_open/close deve fechar este item.
                    listDetailsToClose = {
                        level: currentToken.level,
                    };

                    // Injeta <details> e <summary> antes do item de lista.
                    // O </summary> será adicionado antes da sub-lista começar.
                    // Construímos o <li> manualmente para evitar a duplicação.
                    return `<li><details class="md-panel-list" data-content-script-id="${contentScriptId}"${openAttr}><summary>`;
                }

                return originalListItemOpen(tokens, idx, options, env, self);
            };

            md.renderer.rules.list_item_close = (tokens, idx, options, env, self) => {
                // Se o item anterior abriu um <details>, nós já criamos o <li> manualmente.
                // Então, aqui, só precisamos fechar o </li>.
                return listDetailsToClose ? '</li>' : originalListItemClose(tokens, idx, options, env, self);
            };

            // Sobrescreve a abertura de uma lista para fechar o <summary> se necessário
            md.renderer.rules.bullet_list_open = (tokens, idx, options, env, self) => {
                let closingSummary = '';
                // Se estamos dentro de um item de lista <details> e o nível da nova lista
                // é maior (mais aninhado), então esta é a sub-lista. Fechamos o <summary>.
                if (listDetailsToClose && tokens[idx].level > listDetailsToClose.level) {
                    closingSummary = '</summary>';
                }
                return closingSummary + originalBulletListOpen(tokens, idx, options, env, self);
            };

            // Sobrescreve o fechamento de uma lista para fechar o <details> se necessário
            md.renderer.rules.bullet_list_close = (tokens, idx, options, env, self) => {
                let closingDetails = '';
                // Se estamos dentro de um item de lista <details> e o nível da lista que está fechando
                // é o da nossa sub-lista, fechamos o <details> e resetamos o estado.
                if (listDetailsToClose && tokens[idx].level === listDetailsToClose.level + 1) {
                    closingDetails = '</details>';
                    listDetailsToClose = null;
                }
                return originalBulletListClose(tokens, idx, options, env, self) + closingDetails;
            };

            // Regra de Core para remover o bloco de frontmatter (deve rodar antes das outras)
            md.core.ruler.after('inline', 'frontmatter_remover', (state) => {
                const tokens = state.tokens;
                // O padrão do frontmatter é: hr, paragraph_open, inline, paragraph_close, hr
                // Verificamos se o primeiro token é um 'hr' na primeira linha.
                if (tokens.length > 4 && tokens[0].type === 'hr' && tokens[0].map[0] === 0) {
                    // Encontra o índice do 'hr' de fechamento
                    let endIdx = -1;
                    for (let i = 1; i < tokens.length; i++) {
                        if (tokens[i].type === 'hr') {
                            endIdx = i;
                            break;
                        }
                    }

                    if (endIdx !== -1) {
                        console.log(`MDPanel: Frontmatter detectado. Removendo ${endIdx + 1} tokens.`);
                        // Remove todos os tokens do início até o 'hr' de fechamento.
                        tokens.splice(0, endIdx + 1);
                    }
                }
                return true;
            });

            // Regra de Core para pré-processar os tokens e lidar com a exceção do <br>
            md.core.ruler.after('inline', 'br_section_fixer', (state) => {
                const tokens = state.tokens;
                for (let i = 0; i < tokens.length - 1; i++) {
                    const currentToken = tokens[i];
                    const nextToken = tokens[i + 1];

                    // Procura pelo padrão: html_block com <br> seguido por heading_open
                    if (currentToken.type === 'html_block' && currentToken.content.includes('<br>') && nextToken.type === 'heading_open') {
                        // A pilha (stack) é preenchida durante a renderização, então aqui ela reflete o estado da renderização ANTERIOR.
                        // Se encontrarmos o padrão, substituímos o token <br> para fechar a seção anterior.
                        // A verificação da pilha (stack) é removida pois a regra de core roda antes da de renderização.
                        console.log(`MDPanel: Padrão <br> + heading encontrado. Substituindo token <br> por </details><br> antes do token com map [${nextToken.map.join(', ')}].`);

                        // Cria um novo token para fechar a seção e adicionar o <br>
                        const replacementToken = new state.Token('html_block', '', 0);
                        replacementToken.content = '</details><br>';

                        // Substitui o token <br> original pelo novo token
                        tokens[i] = replacementToken;
                        // Não precisamos mais do stack.pop() aqui, pois a pilha será gerenciada pela regra section_closer no final.
                    }
                }
                return true;
            });

            md.core.ruler.after('inline', 'section_closer', (state) => {
                let finalClosingTags = '';
                while (stack.length > 0) {
                    stack.pop();
                    finalClosingTags += '</details>';
                }

                if (listDetailsToClose) {
                    finalClosingTags += '</summary></details>';
                    listDetailsToClose = null;
                }

                if (finalClosingTags) {
                    const token = new state.Token('html_block', '', 0);
                    token.content = finalClosingTags;
                    state.tokens.push(token);
                }
                // Limpa a pilha para a próxima renderização
                stack.length = 0;
                listDetailsToClose = null;
            });
        };

        return {
            plugin: plugin,
            assets: function () {
                return [
                    // O script que lida com a comunicação e a lógica de UI na WebView.
                    { name: 'toggle-handler.js' },
                    // O CSS que controla a aparência do plugin ligado/desligado.
                    { name: 'section-styles.css' },
                ];
            },
        };
    }
};