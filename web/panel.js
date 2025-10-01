
(function () {
    function onMessage(msg) {
        if (!msg || !msg.type) return;
        if (msg.type === 'init') {
            const content = msg.html || '';
            const root = document.getElementById('content');
            if (window.DOMPurify) root.innerHTML = DOMPurify.sanitize(content);
            else root.innerHTML = content;
            attachHandlers();
        }
    }

    function attachHandlers() {
        document.querySelectorAll('details').forEach(d => {
            const summary = d.querySelector('summary');
            if (summary && !summary._attached) {
                summary._attached = true;
                summary.addEventListener('click', () => {
                    setTimeout(() => {
                        const open = d.hasAttribute('open');
                        const slug = d.getAttribute('data-slug');
                        if (window.webviewApi && window.webviewApi.postMessage) {
                            window.webviewApi.postMessage({ type: 'toggle', slug, open });
                        }
                    }, 50);
                });
            }
        });
    }

    if (window.webviewApi && window.webviewApi.onMessage) {
        window.webviewApi.onMessage(onMessage);
        window.webviewApi.postMessage({ type: 'ready' });
    } else {
        window.addEventListener('message', (e) => onMessage(e.data));
    }
})();
