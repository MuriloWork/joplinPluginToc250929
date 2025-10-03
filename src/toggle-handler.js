/* eslint-disable no-undef */

let isAttached = false;

if (!isAttached) {
    // Usamos delegação de eventos para ouvir todos os cliques em <details>
    // de forma eficiente, mesmo que o conteúdo da nota seja recarregado.
    document.body.addEventListener('toggle', (event) => {
        const detailsElement = event.target;

        // Certifica-se de que o evento veio de um de nossos painéis
        if (detailsElement.tagName === 'DETAILS' && (detailsElement.classList.contains('md-panel') || detailsElement.classList.contains('md-panel-list'))) {
            const summary = detailsElement.querySelector('summary');
            if (!summary) return;

            // Para cabeçalhos, o elemento com data-line é o h1, h2, etc.
            // Para listas, é o parágrafo dentro do summary.
            let heading = summary.querySelector('[data-line]');
            if (!heading) {
                // Fallback para o modelo antigo, caso o data-line esteja no elemento errado.
                // Para listas, o list_item_open que tem o data-line não é renderizado, então precisamos buscar o elemento correto.
                // A lógica no sectionHandler foi ajustada para colocar o data-line no elemento correto.
                return;
            }
            const line = heading.dataset.line;

            // Lê o ID do script do atributo que injetamos no HTML.
            const contentScriptId = detailsElement.dataset.contentScriptId;
        }
    }, true); // Usa a fase de captura para garantir que o evento seja pego

    isAttached = true;
}