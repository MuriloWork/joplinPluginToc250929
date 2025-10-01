// refat/test2_sender.js
// Esta função será chamada pelo evento onclick do botão.
// Ela envia uma mensagem para o plugin principal com o conteúdo do H1.
function sendTestMessage(contentScriptId, h1Content) {
    if (webviewApi && webviewApi.postMessage) {
        webviewApi.postMessage(contentScriptId, {
            type: 'h1_button_click',
            content: h1Content,
        });
    }
}
