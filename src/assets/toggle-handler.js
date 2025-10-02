/* eslint-disable no-undef */

// Esta função será chamada pelo evento onclick do botão injetado.
function sendTestMessage(contentScriptId, h1Content) {
    if (webviewApi && webviewApi.postMessage) {
        webviewApi.postMessage(contentScriptId, {
            command: 'testButtonClick',
            content: h1Content,
        });
    }
}