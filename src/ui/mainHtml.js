import joplin from 'api';
const fs = require('fs');
const path = require('path');

// Usando caminho fixo para desenvolvimento, conforme solicitado.
// AVISO: Não é portatil e precisará ser alterado para distribuição.
const assetsDir = 'C:\\Users\\muril\\OneDrive\\01 mycloud\\01 sistMu\\10.01 scripts\\2025-09-28 joplin_plugin\\web';

let styleContent = '';
let scriptContent = '';

try {
    styleContent = fs.readFileSync(path.join(assetsDir, 'styles.css'), 'utf8');
    scriptContent = fs.readFileSync(path.join(assetsDir, 'panel.js'), 'utf8');
} catch (e) {
    console.error('Erro ao ler os assets da web para o plugin mdpanel:', e);
    styleContent = 'body { color: red; }';
    scriptContent = 'document.body.innerText = "Erro: Não foi possível carregar os assets da web. Verifique o console.";';
}

/**
 * Salva o conteúdo HTML fornecido em um arquivo de depuração na raiz do projeto.
 * @param {string} htmlContent O conteúdo HTML a ser salvo.
 */
function saveHtmlForDebug(htmlContent) {
    const debugFilePath = 'C:\\Users\\muril\\OneDrive\\01 mycloud\\01 sistMu\\10.01 scripts\\2025-09-28 joplin_plugin\\debug.html';
    try {
        fs.writeFileSync(debugFilePath, htmlContent, 'utf8');
        console.info(`HTML de depuração salvo com sucesso em: ${debugFilePath}`);
    } catch (e) {
        console.error('Erro ao salvar o arquivo HTML de depuração:', e);
    }
}

/**
 * Constrói a string HTML completa, buscando o conteúdo da nota diretamente.
 * @returns {Promise<string>} A string HTML completa para a webview.
 */
export async function buildCompleteHtml() {
    // Busca o conteúdo da nota diretamente
    const note = await joplin.workspace.selectedNote();
    const renderedBodyHtml = note ? note.body : 'Por favor, selecione uma nota para exibir o conteúdo.';

    const finalHtml = `
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>mdpanel viewer</title>
    <style>
        ${styleContent}
    </style>
</head>
<body>
    <div id="app">
        <aside id="toc" aria-label="Table of contents"></aside>
        <main id="content">${renderedBodyHtml}</main>
    </div>
    <script>
        ${scriptContent}
    </script>
</body>
</html>
    `;

    // Para depuração, salvamos o HTML gerado
    saveHtmlForDebug(finalHtml);

    return finalHtml;
}
