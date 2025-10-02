/* eslint-disable no-undef */

module.exports = {
    default: function (context) {
        const contentScriptId = context.contentScriptId;
        let lastH1Content = '';

        return {
            plugin: function (md, _options) {
                const defaultHeadingOpen = md.renderer.rules.heading_open || function (tokens, idx, options, env, self) {
                    return self.renderToken(tokens, idx, options);
                };
                md.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
                    if (tokens[idx].tag === 'h1') {
                        lastH1Content = tokens[idx + 1].content;
                    }
                    return defaultHeadingOpen(tokens, idx, options, env, self);
                };

                const defaultHeadingClose = md.renderer.rules.heading_close || function (tokens, idx, options, env, self) { return self.renderToken(tokens, idx, options); };
                md.renderer.rules.heading_close = function (tokens, idx, options, env, self) {
                    if (tokens[idx].tag === 'h1') {
                        const escapedContent = lastH1Content.replace(/'/g, "\'").replace(/"/g, "&quot;");
                        const buttonHtml = ` <button onclick="sendTestMessage('${contentScriptId}', '${escapedContent}')">Test</button>`;
                        return buttonHtml + defaultHeadingClose(tokens, idx, options, env, self);
                    }
                    return defaultHeadingClose(tokens, idx, options, env, self);
                };
            },
            assets: function () {
                return [{ name: 'toggle-handler.js' }];
            },
        };
    },
};