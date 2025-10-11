/* eslint-disable no-undef */

const { Compartment, Prec } = require('@codemirror/state');
const { EditorView, keymap } = require('@codemirror/view');
const { cursorLineEnd, cursorLineStart } = require('@codemirror/commands');

console.info('MDPanel ContentScript: Script loaded.');

module.exports = {
    default: function (context) {
        return {
            // The plugin function must be synchronous to avoid race conditions.
            plugin: (editorControl) => {
                console.info('MDPanel ContentScript: Plugin method invoked.');
                const editor = editorControl.editor;

                // 1. Create a single compartment to manage all our dynamic extensions.
                const extensionCompartment = new Compartment();
                editorControl.addExtension(extensionCompartment.of([]));

                // This function rebuilds our set of extensions based on the current state.
                const updateExtensions = (wordWrapEnabled) => {
                    let newExtension;
                    if (wordWrapEnabled) {
                        // To re-enable wrapping, we reconfigure the compartment with an empty extension,
                        // allowing Joplin's default styles to take effect.
                        newExtension = [];
                    } else {
                        // To disable wrapping, we apply two extensions:
                        // 1. A theme to override the default wrapping behavior.
                        // 2. A keymap to make the "Home" and "End" keys navigate to the true line boundaries.
                        newExtension = [
                            Prec.highest(EditorView.theme({
                                '.cm-lineWrapping': { 'flex-shrink': '0 !important' },
                            })),
                            keymap.of([{
                                key: 'End', run: cursorLineEnd
                            }, {
                                key: 'Home', run: cursorLineStart
                            }])
                        ];
                    }
                    editor.dispatch({
                        effects: extensionCompartment.reconfigure(newExtension),
                    });
                };

                // 2. Register the command that the main plugin will call.
                editorControl.registerCommand('updateWordWrapState', (enabled) => {
                    console.info(`MDPanel ContentScript: Received 'updateWordWrapState' command with value: ${enabled}`);
                    updateExtensions(enabled);
                });

                // 3. Asynchronously pull the initial state and apply it.
                (async () => {
                    const initialWordWrapState = await context.postMessage('getWordWrapState');
                    console.info(`MDPanel ContentScript: Applying initial state: ${initialWordWrapState}`);
                    updateExtensions(initialWordWrapState);
                })();
            },
        };
    }
};