
This guide demonstrates how to create a Markdown editor plugin. It expects you to have first read [the table of contents tutorial](https://joplinapp.org/help/api/tutorials/toc_plugin) or have basic plugin development experience.

note

This guide describes how to create a plugin for Joplin's [CodeMirror 6](https://codemirror.net/)\-based Markdown editor. The plugin created in this guide should work on both mobile and desktop. However, on Joplin desktop before version 3.1, the beta editor will need to be enabled in settings \> general.

## Setup[​](#setup "Direct link to Setup")

### Create the plugin[​](#create-the-plugin "Direct link to Create the plugin")

Start by [creating the plugin with `yo joplin`](https://joplinapp.org/help/api/get_started/plugins). The beta Markdown editor is still new, so make sure the `joplin` generator is up-to-date.

You should now have a directory structure similar to the following:

```
📂 codemirror6-plugin/
  ⏐ 📂 publish/
  ⏐ 📂 api/
  ⏐ 📂 node_modules/
  ⏐ 📂 dist/
  ⏐ 📂 src/
  ⏐   ⏐ manifest.json
  ⏐   ⏐ index.ts
  ⏐ webpack.config.js
  ⏐ tsconfig.json
  ⏐ package-lock.json
  ⏐ README.md
  ⏐ .gitignore
  ⏐ plugin.config.json
  ⏐ .npmignore
  ⏐ GENERATOR_DOC.md
  ⏐ package.json
```

### Update the plugin build script[​](#update-the-plugin-build-script "Direct link to Update the plugin build script")

note

At the time of this writing, this section was necessary. If Joplin 2.14 is no longer in pre-release, you might be able to skip this section.

To create a plugin that supports the beta editor, you'll want to update `webpack.config.js` to the latest version. Doing this allows importing CodeMirror packages without bundling additional copies of them with the plugin.

To do this, replace the contents of `webpack.config.js` with [the unreleased version of `webpack.config.js` on Joplin's GitHub repository](https://github.com/laurent22/joplin/blob/dev/packages/generator-joplin/generators/app/templates/webpack.config.js).

## Content script setup[​](#content-script-setup "Direct link to Content script setup")

### Create the content script[​](#create-the-content-script "Direct link to Create the content script")

Now that the plugin has been created, we can create and register a CodeMirror content script.

Start by opening `plugin.config.json`.It should look similar to this:

The `"extraScripts"` entry provides a list of TypeScript files that will be compiled **in addition** to `src/index.ts`. This will allow registering built versions of these files as CodeMirror or [renderer content scripts](https://joplinapp.org/api/references/plugin_api/enums/contentscripttype.html#markdownitplugin).

To add a content script, start by creating a `contentScript.ts` file in the `src` directory. Next, add the path to `contentScript.ts` to `extraScripts`:

```
{
-   "extraScripts": []
+   "extraScripts": ["contentScript.ts"]
}
```

Notice that the above path is relative to the `src` directory.

The plugin's directory structure should now look similar to this:

```
📂 codemirror6-plugin/
  ⏐ 📂 publish/
  ⏐ 📂 api/
  ⏐ 📂 node_modules/
  ⏐ 📂 dist/
  ⏐ 📂 src/
  ⏐  ⏐ contentScript.ts
  ⏐  ⏐ manifest.json
  ⏐  ⏐ index.ts
  ⏐ plugin.config.json
  ⏐ ...
```

### Register the content script[​](#register-the-content-script "Direct link to Register the content script")

Open `src/index.ts`. It should look similar to this:

```
import joplin from 'api';

joplin.plugins.register({
    onStart: async function() {
        // eslint-disable-next-line no-console
        console.info('Hello world. Test plugin started!');
    },
});
```

Next, use [joplin.contentScripts.register](https://joplinapp.org/api/references/plugin_api/classes/joplinplugins.html#register) to add the content script to Joplin:

```
import joplin from 'api';
+import { ContentScriptType } from 'api/types';

joplin.plugins.register({
    onStart: async function() {
-       // eslint-disable-next-line no-console
-       console.info('Hello world. Test plugin started!');
+       const contentScriptId = 'some-content-script-id';
+       joplin.contentScripts.register(
+           ContentScriptType.CodeMirrorPlugin,
+           contentScriptId,
+           './contentScript.js',
+       );
    },
});
```

When Joplin starts, this causes `contentScript.js` (which is built from `contentScript.ts`) to be loaded as a CodeMirror plugin.

### Register CodeMirror extensions from the content script[​](#register-codemirror-extensions-from-the-content-script "Direct link to Register CodeMirror extensions from the content script")

Next, open `contentScript.ts` and add the following content:

```
// 1. Import a CodeMirror extension
import { lineNumbers } from '@codemirror/view';

export default (_context: { contentScriptId: string, postMessage: any }) => {
    return {
        plugin: (codeMirrorWrapper: any) => {
            // 2. Adds the built-in CodeMirror 6 extension to the editor
            codeMirrorWrapper.addExtension(lineNumbers());
        },
    };
};
```

The above script adds [the built-in CodeMirror `lineNumbers` extension](https://codemirror.net/docs/ref/#view.lineNumbers) to the editor. It's also possible to pass an array of [extension](https://codemirror.net/docs/ref/#state.Extension)s to `.addExtension`.

If you build the plugin with `npm install` or `npm run dist`, you might see the following error:

```
bash$ npm run dist
...

ERROR in /home/builder/Documents/joplin/packages/app-cli/tests/support/plugins/cm6-test/src/contentScript.ts
2:28-46
[tsl] ERROR in /home/builder/Documents/joplin/packages/app-cli/tests/support/plugins/cm6-test/src/contentScript.ts(2,29)
      TS2307: Cannot find module '@codemirror/view' or its corresponding type declarations.
```

At present, TypeScript can't find type information for `@codemirror/view`. To fix this, run `npm install --save-dev @codemirror/view` in the plugin's base directory:

```
$ cd path/to/codemirror6-plugin/
$ npm install --save-dev @codemirror/view
```

note

The default `webpack.config.js` tells Webpack not to bundle several packages, including `@codemirror/view`. As such, the `@codemirror/view` plugin is used **only for type information**.

This is what we want. If `@codemirror/view` is bundled with the plugin, it could conflict with the version of `@codemirror/view` used by Joplin. In general, CodeMirror packages can break if multiple copies of the same package try to use the same editor. This is also why a [newer version of `webpack.config.js`](#update-the-plugin-build-script) is required to build the plugin.

### Try it![​](#try-it "Direct link to Try it!")

We now have an extension that adds line numbers to Joplin's markdown editor.

To try it,

1.  Open Joplin.
2.  Open "Options", then "Plugins".
3.  Click "Show Advanced Settings"
4.  Enter the path to the `codemirror6-plugin` directory into the "Development plugins" box.
5.  Open the "General" tab and make sure "opt in to the editor beta" is checked.
6.  Restart Joplin.
    - Make sure Joplin closes completely before opening it again. On Windows/Linux, this can be done by closing Joplin with `File` \> `Quit`.

Your editor should now have line numbers!

info

If the plugin fails to load, you might see an error similar to the following in Joplin's development tools (`Help` \> `Toggle development tools`):

```
Error: Unrecognized extension value in extension set (function(t={}){return[kn.of(t),gn(),An]}). This sometimes happens because multiple instances of @codemirror/state are loaded, breaking instanceof checks.
```

If you do, be sure to follow the [steps in the "Update the Plugin Build Script"](#update-the-plugin-build-script) section. If that section doesn't help, change

```
import { lineNumbers } from '@codemirror/view';
```

to

```
import joplin from "api";
const { lineNumbers } = joplin.require('@codemirror/view');
```

## Connect to the main script[​](#connect-to-the-main-script "Direct link to Connect to the main script")

Next, we'll see how to communicate between the plugin's main script and the editor. We'll do this using [`joplin.contentScripts.onMessage`](https://joplinapp.org/api/references/plugin_api/classes/joplincontentscripts.html#onmessage) and `context.postMessage`.

### Register a setting[​](#register-a-setting "Direct link to Register a setting")

Let's start by registering a setting.

Open `index.ts` and, near the top of the file, create a new function, `registerSettings.ts`:

```
import joplin from 'api';
import { ContentScriptType } from 'api/types';

// Add this:
const registerSettings = async () => {
    const sectionName = 'example-cm6-plugin';
    await joplin.settings.registerSection(sectionName, {
        label: 'CodeMirror 6 demo plugin',
        description: 'Settings for the CodeMirror 6 example plugin.',
        icon: 'fas fa-edit',
    });

    // TODO:
};

// ...
```

The call to [`joplin.settings.registerSection`](https://joplinapp.org/api/references/plugin_api/classes/joplinsettings.html#registersection) creates a new section in Joplin's settings. This is where we'll put new settings.

As before, `icon` can be any [FontAwesome 5 Free](https://fontawesome.com/v5/search?q=edit&o=r&m=free) icon name. The `description` property is an optional extended description to be shown at the top of our settings page.

Next, let's register a setting.

Add a new `highlightLineSettingId` constant to the top of `index.ts`. Then, register a setting with `highlightLineSettingId` as its ID using [`joplin.settings.registerSettings`](https://joplinapp.org/api/references/plugin_api/classes/joplinsettings.html#registersetting):

```
import joplin from 'api';
// Add an import for SettingItemType:
import { ContentScriptType, SettingItemType } from 'api/types';

// Add this:
const highlightLineSettingId = 'highlight-active-line';

const registerSettings = async () => {
    const sectionName = 'example-cm6-plugin';
    await joplin.settings.registerSection(sectionName, {
        label: 'CodeMirror 6 demo plugin',
        description: 'Settings for the CodeMirror 6 example plugin.',
        iconName: 'fas fa-edit',
    });

    // Add this:
    await joplin.settings.registerSettings({
        [highlightLineSettingId]: {
            section: sectionName,
            value: true, // Default value
            public: true, // Show in the settings screen
            type: SettingItemType.Bool,
            label: 'Highlight active line',
        },
    });
};

// ...
```

Finally, add a call to `registerSettings` from `onStart`.

We can get and set settings in the plugin's main script (`src/index.ts`), but not directly in the plugin's content script.

`index.ts` should now look like this.

### Create an `onMessage` listener that returns the setting value[​](#create-an-onmessage-listener-that-returns-the-setting-value "Direct link to create-an-onmessage-listener-that-returns-the-setting-value")

Create a new `registerMessageListener` function, just above `joplin.plugins.register({`. In this function, register an `onMessage` listener with [`joplin.contentScripts.onMessage`](https://joplinapp.org/api/references/plugin_api/classes/joplincontentscripts.html#onmessage). We'll listen for the `getSettings` message and return an object with the plugin's current settings:

```
// ... in index.ts ...
// ...hidden...

// Add this:
const registerMessageListener = async (contentScriptId: string) => {
    await joplin.contentScripts.onMessage(
        contentScriptId,
        
        // Sending messages with `context.postMessage`
        // from the content script with `contentScriptId`
        // calls this onMessage listener:
        async (message: any) => {
            if (message === 'getSettings') {
                const settingValue = await joplin.settings.value(highlightLineSettingId);
                return {
                    highlightActiveLine: settingValue,
                };
            }
        },
    );
};

joplin.plugins.register({
    onStart: async function() {
        await registerSettings();

        // Add this:
        const contentScriptId = 'some-content-script-id';
        await registerMessageListener(contentScriptId);
        
        await joplin.contentScripts.register(
            ContentScriptType.CodeMirrorPlugin,
            contentScriptId,
            './contentScript.js',
        );
    }
});
```

### Get the setting from the content script[​](#get-the-setting-from-the-content-script "Direct link to Get the setting from the content script")

Open `contentScript.ts` and update it with the following:

```
import { lineNumbers, highlightActiveLine } from '@codemirror/view';

// We're now using `context`: Rename it from `_context`
// to `context`.
export default (context: { contentScriptId: string, postMessage: any }) => {
    return {
        // An `async` was also added so that we can `await` the result of
        // `context.postMessage`:
        plugin: async (codeMirrorWrapper: any) => {
            codeMirrorWrapper.addExtension(lineNumbers());

            // Add this:
            // Get settings from the main script with postMessage:
            const settings = await context.postMessage('getSettings');
            if (settings.highlightActiveLine) {
                codeMirrorWrapper.addExtension(highlightActiveLine());
            }
        },
    };
};
```

Above, we get settings from `index.ts` with `context.postMessage('getSettings')`. This calls the `onMessage` listener that was registered earlier. Its return value is stored in the `settings` variable.

Note that [`highlightActiveLine`](https://codemirror.net/docs/ref/#view.highlightActiveLine) is another built-in CodeMirror extension. It adds the `cm-activeLine` class to all lines that have a cursor on them.

Alternative approach to getting settings: Registering an editor command

### Style the active line[​](#style-the-active-line "Direct link to Style the active line")

If you run the plugin, you might notice that the active line has a blue background. Let's customise it with CSS!

There are two different ways of doing this: With a `.css` file and with a [CodeMirror theme](https://codemirror.net/examples/styling/). In this tutorial, we'll use a `.css` file.

Create a new `style.css` file within the `src` directory. Set its content to

```
.cm-editor .cm-line.cm-activeLine {
    /* See https://joplinapp.org/help/api/references/plugin_theming
       for more information about styling with plugins */
    color: var(--joplin-color);
    background-color: rgba(200, 200, 0, 0.4);
}
```

Next, load the CSS file from the CodeMirror content script:

```
import { lineNumbers, highlightActiveLine } from '@codemirror/view';

export default (context: { contentScriptId: string, postMessage: any }) => {
    return {
        plugin: async (codeMirrorWrapper: any) => {
            // ...hidden
        },
        assets: () => {
            return [ { name: './style.css' } ];
        },
    };
};
```

The active line should now have a light-yellow background, but only when the "highlight active line" setting is enabled.

## CodeMirror 5 compatibility[​](#codemirror-5-compatibility "Direct link to CodeMirror 5 compatibility")

note

As of Joplin v2.14 we recommend that you create CodeMirror 6-based plugins. If you still need to support older versions of Joplin, you can target both CodeMirror 5 and CodeMirror 6. Follow the tutorial below for information on how to do this.

Joplin's legacy markdown editor uses [CodeMirror 5](https://codemirror.net/5/). The beta editor uses CodeMirror 6.

Unfortunately, the [CodeMirror 5 API](https://codemirror.net/5/) and [CodeMirror 6 API](https://codemirror.net/)s are very different. As such, you'll likely need two different content scripts — one for CodeMirror 5 and one for CodeMirror 6. [This pull request](https://github.com/roman-r-m/joplin-plugin-quick-links/pull/15/files#diff-a19ae4175adf4e5173549901c8535f2a45278f8a907da485899660c08c1c520b) provides an example of how CodeMirror 6 support might be added to an existing plugin.

To add CodeMirror 5 compatibility to our CodeMirror 6 plugin, we'll:

1.  Create another content script for CodeMirror 5. Use only [CodeMirror 5 APIs](https://codemirror.net/5/).
2.  Within the `plugin` function, check whether `codeMirrorWrapper` is actually a CodeMirror 5 editor. This can be done by checking whether `codeMirrorWrapper.cm6` is defined. (If it is, it's a reference to a CodeMirror 6 `EditorView`).
3.  If `codeMirrorWrapper.cm6` is defined, only load the CodeMirror 5 content script. Otherwise, only load the CodeMirror 6 content script.

### Create a content script for CodeMirror 5[​](#create-a-content-script-for-codemirror-5 "Direct link to Create a content script for CodeMirror 5")

For organisational purposes, make a new folder, `src/contentScripts`. Next, move the existing `contentScript.ts` to `src/contentScripts/codeMirror6.ts` and create a new `contentScripts/codeMirror5.ts` file.

You should now have the following folder structure:

```
📂 codemirror6-plugin/
  ⏐ 📂 publish/
  ⏐ 📂 api/
  ⏐ 📂 node_modules/
  ⏐ 📂 dist/
  ⏐ 📂 src/
  ⏐   ⏐ 📂 contentScripts/
  ⏐   ⏐  ⏐  codeMirror6.ts
  ⏐   ⏐  ⏐  codeMirror5.ts
  ⏐   ⏐ manifest.json
  ⏐   ⏐ index.ts
  ⏐ plugin.config.json
  ⏐ ...
```

For now, let `src/contentScripts/codeMirror5.ts`'s content be the same as the original CodeMirror 6 content script.

Next, update `plugin.config.json` so that both content scripts are compiled by Webpack:

```
{
    "extraScripts": [
        "contentScripts/codeMirror6.ts",
        "contentScripts/codeMirror5.ts"
    ]
}
```

### Register the content script[​](#register-the-content-script-1 "Direct link to Register the content script")

Update `index.ts` so that **both** the CodeMirror 5 and CodeMirror 6 content scripts are registered:

```
// ...

// Add this
const registerCodeMirrorContentScript = async (contentScriptName: string) => {
    const id = contentScriptName;
    await registerMessageListener(id);
    await joplin.contentScripts.register(
        ContentScriptType.CodeMirrorPlugin,
        id,
        `./contentScripts/${id}.js`,
    );
};

joplin.plugins.register({
    onStart: async function() {
        await registerSettings();

        // Add this:
        await registerCodeMirrorContentScript('codeMirror6');
        await registerCodeMirrorContentScript('codeMirror5');

        // DELETE this:
        //await joplin.contentScripts.register(
        //  ContentScriptType.CodeMirrorPlugin,
        //  contentScriptId,
        //  './contentScripts/contentScript.js',
        //);
    }
});
```

### Update the CodeMirror 5 content script[​](#update-the-codemirror-5-content-script "Direct link to Update the CodeMirror 5 content script")

Replace the CodeMirror 5 content script's content with the following:

```
// Don't import CodeMirror 6 packages here -- doing so won't work in the CM5 editor.

export default (context: { contentScriptId: string, postMessage: any }) => {
    return {
        plugin: async (codeMirror: any) => {
            // Exit if not a CodeMirror 5 editor.
            if (codeMirror.cm6) {
                return;
            }

            codeMirror.defineOption('enable-highlight-extension', true, async function() {
                const settings = await context.postMessage('getSettings');

                // At this point, `this` points to the CodeMirror
                // editor instance
                this.setOption('styleActiveLine', settings.highlightActiveLine);
            });
        },

        // Sets CodeMirror 5 default options.
        codeMirrorOptions: {
            'lineNumbers': true,
            'enable-highlight-extension': true,
        },

        // Additional CodeMirror scripts. Has no effect in CodeMirror 6.
        // See https://codemirror.net/5/doc/manual.html#addon_active-line
        codeMirrorResources: [ 'addon/selection/active-line.js' ],

        assets: () => {
            return [ { name: './style.css' } ];
        },
    };
};
```

danger

Although Joplin does provide a limited CodeMirror 5 compatibility layer in the CodeMirror 6 editor, in the future, **new plugins will be unable to use this compatibility layer**.

### Make the CodeMirror 6 content script only load in CodeMirror 6[​](#make-the-codemirror-6-content-script-only-load-in-codemirror-6 "Direct link to Make the CodeMirror 6 content script only load in CodeMirror 6")

At the beginning of `contentScripts/codeMirror6.ts`'s `plugin` function, add:

```
import { lineNumbers, highlightActiveLine } from '@codemirror/view';

export default (context: { contentScriptId: string, postMessage: any }) => {
    return {
        plugin: async (codeMirrorWrapper: any) => {
            // Exit if not a CodeMirror 6 editor.
            if (!codeMirrorWrapper.cm6) return;

            codeMirrorWrapper.addExtension(lineNumbers());
            // ...
        },
        assets: () => {
            // ...
        },
    };
};
```

### Summary[​](#summary "Direct link to Summary")

To support both CodeMirror 5 and CodeMirror 6, we register two content scripts. One will fail to load in CodeMirror 5 and the other we disable in CodeMirror 6.

## See also[​](#see-also "Direct link to See also")

- [The final version of the plugin can be found on GitHub](https://github.com/laurent22/joplin/tree/dev/packages/app-cli/tests/support/plugins/codemirror5-and-codemirror6/)
- [CodeMirror 5 API documentation](https://codemirror.net/5/)
- [CodeMirror 6 API documentation](https://codemirror.net/)
- [The CodeMirror 5 example plugin](https://github.com/laurent22/joplin/blob/dev/packages/app-cli/tests/support/plugins/codemirror_content_script/src/)
- [The CodeMirror 6 example plugin](https://github.com/laurent22/joplin/blob/dev/packages/app-cli/tests/support/plugins/codemirror6/src/contentScript.ts)
- [Documentation for the different Joplin content script types](https://joplinapp.org/api/references/plugin_api/enums/contentscripttype.html)