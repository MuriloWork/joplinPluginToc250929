const { Compartment } = require('@codemirror/state');
const { EditorView } = require('@codemirror/view');

// Variáveis para manter o estado entre as chamadas
let editorViewInstance = null;
const lineWrappingCompartment = new Compartment();

/**
 * Atualiza o estilo de quebra de linha no editor.
 * @param {boolean} wrapOn - Se a quebra de linha deve ser ativada.
 */
function updateWrapStyle(wrapOn) {
    if (editorViewInstance) {
        editorViewInstance.dispatch({
            effects: lineWrappingCompartment.reconfigure(wrapOn ? EditorView.lineWrapping : [])
        });
        console.info(`MDPanel ContentScript: Quebra de linha reconfigurada para: ${wrapOn}`);
    }
}

module.exports = {
    default: function(context) {
        return {
            // 1. A lógica do plugin que interage com a view do CodeMirror
            plugin: (codeMirrorWrapper) => {
                if (!codeMirrorWrapper.cm6) {
                    return;
                }
                editorViewInstance = codeMirrorWrapper.cm6;

                // Adiciona o "slot" de configuração (compartment) ao editor
                codeMirrorWrapper.addExtension(lineWrappingCompartment.of([]));

                // Puxa o estado inicial da configuração do Joplin quando o editor é carregado
                context.postMessage('getWordWrapState').then(isLineWrappingEnabled => {
                    updateWrapStyle(isLineWrappingEnabled);
                });
            },

            // 2. Exporta os comandos que podem ser chamados via editor.execCommand
            commands: {
                updateWordWrapState: {
                    execute: (enabled) => {
                        updateWrapStyle(enabled);
                    },
                },
            },
        };
    }
};
