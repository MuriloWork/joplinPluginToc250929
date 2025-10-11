import { Compartment } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

const lineWrappingCompartment = new Compartment();

export default function(context) {
    return {
        plugin: (codeMirrorWrapper) => {
            if (!codeMirrorWrapper.cm6) {
                return;
            }
            const view = codeMirrorWrapper.cm6;

            // Adiciona o "slot" de configuração (compartment) ao editor
            codeMirrorWrapper.addExtension(lineWrappingCompartment.of([]));

            // Puxa o estado inicial da configuração do Joplin quando o editor é carregado
            context.postMessage('getWordWrapState').then(isLineWrappingEnabled => {
                view.dispatch({
                    effects: lineWrappingCompartment.reconfigure(isLineWrappingEnabled ? EditorView.lineWrapping : [])
                });
            });
        },

        // Exporta os comandos que podem ser chamados via editor.execCommand
        commands: {
            updateWordWrapState: {
                execute: (view, enabled) => {
                    if (!view) return false;
                    view.dispatch({
                        effects: lineWrappingCompartment.reconfigure(enabled ? EditorView.lineWrapping : [])
                    });
                    console.info(`MDPanel ContentScript: Quebra de linha reconfigurada para: ${enabled}`);
                    return true;
                },
            },
        },
    };
}