/* eslint-disable no-undef */

document.addEventListener('joplin-noteDidUpdate', () => {
    attachClickHandlers(document.body);
});

function attachClickHandlers(rootNode) {
    const buttons = rootNode.querySelectorAll('.md-panel-test-button:not(._handlerAttached)');
    for (const button of buttons) {
        button.classList.add('_handlerAttached');
        button.addEventListener('click', (event) => {
            // Impede que o clique no botão também dispare o clique no <summary>
            event.stopPropagation();
            event.preventDefault();

            console.log('MDPanel: Test button clicked. Sending message to plugin.');

            // Envia uma mensagem para o plugin principal
            webviewApi.postMessage({
                command: 'testButtonClick',
            });
        });
    }
}

// Anexa os handlers na carga inicial
attachClickHandlers(document.body);