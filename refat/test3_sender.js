// refat/test3_sender.js
function sendPersistenceTest(contentScriptId, h1Content) {
    if (webviewApi && webviewApi.postMessage) {
        webviewApi.postMessage(contentScriptId, {
            type: 'add_timestamp',
            content: h1Content,
        });
    }
}
