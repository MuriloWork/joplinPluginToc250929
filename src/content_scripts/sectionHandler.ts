/* eslint-disable @typescript-eslint/no-explicit-any */

export default function (context: { contentScriptId: string }) {
    return {
        plugin: function (markdownIt: any, _options: any) {
            console.log('MDPanel MarkdownIt plugin loaded.');

            const defaultHeadingOpen = markdownIt.renderer.rules.heading_open || function (tokens: any[], idx: number, options: any, _env: any, self: any) {
                return self.renderToken(tokens, idx, options);
            };

            const defaultHeadingClose = markdownIt.renderer.rules.heading_close || function (tokens: any[], idx: number, options: any, _env: any, self: any) {
                return self.renderToken(tokens, idx, options);
            };

            markdownIt.renderer.rules.heading_open = function (tokens: any[], idx: number, options: any, env: any, self: any) {
                const token = tokens[idx];

                // Por enquanto, aplicamos a lógica apenas para H1
                if (token.tag === 'h1') {
                    let output = '';
                    // Fecha a tag <details> anterior, se houver uma aberta
                    if (env.inH1Section) {
                        output += '</details>';
                    }
                    env.inH1Section = true;

                    // Adiciona a tag de abertura da seção e o sumário, mas não o título ainda
                    output += `<details class="md-panel-section"><summary>`;
                    // Renderiza a tag de título (ex: <h1>)
                    output += defaultHeadingOpen(tokens, idx, options, env, self);
                    return output;
                }

                return defaultHeadingOpen(tokens, idx, options, env, self);
            };

            markdownIt.renderer.rules.heading_close = function (tokens: any[], idx: number, options: any, env: any, self: any) {
                const token = tokens[idx];
                if (token.tag === 'h1') {
                    // Adiciona um botão de teste ao lado do título
                    const testButton = `<button class="md-panel-test-button">Test</button>`;
                    // Fecha a tag do título, adiciona o botão e fecha a tag do sumário
                    return `${defaultHeadingClose(tokens, idx, options, env, self)} ${testButton}</summary>`;
                }
                return defaultHeadingClose(tokens, idx, options, env, self);
            };

            // Precisamos fechar a última seção no final do documento
            markdownIt.core.ruler.push('md_panel_section_closer', function (state: any) {
                const env = state.env;
                if (env.inH1Section) {
                    const token = new state.Token('html_block', '', 0);
                    token.content = '</details>';
                    state.tokens.push(token);
                    env.inH1Section = false; // Limpa o estado
                }
            });
        },

        assets: function () {
            return [
                // Os caminhos devem ser relativos ao local deste script (dist/content_scripts/)
                { name: '../assets/section-styles.css' },
                { name: '../assets/toggle-handler.js' },
            ];
        },
    };
}