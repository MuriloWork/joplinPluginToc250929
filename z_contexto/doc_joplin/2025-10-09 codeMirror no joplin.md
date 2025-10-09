Boa pergunta — no **Joplin Plugin API**, você pode usar **comandos do CodeMirror** (como `undo`, `redo`, `replaceSelection`, `toggleComment`, etc.) desde que acesse o editor corretamente dentro do ambiente do plugin.

No Joplin, o editor principal (Markdown editor) é baseado em **CodeMirror 6**, e há APIs para interagir com ele via `joplin.commands`, `joplin.workspace` e, em versões mais recentes, diretamente com o `CodeMirror` interno.

Vamos ver as formas possíveis:

* * *

### 1. Usando comandos já expostos pelo Joplin

Alguns comandos CodeMirror comuns já estão disponíveis via `joplin.commands.execute()`.  
Exemplo:

ts

`await joplin.commands.execute('editor.undo');await joplin.commands.execute('editor.redo');await joplin.commands.execute('editor.cut');await joplin.commands.execute('editor.paste');await joplin.commands.execute('editor.focus');await joplin.commands.execute('editor.execCommand', { name: 'selectAll' });`

Esses nomes (`editor.undo`, etc.) são os que o próprio Joplin registra internamente — e costumam ser equivalentes aos comandos básicos do CodeMirror.

Você pode listar todos os comandos disponíveis com:

```ts
const cmds = await 
joplin.commands.list();console.log(cmds);

```

Isso mostra todos os comandos globais, incluindo os relacionados ao editor.


### 2\. **Acessando o objeto CodeMirror diretamente (modo avançado)**

Se precisar de controle fino (ex: executar `cm.execCommand('toggleComment')`, obter seleção, inserir texto, etc.), você pode usar a API `joplin.commands.execute('editor.execCommand', { name: '...' })`, ou então acessar diretamente o editor via `joplin.workspace.selectedTextEditor()` (dependendo da versão do Joplin).

Por exemplo:

ts

`const editor = await joplin.workspace.selectedTextEditor();await editor.execCommand({ name: 'toggleComment' });`

Mas atenção: o método `selectedTextEditor()` nem sempre está disponível em versões antigas do Joplin. Se não estiver, você precisa injetar JavaScript no contexto da webview do editor (veja o item 3 abaixo).

* * *

### 3\. **Executando código dentro do editor (injeção via `postMessage`)**

Se o seu plugin tem um **content script** registrado (com `joplin.contentScripts.register`), ele pode se comunicar com o editor e executar comandos CodeMirror diretamente via `window.cm` (em CodeMirror 5) ou `window._cmEditor` (em CodeMirror 6, dependendo da versão).

Exemplo:

#### no `manifest.json`

json

`{  "content_scripts": [    {      "id": "editor",      "js": ["./contentScript.js"],      "targets": ["markdownEditorCodeMirror"]    }  ]}`

#### no `contentScript.js`

js

`// Recebe mensagens do plugin principaljoplin.plugins.onMessage(async (message) => {  if (message.name === 'toggleComment') {    const cm = window.cm || window._cmEditor;    if (cm) {      cm.execCommand('toggleComment');    }  }});`

#### no `index.ts`

ts

`await joplin.contentScripts.register(  ContentScriptType.CodeMirrorPlugin,  'editor',  './contentScript.js');await joplin.commands.register({  name: 'toggleCommentCmd',  label: 'Toggle comment',  execute: async () => {    await joplin.contentScripts.postMessage('editor', { name: 'toggleComment' });  },});`

Assim, seu plugin pode rodar **comandos nativos do CodeMirror diretamente** dentro do contexto do editor, com total controle.

* * *

### 4\. **Resumo prático**

| Caso                                    | Método recomendado                          | Exemplo                                                                      |
| --------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------- |
| Comandos básicos (`undo`, `redo`, etc.) | `joplin.commands.execute()`                 | `await joplin.commands.execute('editor.undo')`                               |
| Comandos específicos do CodeMirror      | `editor.execCommand()`                      | `await joplin.commands.execute('editor.execCommand', { name: 'selectAll' })` |
| Controle completo sobre o editor        | `contentScript` + `window.cm.execCommand()` | `cm.execCommand('toggleComment')`                                            |

* * *

Se quiser, posso te mostrar **um exemplo completo** de plugin funcional que registra um botão e executa um comando CodeMirror (como `toggleComment` ou `replaceSelection`).  
Quer que eu monte esse exemplo em TypeScript com `index.ts` e `contentScript.js` prontos?