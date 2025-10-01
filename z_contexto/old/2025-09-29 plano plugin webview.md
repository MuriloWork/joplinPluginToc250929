# 01 250929 plano plugin webview

<details>
<summary>TOC</summary>

- [01 250923 plano plugin webview](#01-250923-plano-plugin-webview)
- [webview personalizada v02 hibrido, editors (obtem, converte), panels (renderiza) open](#webview-personalizada-v02-hibrido-editors-obtem-converte-panels-renderiza-open)
        - [Arquivos, principais responsabilidades](#arquivos-principais-responsabilidades)
- [PLANO DE TRABALHO, Plugin Joplin webview personalizada v01 open](#plano-de-trabalho-plugin-joplin-webview-personalizada-v01-open)
            - [1.1. Estrutura de Arquivos](#11-estrutura-de-arquivos)
            - [1.2. Configurações](#12-configurações)
            - [**Processo de Build:**](#processo-de-build)
                - [1.3.1. plugin "collapsible-block"](#131-plugin-collapsible-block)
    - [**Análise dos Scripts de Manipulação da Webview**](#análise-dos-scripts-de-manipulação-da-webview)
        - [**1. Estrutura de Comunicação Bidirecional**](#1-estrutura-de-comunicação-bidirecional)
            - [**A. Plugin Principal (`index.ts`)**](#a-plugin-principal-indexts)
            - [**B. Webview Script (`webviewScript.js`)**](#b-webview-script-webviewscriptjs)
            - [**C. Editor Script (`editorScript.js`)**](#c-editor-script-editorscriptjs)
        - [**2. Sistema de Persistência**](#2-sistema-de-persistência)
            - [**Tokens de Controle:**](#tokens-de-controle)
            - [**Fluxo de Persistência:**](#fluxo-de-persistência)
        - [**3. Configurações de Persistência**](#3-configurações-de-persistência)
        - [**4. Padrões Chave para Implementação**](#4-padrões-chave-para-implementação)
            - [**A. Sistema de Mensagens:**](#a-sistema-de-mensagens)
            - [**B. Modificação do Editor:**](#b-modificação-do-editor)
            - [**C. Detecção de Mudanças:**](#c-detecção-de-mudanças)
        - [**5. Aplicação para Nosso Plugin**](#5-aplicação-para-nosso-plugin)
    - [Opções resumidas (rápido)](#opções-resumidas-rápido)
    - [Por que recomendo o fluxo híbrido (detalhado)](#por-que-recomendo-o-fluxo-híbrido-detalhado)
    - [Passo-a-passo prático (exemplo mínimo — plugin Joplin)](#passo-a-passo-prático-exemplo-mínimo--plugin-joplin)
    - [Exemplo alternativo: contentScript (quando usar)](#exemplo-alternativo-contentscript-quando-usar)
    - [Dicas práticas e armadilhas](#dicas-práticas-e-armadilhas)
    - [Conclusão rápida](#conclusão-rápida)
    - [Observações finais (práticas)](#observações-finais-práticas)
            - [Módulo de Transformação (`src/webview/transformation.ts`):](#módulo-de-transformação-srcwebviewtransformationts)
            - [Módulo de Monitoramento (`src/webview/dom-monitor.ts`)](#módulo-de-monitoramento-srcwebviewdom-monitorts)
            - [Script Principal de Injeção (`src/webview/injected-script.ts`)](#script-principal-de-injeção-srcwebviewinjected-scriptts)
            - [**Estrutura do Teste:**](#estrutura-do-teste)
            - [**Performance:**](#performance)
            - [**Robustez:**](#robustez)
            - [**Monitoramento:**](#monitoramento)
            - [**Comandos de Build:**](#comandos-de-build)
            - [**Estrutura Final:**](#estrutura-final)
- [Joplin, Lógica de Conversão Markdown → HTML](#joplin-lógica-de-conversão-markdown--html)
            - [**A. Inicialização do Plugin (index.ts)**](#a-inicialização-do-plugin-indexts)
            - [**B. Processamento Markdown (collapsible\_style\_webview.js)**](#b-processamento-markdown-collapsible_style_webviewjs)
            - [resumo funcional](#resumo-funcional)
                - [**index.ts**](#indexts)
                - [**contentScripts/**](#contentscripts)
                    - [**collapsible\_style\_webview.js**](#collapsible_style_webviewjs)
                    - [**details\_handler.js**](#details_handlerjs)
                    - [**dom\_test.js**](#dom_testjs)
                    - [**event\_based\_webview.js**](#event_based_webviewjs)
                    - [**frontmatter\_collapsible.js**](#frontmatter_collapsiblejs)
                    - [**iframe\_access\_test.js**](#iframe_access_testjs)
                    - [**tag\_based\_collapsible.js**](#tag_based_collapsiblejs)
                    - [**viewer\_demo.js**](#viewer_demojs)
                    - [**webview\_injector.js**](#webview_injectorjs)
                    - [**webview\_test.js**](#webview_testjs)
    - [index.ts (\[ vscode \])](#indexts--vscode-)
    - [**contentScripts/collapsible\_style\_webview.js**](#contentscriptscollapsible_style_webviewjs)
    - [**contentScripts/details\_handler.js** e **viewer\_demo.js**](#contentscriptsdetails_handlerjs-e-viewer_demojs)
    - [**contentScripts/frontmatter\_collapsible.js**](#contentscriptsfrontmatter_collapsiblejs)
    - [**contentScripts/tag\_based\_collapsible.js**](#contentscriptstag_based_collapsiblejs)
    - [**Fluxo Geral de Persistência**](#fluxo-geral-de-persistência)
        - [**Resumo dos métodos-chave**](#resumo-dos-métodos-chave)
            - [**A. Interceptação de Tokens (core.ruler)**](#a-interceptação-de-tokens-coreruler)
            - [**B. Detecção de Sub-listas**](#b-detecção-de-sub-listas)
            - [**C. Substituição de Tokens**](#c-substituição-de-tokens)
            - [**A. Asset JavaScript**](#a-asset-javascript)
            - [**B. Execução no Contexto da Webview**](#b-execução-no-contexto-da-webview)
            - [**A. Webview → Plugin Principal**](#a-webview--plugin-principal)
            - [**A. Contexto de Execução**](#a-contexto-de-execução)
            - [**B. Lógica de Detecção**](#b-lógica-de-detecção)
            - [**C. Renderização**](#c-renderização)
</details>
<br>

# webview personalizada v02 hibrido, editors (obtem, converte), panels (renderiza) open

<details>
<summary><h2 style="display: inline">1. Regras de desenvolvimento</h2></summary>

- papeis
    - o meu papel é de **desenvolvedor** com as seguintes regras:
        1. planejar com a melhor clareza, detalhamento e consistencia possíveis;
        2. validar o plano com o agente em conversas prévias;
        3. dividir o desenvolvimento em etapas para permitir que o agente possa ser mais efetivo
        4. interromper o desenvolvimento após 3 tentativas de solucionar um problema e conduzir análise em busca da causa;
        5. corrigir o plano quando necessario e atualizar o agente.
    - o seu papel é de **"agente"** com as seguintes regras:
        1. seguir as instruções planejadas, sempre conforme A versão Mais atualizada do plano;
        2. adotar soluções usando ao máximo a tecnologia, linguagem, padrão;
        3. alertar Quando for seguir Uma direção diferente da planejada Informando o motivo;
        4. Junto com as alterações de código propostas Informar Como podem ser verificadas pelo desenvolvedor, através de logs, mensagens e Funções que possam ser verificadas Na interface de usuário;
        5. diante de erros, identificar as possíveis causas e resumir o que pode ser feito para corrigir, antes de sair criando ou revisando codigos e alertar se identificar um possível problema no paradigma de programação que está no plano.
- retorno
    - ESTRUTURA PADRÃO DAS RESPOSTAS do agente
        - PAPEL: Agente - Seguindo plano [versão/etapa]
        - AÇÃO: [o que vou fazer]
        - ALERTA: [se houver desvio]
        - VERIFICAÇÃO: [como você pode testar]
    - CHECKPOINTS REGULARES:**
        - **A cada 5-10 mensagens:** Reconfirmar papéis
        - **Antes de mudanças grandes:** Validar com você
        - **Após erros:** Pausar para análise
    - PALAVRAS-CHAVE DE ATIVAÇÃO:**
        - **"Relembrar papéis"** - Para reativar a estrutura
        - **"Verificar plano"** - Para confirmar alinhamento
        - **"Pausar para análise"** - Para interromper e analisar
    - para chats web
        - planos em listas markdown não numeradas, marcador "-" traço, tabulação de 4 espaços, , sem linhas em branco, sem titulos em negrito
    - especifico para markdown
    - especifico para scripts
        - não incluir icones
- persistência dos papeis durante as conversas
    - PARA O DESENVOLVEDOR (VOCÊ):
        - **Início de cada sessão:** Relembrar os papéis estabelecidos
        - **Antes de cada etapa:** Confirmar se estou seguindo o plano atualizado
        - **Quando houver desvio:** Alertar imediatamente e corrigir a direção
        - **Após 3 tentativas:** Interromper e conduzir análise da causa
    - PARA O AGENTE (EU):**
        - **Sempre começar** cada resposta com confirmação do papel
        - **Antes de cada ação:** Verificar se está alinhada com o plano
        - **Ao desviar:** Alertar explicitamente o motivo
        - **Incluir sempre:** Como verificar as alterações propostas
        - **Em erros:** Identificar causas antes de criar códigos
</details>

<details>
<summary><h2 style="display: inline">2. Objetivos do projeto</h2></summary>

- Joplin plugin para criar painel de visualização adicional personalizado sem perdas de funcionalidades nativas
    - o painel será ativável por comando (local a ser definido, se menu ou botão)
    - o painel personalizado será também será utilizado na versão mobile
- Funcionalidades principais
    - renderizações adicionais
        - com alteração do conteúdo da nota
            - incluir TOC table of contents
        - sem alteração do conteúdo da nota
            - aplicar `<details><summary>` nos headers e aninhar por níveis, por exemplo, todos os `<h2>` abaixo de um `<h1>` são filhos deste último
            - aplicar `<details><summary>` nas listas e aninhar
            - inibir a exibição de frontmatter
    - persistir o estado de abertura de `<details>` entre sessões 
- Exclusões
    - não alterar os editores de texto nativos
    - painel adicional não será utilizado para edição de conteúdo 
</details>

<details>
<summary><h2 style="display: inline">3. Estrutura do projeto e configurações </h2></summary>

### Arquivos, principais responsabilidades

- projeto
    - `README.md`
        - Explica propósito do plugin, instruções de instalação/teste e opções configuráveis.
    - `package.json`
        - Dependências (markdown-it, any slug/utility libs), scripts (build/test), metadados NPM se necessário.
    - `manifest.json`
        - Arquivo obrigatório de plugin Joplin (id, version, name, main, required API version, etc.).
    - `.vscode/`
        - `launch.json` (opcional)
            - Configurações para debug rápido do plugin no ambiente local (se usar VSCode Debugger).
    - `src/`
        - `main.js`
            - Ponto de entrada: `joplin.plugins.register({ onStart: async () => { ... } })`.
            - Registra comandos, cria painel (via panelManager), escuta eventos de seleção/alteração de nota.
            - Orquestra fluxos: quando nota muda chama parser/sectioner → gera HTML → envia ao painel.
        - `api`
            - `parser.js`
                - Encapsula uso de `markdown-it` para parsear `note.body` em tokens/AST.
                - Fornece utilitários para extrair headings, detectar `open` (última palavra), localizar anchors `{#slug}`, e extrair listas/items com `open`.
                - Exporta funções testáveis (ex.: `parseNoteToTokens(body)` / `extractHeadings(tokens)`).
            - `sectioner.js`
                - Implementa algoritmo de sectioning (stack-based) que agrupa tokens em seções conforme níveis de heading.
                - Produz estrutura intermediária que pode ser transformada em HTML com `<details>` aninhados.
                - Responsável por remover/retornar somente a palavra `open` quando for necessário (aqui você decidiu mantê-la visível — mas a função permite strip se precisar).
            - `slug.js`
                - Centraliza algoritmo de slugify (opções para compatibilidade com VSCode/TOC).
                - Função de match: `matchHeaderBySlug(tokens, slug)` que prioriza anchors explícitos e depois heurística de slug.
                - Facilita mudança futura (se trocar política de slug).
            - `noteSync.js`
                - Leitura/escrita segura da nota via `joplin.data.get` / `put`.
                - Implementa read-modify-write, verificação de `updated_time`, e reconciliação simples (reparse e reaplicar mudanças).
                - Debounce de gravações e queueing por `noteId`.
            - `patcher.js`
        - `state`
            - `config.js`
                - Valores default das configurações e funções para carregar/salvar preferências via `joplin.settings`.
            - `sessionCache.js`
                - Cache em memória (noteId → parsed AST, generated HTML, lastSentHash) para evitar re-render desnecessário.
                - Mantém o estado temporário entre eventos dentro da sessão do plugin.
        - `ui`
            - `panelManager.js`
                - Cria painel (`joplin.views.panels.create`) e carrega `web/index.html` via `setHtml`.
                - Registra `onMessage` para receber toggles do webview; usa `postMessage` para enviar HTML/TOC/estado.
                - Garante `addScript` para `dompurify` (se necessário) e injeta assets.
        - `commands.js`
            - Define comandos acionáveis (abrir/fechar painel, forçar rescan, toggle addAnchors, export state, run tests).
            - Registra atalhos/menus se desejado.
    - `web/`
        - `index.html`
            - Shell do painel: container (`#app`), handlers para `webviewApi.onMessage`, envio de `ready` e eventos de UI (click toggles).
            - Carrega `panel.js`, `styles.css` e vendor libs se necessário.
        - `panel.js`
            - Frontend: recebe `init`/`update` messages, injeta HTML sanitizado, aplica listeners para `<summary>`/toggle, envia `toggle` messages para plugin.
            - Responsável por UX (animações, acessibilidade, comportamento em mobile).
        - `styles.css`
            - Estilos para `<details>`, `<summary>`, listas, toc sidebar; mobile-friendly.
        - `vendor/`
            - `markdown-it.min.js`
                - se usar no frontend opcionalmente
            - `dompurify.min.js`
                - sanitização no cliente (opcional)
        - `assets/`
            - ícones, imagens usadas no painel
    - `scripts/` (opcional)
        - `build.js` (opcional)
            - Copia `web/` para diretório final do plugin, bundle se necessário.
        - `lint.js`
    - `test/`
        - `fixtures/`
            - Notas de exemplo (com headers e listas variadas) para validar parser/sectioner manualmente.
        - `unit/`
            - Testes unitários para parser (detectar `open`), slug matching, and sectioning logic.
    - `docs/`
        - `design.md`
            - Documenta decisões importantes: convenção `open` (posicionamento), anchor policy, slug strategy e políticas de conflito.
        - `usage.md`
            - Guia de uso: como marcar headers, como o painel se comporta, como reverter alterações, configurações.

- dicas
    - Mantenha o parser/slug/sectioner bem testados — são o coração da lógica; preferível escrever testes unitários antes de integrar UI.
    - Minimize writes: use debounce e compare `note.updated_time` para reduzir sobrescritas acidentais.
    - Documente a convenção (por exemplo: `open` deve ser a última palavra do header; case-insensitive) no README para evitar confusões futuras.
    - Torne `addAnchors` opcional para não forçar alterações no corpo sem consentimento — inclua um comando `Annotate anchors` para aplicar em lote se desejar.
    - Faça o front-end simples inicialmente (HTML estático + vanilla JS) e depois evolua para bundlers/frameworks se quiser.
</details>

<details>
<summary><h2 style="display: inline">4. Lógicas</h2></summary>


</details>

<details open>
<summary><h2 style="display: inline">5. Implantação</h2></summary>

<details>
<summary><h3 style="display: inline">5.1. Visão geral</h3></summary>

- Configurações principais do plugin
    - `addAnchors` (bool, opcional) — se true, plugin poderá inserir anchors `{#slug}` para estabilidade (configurável).
    - `debounceSaveMs` — tempo para agrupar gravações (ex.: 800 ms).
    - `anchorStyle` — algoritmo de slugify (opcional, para compatibilidade com ferramentas).
- Leitura / parsing da nota (quando o painel abre ou nota muda)
    - Obter `note.body`.
    - Parsear com **markdown-it** para obter tokens/AST.
    - Percorrer AST para:
        - Detectar todos os headings (level, texto bruto, posição).
        - Para cada heading, determinar `hasOpenFlag` se a última palavra (trim) for `open` (case-insensitive).
        - Detectar anchors explícitos do tipo `{#slug}` se presentes no texto do header.
        - Detectar listas e itens que terminam com `open` (se quiser renderizar lista com ícone/atributo).
    - Construir uma estrutura `sections[]` contendo: `{ level, text, hasOpenFlag, slugCandidate, anchor, tokenIndex }`.
- Gerar TOC (apenas em memória / para painel)
    - A partir dos `sections[]`, construir o TOC que será exibido no painel (navegação).
    - Slug strategy:
        - Se `anchor` existe → use esse slug.
        - Senão, gere um slug a partir do texto exatamente como VSCode faria (se quiser compatibilidade), ou opcionalmente gere o slug *ignorando* a palavra `open` (mas isso quebra compatibilidade com VSCode anchors).
        - Recomendo deixar configurável; default: gerar slug do texto tal como está (inclui `open`), a menos que `addAnchors` esteja ativo.
- Renderização do painel
    - Converta AST em HTML onde:
        - Cada header vira `<details ${hasOpenFlag ? 'open' : ''}>` com `<summary>` contendo o header com a palavra `open` (você preferiu mantê-la visível).
        - A seção do header engloba todo o conteúdo até o próximo header do mesmo/maior nível; headers aninhados viram `<details>` aninhados.
        - Para listas: renderize normalmente; itens que terminam com `open` são apresentados com um indicador (ou `data-open`), sem necessidade de persistir interações.
    - Painel contém handlers para toggles que postam mensagens ao plugin: `{ type: 'toggle', slug }`.
- Toggle (usuário clica no painel para abrir/fechar) → escrever no body
    - Fluxo:
        1. Painel envia `toggle` com `slug` e `open` boolean.
        2. Plugin recebe em `onMessage`. Debounce (agrupar várias ações).
        3. Plugin lê nota atual (fresh) e parseia novamente para localizar o header:
            * Prefer match por anchor `{#slug}` se existir; caso contrário, localizar o header cujo slug (calculado com o mesmo algoritmo) corresponde ao `slug` recebido.
        4. Atualizar a linha do header: adicionar ` open` ao final do texto (preservar `{#anchor}` se existir, idealmente mantendo o anchor depois do texto ou em padrão que você escolher), ou remover ` open` se `open=false`.
            * Mantenha espaços, e preserve outros sufixos (ex.: explicit anchors).
        5. `PUT` na nota com `joplin.data.put(['notes', note.id], null, { body: newBody })`.
        6. Reparsear e enviar ao painel o novo HTML para garantir sincronização visual.
    - Observação: quando `open` é adicionado, se `addAnchors` opção estiver ativa e não existir `{#slug}`, o plugin pode também **inserir** `{#slug}` para garantir estabilidade futura (opcional).
- Reação a edição externa (VSCode)
    - Monitorar alterações da nota (`onNoteSelectionChange` ou note update events).
    - Ao detectar mudança:
        - Reparsear o body e atualizar o painel (regenerar `sections` e HTML).
        - Isso mantém o painel em sincronia com edições em VSCode (incluindo quando o usuário manualmente adiciona/remova `open`).
- Conflitos, debounce e lastUpdate
    - Debounce gravações (ex.: 800–1200 ms) para reduzir writes e possíveis conflitos de sync.
    - Para segurança, em cada gravação:
        - Ler `note.updated_time` antes de escrever; após parse local, se `note.updated_time` mudou desde leitura inicial, reler e reconciliar (re-parsing e re-aplicando as mudanças) antes de escrever para reduzir risco de sobrescrever alterações externas.
        - Como seu uso é pessoal e volume pequeno, essa estratégia simples costuma ser suficiente.
- Edge cases e regras de robustez (essenciais)
    - Ignorar code fences: não interpretar `open` em headers que estejam dentro de code fences; AST resolve isso.
    - Inline code: se header contém backticks ou outras sintaxes, garantir que `open` detectado seja realmente última palavra em texto renderizado, não parte de code.
    - Header com explicit anchor: preserve a posição do anchor; ao adicionar/remover `open`, mantenha o anchor intacto. Exemplo:
        - `## Title {#my-id}` → ao marcar open: `## Title open {#my-id}` (ou `## Title {#my-id} open` — consistência: escolha uma convenção e mantenha).
    - Spacing e formatação: normalize trims para evitar duplicar espaços ao reescrever header.
    - Nesting: ao transformar headings em `<details>`, respeite níveis; H2 engloba H3, etc. Use stack-based sectioning.
- Testes mínimos recomendados
    - Header simples `## A open` → painel abre seção, toggle fecha/abre e altera o body corretamente.
    - Header com anchor `## A {#a}` → toggle altera `open` preservando anchor.
    - Nested headings: `## A open` contains `### B open` → both become nested details and toggles correct.
    - Code fences near headers: ensure no false positives.
    - TOC generated by VSCode present in note: plugin treats it as content — ensure no duplication or mis-parsing.
    - Simulate concurrent edit: open in VSCode, toggle in panel quickly, save in VSCode — ensure plugin reconciles (read-compare-write) and no data loss.
- Decisões de UX que convém confirmar (mas eu já adotei os defaults)
    - Ao editar via painel, o plugin escreve imediatamente no corpo (com debounce). (Yes)
    - A palavra `open` permanece visível no header. (Yes)
    - O plugin NÃO modifica TOC existente — trata-o como lista normal. (Yes)
    - `addAnchors` é opcional e configurável (default: false). Se você quiser estabilidade total de slugs, ligue-a manualmente. (Recomendado considerar mais tarde.)
- Checklist final antes de implementar
    - [ ] Confirmar convenção de posicionamento do anchor relativo ao `open` (por ex. `Title open {#id}` vs `Title {#id} open`). (Escolher agora evita ambiguidades.)
    - [ ] Escolher algoritmo de slugify se `addAnchors` for habilitado (compatível com VSCode TOC?).
    - [ ] Definir debounce default (ex.: 800 ms).
    - [ ] Especificar comportamento quando não encontra header por slug (log, notificar usuário, refazer TOC).
    - [ ] Escolher se painel reescreve a nota mesmo para toggles que já correspondem ao estado atual (evitar writes redundantes).
</details>

<details>
<summary><h3 style="display: inline">5.2. Etapas</h3></summary>

- Etapa 1 — Núcleo de parsing & sectioning (fundação)
  - Objetivo: construir e validar o motor que entende a nota, parseando o Markdown com markdown-it, detectando headings/list items com `open`, extraindo anchors e produzindo árvore de seções para renderização.
  - Tarefas: adicionar dependência `markdown-it`; implementar `parser.js` (tokens, headings, flag `open`); implementar `sectioner.js` (árvore de seções); implementar `slug.js` (slugify e match por slug); escrever testes unitários cobrindo casos básicos e edge cases; criar fixtures com exemplos reais.
  - Critérios de aceitação: testes unitários passam; headings com `open` detectados corretamente; árvore de seções correta para exemplos aninhados.
  - Riscos: falsos positivos em code fences (mitigar via AST de markdown-it); inconsistência de slug (mitigar encapsulando em `slug.js`).
- Etapa 2 — Sincronização segura da nota (read-modify-write) e lógica de toggle
  - Objetivo: implementar leitura/escrita segura da nota, localizar headers por slug e aplicar mudanças (`open`) no corpo da nota com debounce e verificação de `updated_time`.
  - Tarefas: implementar `noteSync.js` (read, writeSafely, debounce); implementar patch de headers preservando anchors/spaces; implementar `sessionCache.js` para cache AST/HTML; criar comando de teste `mdpanel.toggleTest`; escrever testes unitários para patch e noteSync.
  - Critérios de aceitação: patch altera só a linha do header; conflitos tratados via re-read/reconcile; debounce evita writes duplicados.
  - Riscos: sobrescrita de edição do usuário (mitigar re-read e merge conservador); alterações grandes em headers podem falhar (fallback: log e aviso ao usuário).
- Etapa 3 — Painel UI + integração end-to-end (webview)
  - Objetivo: criar painel webview, estabelecer comunicação plugin↔webview e validar fluxo completo de renderização e persistência do estado `open`.
  - Tarefas: implementar `panelManager.js` (create, setHtml, postMessage); criar `web/index.html`, `panel.js`, `styles.css`; listeners em `<summary>` enviando mensagens ao plugin; integrar toggles com `noteSync`; atualizar painel em mudanças de nota; testes manuais desktop e mobile.
  - Critérios de aceitação: painel exibe `<details>` corretamente; clique em `<summary>` atualiza corpo da nota e aparece no VSCode; alterações externas refletem no painel.
  - Riscos: diferenças no mobile (mitigar com estilos responsivos e testes); necessidade de sanitização (usar DOMPurify).
</details></details>
<br>
    
