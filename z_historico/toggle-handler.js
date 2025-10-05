/* eslint-disable no-undef */

// Este script roda na WebView (visualizador de notas).
// Ele se comunica com o plugin principal para ligar/desligar a funcionalidade.

const contentScriptId = 'mdPanelSectionHandler';

/**
 * Atualiza a UI com base no estado do plugin (ligado/desligado).
 * @param {boolean} isEnabled - Se o plugin está habilitado.
 */
function updateUi(isEnabled) {
    if (isEnabled) {
        document.body.classList.remove('md-panels-disabled');
    } else {
        document.body.classList.add('md-panels-disabled');
    }
}

(async () => {
    /**
     * Função para obter o valor atual da configuração do plugin.
     */
    async function getIsEnabled() {
        return await webviewApi.postMessage(contentScriptId, {
            name: 'getSettingValue',
            key: 'mdPanelPluginEnabled',
        });
    }

    // 1. Obtém o estado inicial e atualiza a UI.
    const initialState = await getIsEnabled();
    updateUi(initialState);

    // 2. Inicia um loop de "long-polling" para ouvir por mudanças.
    // eslint-disable-next-line no-constant-condition
    while (true) {
        // Fica esperando o plugin principal nos notificar de uma mudança.
        await webviewApi.postMessage(contentScriptId, { name: 'waitForSettingChange' });
        // Quando a mudança ocorre, busca o novo estado e atualiza a UI.
        const newState = await getIsEnabled();
        updateUi(newState);
    }
})();