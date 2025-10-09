## Index

## Methods

<a id="addscript"></a>

### addScript

- addScript(handle: [ViewHandle](https://joplinapp.org/api/references/plugin_api/globals.html#viewhandle), scriptPath: string): Promise<void\>

- #### Parameters
    
    - ##### handle: [ViewHandle](https://joplinapp.org/api/references/plugin_api/globals.html#viewhandle)
        
    - ##### scriptPath: string
        

<a id="create"></a>

### create

- create(id: string): Promise<[ViewHandle](https://joplinapp.org/api/references/plugin_api/globals.html#viewhandle)\>

- #### Parameters
    
    - ##### id: string
        

<a id="isactive"></a>

### isActive

- isActive(handle: [ViewHandle](https://joplinapp.org/api/references/plugin_api/globals.html#viewhandle)): Promise<boolean\>

- #### Parameters
    
    - ##### handle: [ViewHandle](https://joplinapp.org/api/references/plugin_api/globals.html#viewhandle)
        

<a id="isvisible"></a>

### isVisible

- isVisible(handle: [ViewHandle](https://joplinapp.org/api/references/plugin_api/globals.html#viewhandle)): Promise<boolean\>

- #### Parameters
    
    - ##### handle: [ViewHandle](https://joplinapp.org/api/references/plugin_api/globals.html#viewhandle)
        

<a id="onactivationcheck"></a>

### onActivationCheck

- onActivationCheck(handle: [ViewHandle](https://joplinapp.org/api/references/plugin_api/globals.html#viewhandle), callback: [ActivationCheckCallback](https://joplinapp.org/api/references/plugin_api/globals.html#activationcheckcallback)): Promise<void\>

- #### Parameters
    
    - ##### handle: [ViewHandle](https://joplinapp.org/api/references/plugin_api/globals.html#viewhandle)
        
    - ##### callback: [ActivationCheckCallback](https://joplinapp.org/api/references/plugin_api/globals.html#activationcheckcallback)
        

<a id="onmessage"></a>

### onMessage

- onMessage(handle: [ViewHandle](https://joplinapp.org/api/references/plugin_api/globals.html#viewhandle), callback: Function): Promise<void\>

- #### Parameters
    
    - ##### handle: [ViewHandle](https://joplinapp.org/api/references/plugin_api/globals.html#viewhandle)
        
    - ##### callback: Function
        

<a id="onupdate"></a>

### onUpdate

- onUpdate(handle: [ViewHandle](https://joplinapp.org/api/references/plugin_api/globals.html#viewhandle), callback: [UpdateCallback](https://joplinapp.org/api/references/plugin_api/globals.html#updatecallback)): Promise<void\>

- #### Parameters
    
    - ##### handle: [ViewHandle](https://joplinapp.org/api/references/plugin_api/globals.html#viewhandle)
        
    - ##### callback: [UpdateCallback](https://joplinapp.org/api/references/plugin_api/globals.html#updatecallback)
        

<a id="postmessage"></a>

### postMessage

- postMessage(handle: [ViewHandle](https://joplinapp.org/api/references/plugin_api/globals.html#viewhandle), message: any): void

- #### Parameters
    
    - ##### handle: [ViewHandle](https://joplinapp.org/api/references/plugin_api/globals.html#viewhandle)
        
    - ##### message: any
        

<a id="register"></a>

### register

- register(viewId: string, callbacks: [EditorPluginCallbacks](https://joplinapp.org/api/references/plugin_api/interfaces/editorplugincallbacks.html)): Promise<void\>

- #### Parameters
    
    - ##### viewId: string
        
    - ##### callbacks: [EditorPluginCallbacks](https://joplinapp.org/api/references/plugin_api/interfaces/editorplugincallbacks.html)
        

<a id="savenote"></a>

### saveNote

- saveNote(handle: [ViewHandle](https://joplinapp.org/api/references/plugin_api/globals.html#viewhandle), props: [SaveNoteOptions](https://joplinapp.org/api/references/plugin_api/interfaces/savenoteoptions.html)): Promise<void\>

- #### Parameters
    
    - ##### handle: [ViewHandle](https://joplinapp.org/api/references/plugin_api/globals.html#viewhandle)
        
    - ##### props: [SaveNoteOptions](https://joplinapp.org/api/references/plugin_api/interfaces/savenoteoptions.html)
        

<a id="sethtml"></a>

### setHtml

- setHtml(handle: [ViewHandle](https://joplinapp.org/api/references/plugin_api/globals.html#viewhandle), html: string): Promise<string\>

- #### Parameters
    
    - ##### handle: [ViewHandle](https://joplinapp.org/api/references/plugin_api/globals.html#viewhandle)
        
    - ##### html: string