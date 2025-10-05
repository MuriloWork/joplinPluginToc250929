/* eslint-disable no-undef */

module.exports = {
    default: function (context) {
        const plugin = function (md, _options) {
            const contentScriptId = context.contentScriptId;
            const openKeywordRegex = /\s+open\s*$/;

            // Armazena a pilha de níveis de cabeçalho (ex: 1 para h1, 2 para h2) para controlar o aninhamento das seções <details>.
            const stack = [];
            // Rastreia o estado de um item de lista que foi convertido para <details> e precisa ser fechado posteriormente.
            let listDetailsToClose = null;

            // Salva as regras de renderização originais para podermos chamá-las como fallback.
            const originalListItemOpen = md.renderer.rules.list_item_open || function (tokens, idx, options, env, self) { return self.renderToken(tokens, idx, options); };
            const originalBulletListOpen = md.renderer.rules.bullet_list_open || function (tokens, idx, options, env, self) { return self.renderToken(tokens, idx, options); };
            const originalListItemClose = md.renderer.rules.list_item_close || function (tokens, idx, options, env, self) { return self.renderToken(tokens, idx, options); };
            const originalBulletListClose = md.renderer.rules.bullet_list_close || function (tokens, idx, options, env, self) { return self.renderToken(tokens, idx, options); };

            const originalHeadingOpen = md.renderer.rules.heading_open || function (tokens, idx, options, env, self) { return self.renderToken(tokens, idx, options); };

            // Sobrescreve o renderizador de `heading_open`
            md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
                if (!env.mdPanelEnabled) return originalHeadingOpen(tokens, idx, options, env, self);

                const token = tokens[idx];
                const level = parseInt(token.tag.substring(1), 10);

                let closingTags = '';
                // Se um item de lista <details> estava aberto, ele deve ser fechado antes de um novo título.
                if (listDetailsToClose) {
                    closingTags += '</summary></details>';
                    listDetailsToClose = null;
                }
                // Fecha todas as seções <details> de nível igual ou inferior ao título atual.
                while (stack.length > 0 && stack[stack.length - 1] >= level) {
                    stack.pop();
                    closingTags += '</details>';
                }

                // Verifica se a palavra-chave 'open' está presente no conteúdo do título
                const inlineToken = tokens[idx + 1];
                const hasOpen = inlineToken && openKeywordRegex.test(inlineToken.content);
                const openAttr = hasOpen ? ' open' : '';

                // Adiciona o número da linha como um atributo de dados para possível referência futura (ex: debugging, outros scripts).
                if (token.map) {
                    token.attrSet('data-line', token.map[0]);
                }

                // Garante que o título (h1, h2, etc.) seja renderizado na mesma linha que o marcador <summary>.
                token.attrSet('style', 'display: inline');

                stack.push(level);

                // Injeta as tags <details> e <summary>
                return `${closingTags}<details class="md-panel" data-content-script-id="${contentScriptId}"${openAttr}><summary>` + self.renderToken(tokens, idx, options);
            };

            // Sobrescreve o renderizador de `heading_close` para fechar o <summary>
            md.renderer.rules.heading_close = (tokens, idx, options, env, self) => {
                if (!env.mdPanelEnabled) return self.renderToken(tokens, idx, options);

                return self.renderToken(tokens, idx, options) + '</summary>';
            };

            // Sobrescreve o renderizador de `list_item_open`
            md.renderer.rules.list_item_open = (tokens, idx, options, env, self) => {
                if (!env.mdPanelEnabled) return originalListItemOpen(tokens, idx, options, env, self);

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
                        // Adiciona o número da linha ao parágrafo dentro do summary para referência.
                        const pToken = tokens[idx + 1];
                        pToken.attrSet('data-line', currentToken.map[0]);
                    }

                    // Marca que o próximo bullet_list_open/close deve fechar este item.
                    listDetailsToClose = {
                        level: currentToken.level,
                    };

                    // Injeta <details> e <summary> antes do item de lista.
                    // O <li> é construído manualmente. O </summary> e </details> serão adicionados por outras regras.
                    return `<li><details class="md-panel-list" data-content-script-id="${contentScriptId}"${openAttr}><summary>`;
                }

                return originalListItemOpen(tokens, idx, options, env, self);
            };

            md.renderer.rules.list_item_close = (tokens, idx, options, env, self) => {
                if (!env.mdPanelEnabled) return originalListItemClose(tokens, idx, options, env, self);

                // Se um <details> foi aberto para este item, o <li> foi manual. Fechamos o </li> aqui.
                return listDetailsToClose ? '</li>' : originalListItemClose(tokens, idx, options, env, self);
            };

            // Sobrescreve a abertura de uma lista para fechar o <summary> se necessário
            md.renderer.rules.bullet_list_open = (tokens, idx, options, env, self) => {
                if (!env.mdPanelEnabled) return originalBulletListOpen(tokens, idx, options, env, self);

                let closingSummary = '';
                // Se estamos dentro de um item de lista <details> e o nível da nova lista
                // é maior (mais aninhado), esta é a sub-lista. Fechamos o <summary> para envolvê-la.
                if (listDetailsToClose && tokens[idx].level > listDetailsToClose.level) {
                    closingSummary = '</summary>';
                }
                return closingSummary + originalBulletListOpen(tokens, idx, options, env, self);
            };

            // Sobrescreve o fechamento de uma lista para fechar o <details> se necessário
            md.renderer.rules.bullet_list_close = (tokens, idx, options, env, self) => {
                if (!env.mdPanelEnabled) return originalBulletListClose(tokens, idx, options, env, self);

                let closingDetails = '';
                // Se estamos dentro de um item de lista <details> e o nível da lista que está fechando
                // corresponde ao da sub-lista, fechamos o <details> e resetamos o estado.
                if (listDetailsToClose && tokens[idx].level === listDetailsToClose.level + 1) {
                    closingDetails = '</details>';
                    listDetailsToClose = null;
                }
                return originalBulletListClose(tokens, idx, options, env, self) + closingDetails;
            };

            // Regra de Core: Executada antes da renderização para detectar a ativação do plugin via frontmatter.
            md.core.ruler.after('inline', 'frontmatter_remover', (state) => {
                // Inicializa a flag como desabilitada por padrão para cada renderização.
                state.env.mdPanelEnabled = false;

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
                        // Extrai o conteúdo do frontmatter
                        const frontmatterContent = tokens.slice(1, endIdx)
                            .filter(t => t.type === 'inline')
                            .map(t => t.content)
                            .join('\n');

                        // Verifica se 'pluginWebview: true' está presente
                        if (/pluginWebview:\s*true/.test(frontmatterContent)) {
                            console.log('MDPanel: Ativado via frontmatter.');
                            state.env.mdPanelEnabled = true;
                        }

                        // Remove os tokens do frontmatter
                        tokens.splice(0, endIdx + 1);
                    }
                }
                return true;
            });

            // Regra de Core: Corrige o espaçamento vertical (<br>) entre seções.
            md.core.ruler.after('frontmatter_remover', 'br_section_fixer', (state) => {
                if (!state.env.mdPanelEnabled) return true;

                const tokens = state.tokens;
                for (let i = 0; i < tokens.length - 1; i++) {
                    const currentToken = tokens[i];
                    const nextToken = tokens[i + 1];

                    // Procura pelo padrão: html_block com <br> seguido por heading_open
                    if (currentToken.type === 'html_block' && currentToken.content.includes('<br>') && nextToken.type === 'heading_open') {
                        // Insere um token `</details>` antes do token `<br>`.
                        // Isso força o fechamento da seção anterior ANTES do <br> ser renderizado, garantindo o espaçamento correto.
                        const closeToken = new state.Token('html_block', '', 0);
                        closeToken.content = '</details>';
                        tokens.splice(i, 0, closeToken);
                        i++; // Pula o token que acabamos de inserir para evitar um loop infinito.
                    }
                }
            });

            // Regra de Core: Garante que todas as seções <details> abertas sejam fechadas no final do documento.
            md.core.ruler.after('inline', 'section_closer', (state) => {
                if (!state.env.mdPanelEnabled) return true;

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
                // Limpa os estados para a próxima renderização de nota.
                stack.length = 0;
                listDetailsToClose = null;
            });
        };

        return {
            plugin: plugin,
            assets: function () {
                // CSS e JS customizados não são mais necessários, pois usamos as tags nativas <details>/<summary>.
                return [];
            },
        };
    }
};