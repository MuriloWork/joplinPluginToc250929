import joplin from 'api';
import { ContentScriptType, SettingItemType, ToolbarButtonLocation } from 'api/types';

// Content script for legacy collapsible sections
const LEGACY_CONTENT_SCRIPT_ID = 'mdPanelSectionHandler';

// ID for the new CodeMirror content script
const CM_CONTENT_SCRIPT_ID = 'wordWrapToggler';

const WRAP_COMMAND = 'toggleWordWrap';
const WRAP_SETTING = 'lineWrappingEnabled';

joplin.plugins.register({
    onStart: async function () {
        console.info('MDPanel: Plugin starting...');

        const LINE_WRAP_COMMAND = 'toggleLineWrapping';
        const LINE_WRAP_SETTING = 'lineWrappingEnabled';
        const LINE_WRAP_CONTENT_SCRIPT_ID = 'lineWrapContentScript';

        // 1. REGISTER CONTENT SCRIPT & MESSAGE HANDLER
        // It's crucial to register the message handler right after the content script
        // to avoid race conditions where the script asks for settings before the plugin is ready.
        await joplin.contentScripts.register(
            ContentScriptType.CodeMirrorPlugin,
            LINE_WRAP_CONTENT_SCRIPT_ID,
            './lineWrapContentScript.js' // Ensure this points to the JS file
        );

        let isContentScriptReady = false;
        await joplin.contentScripts.onMessage(LINE_WRAP_CONTENT_SCRIPT_ID, async (message: any) => {
            if (message === 'getWordWrapState') {
                console.info('MDPanel: Content script requested state. Responding.');
                isContentScriptReady = true; // Mark as ready once it asks for the state
                const settings = await joplin.settings.values([LINE_WRAP_SETTING]);
                return settings[LINE_WRAP_SETTING];
            }
            return undefined;
        });

        // 2. REGISTER SETTING
        await joplin.settings.registerSettings({
            [LINE_WRAP_SETTING]: {
                value: true,
                type: SettingItemType.Bool,
                public: true,
                section: 'wordWrapSettings',
                label: 'Enable line wrapping for notes',
            },
        });

        await joplin.settings.registerSection('wordWrapSettings', {
            label: 'MDPanel: Word Wrap',
            iconName: 'fas fa-text-width',
        });

        // 3. REGISTER COMMAND
        await joplin.commands.register({
            name: LINE_WRAP_COMMAND,
            label: 'Toggle Word Wrap',
            iconName: 'fas fa-text-width',
            enabledCondition: 'markdownEditorPaneVisible',
            execute: async () => {
                // Use the modern `values` to get the current setting
                const settings = await joplin.settings.values([LINE_WRAP_SETTING]);
                const currentVal = settings[LINE_WRAP_SETTING];
                await joplin.settings.setValue(LINE_WRAP_SETTING, !currentVal);
            },
        });

        // 4. CREATE TOOLBAR BUTTON
        // Register the button for the desktop editor toolbar
        await joplin.views.toolbarButtons.create(
            'wordWrapToggleButtonDesktop',
            LINE_WRAP_COMMAND,
            ToolbarButtonLocation.EditorToolbar
        );
        // Register the button for the mobile note toolbar
        await joplin.views.toolbarButtons.create(
            'wordWrapToggleButtonMobile',
            LINE_WRAP_COMMAND,
            ToolbarButtonLocation.NoteToolbar
        );

        // Function to send the updated state to the content script
        const updateEditorState = async () => {
            const settings = await joplin.settings.values([LINE_WRAP_SETTING]);
            const isEnabled = settings[LINE_WRAP_SETTING];
            console.info(`MDPanel: Sending 'updateWordWrapState' command with value: ${isEnabled}`);
            await joplin.commands.execute('editor.execCommand', {
                name: 'updateWordWrapState',
                args: [isEnabled]
            });
        };

        // 5. LISTEN FOR SETTING CHANGES
        // When the user changes the setting in the options panel, update the editor.
        await joplin.settings.onChange(async (event: any) => {
            if (event.keys.includes(LINE_WRAP_SETTING)) {
                // Only send update if the content script has already initialized
                if (isContentScriptReady) {
                    await updateEditorState();
                }
            }
        });

        console.info('MDPanel: Line wrapping feature is ready.');
    },
});
