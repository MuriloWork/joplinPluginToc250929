# 01 250930 plano plugin webview - v2 (Refatorado)

<details>
<summary><h2 style="display: inline">0. Histórico de Alterações</h2></summary>

- **v2 (30/09/2025):** Mudança de estratégia para renderização da webview.
    - **Motivo:** A API do Joplin utilizada não possui o método `joplin.views.panels.addCss`. A tentativa de carregar assets (CSS, JS) externamente via `addScript` ou `addCss` falhou.
    - **Solução:** Adotada uma nova arquitetura para embutir (inline) o CSS e o JS diretamente na string HTML.
        - Criado um novo módulo `src/ui/mainHtml.js` com a responsabilidade única de montar o HTML completo da webview.
        - `panelManager.js` foi simplificado para apenas gerenciar o painel e a comunicação, solicitando o HTML pronto para o `mainHtml.js`.
        - As etapas de implementação foram redefinidas para refletir essa refatoração.
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
    - formatos
        - para chats web
            - paragrafos em listas markdown não numeradas
                - marcador "-" traço
                - tabulação de 4 espaços
                - sem linhas em branco, sem titulos em negrito
        - especifico para markdown
        - especifico para scripts
            - não incluir icones
- persistência dos papeis durante as conversas
    - PARA O DESENVOLVEDOR (VOCÊ):
        - **Início de cada sessão:** Relembrar os papéis estabelecidos
        - **A cada 5-10 mensagens:** Reconfirmar papéis
        - **Antes de cada etapa:** Confirmar se estou seguindo o plano atualizado
        - **Quando houver desvio:** Alertar imediatamente e corrigir a direção
        - **Após 3 tentativas:** Interromper e conduzir análise da causa
        - a cada requisição
            - lembrete: ao final, sugerir o que fazer a seguir e pedir autorização para executar
        - PALAVRAS-CHAVE DE ATIVAÇÃO:**
            - **"Relembrar papéis"** - Para reativar a estrutura
            - **"Verificar plano"** - Para confirmar alinhamento
            - **"Pausar para análise"** - Para interromper e analisar
    - PARA O AGENTE (EU):**
        - **Sempre começar** cada resposta com confirmação do papel
        - **Antes de cada ação:** Verificar se está alinhada com o plano
        - **Ao desviar:** Alertar explicitamente o motivo
        - **Incluir sempre:** Como verificar as alterações propostas
        - **Em erros:** Identificar causas antes de criar códigos
</details>

<details>
<summary><h2 style="display: inline">2. Objetivos e contextos do projeto</h2></summary>

- objetivos
    - criar joplin plugin para meu uso pessoal
        - criar painel de visualização adicional personalizado sem perdas de funcionalidades nativas
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
- contextos
    - API joplin
        - [site joplin](https://joplinapp.org/api/references/plugin_api/classes/joplin.html)
        - [github api](https://github.com/laurent22/joplin/tree/dev/readme/api/references)
        - [github dev](https://github.com/laurent22/joplin/tree/dev/readme/dev)
</details>

<details>
<summary><h2 style="display: inline">3. Estrutura do projeto e configurações</h2></summary>

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
        - `index.ts` 
            - Ponto de entrada: `joplin.plugins.register`.
            - Registra comandos e orquestra o acionamento do painel via `panelManager`.
        - `commands.js` 
            - Define e registra os comandos do plugin.
        - `api/` 
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
        - `ui/`
            - `mainHtml.js` (Novo)
                - Fábrica de HTML. Responsável por ler os assets da pasta `web/` (`index.html`, `styles.css`, `panel.js`).
                - Monta a string HTML final e auto-contida, embutindo o CSS dentro de tags `<style>` e o JS dentro de tags `<script>`.
                - Fornece uma função para ser consumida pelo `panelManager.js`.
            - `panelManager.js` (Refatorado)
                - Controlador do Painel. Responsável exclusivamente por interagir com a API `joplin.views.panels`.
                - Cria o painel, o mostra e esconde.
                - Usa o `mainHtml.js` para obter o HTML completo e o injeta no painel via `setHtml`.
                - Gerencia a comunicação (`onMessage`, `postMessage`) com a webview.
                - Não contém mais `addScript` ou `addCss`.
            - `sessionCache.js`
                - Cache em memória (noteId → parsed AST, generated HTML, lastSentHash) para evitar re-render desnecessário.
                - Mantém o estado temporário entre eventos dentro da sessão do plugin.
    - `web/`
        - `index.html`
            - Template HTML. Contém a estrutura base (esqueleto) da webview, com placeholders se necessário.
        - `panel.js`
            - Script do Cliente. Contém a lógica que roda dentro da webview (escuta de mensagens, manipulação do DOM, envio de eventos de clique). Seu conteúdo será embutido no HTML final.
        - `styles.css`
            - Folha de Estilos. Contém todo o CSS para o painel. Seu conteúdo será embutido no HTML final.

- configurações
    - API principal: joplin plugin
    - linguagens: typescript, javascript, nodejs
    - bibliotecas: markdown-it

- dicas e lembretes
    - Mantenha o parser/slug/sectioner bem testados — são o coração da lógica; preferível escrever testes unitários antes de integrar UI.
    - Minimize writes: use debounce e compare `note.updated_time` para reduzir sobrescritas acidentais.
    - Documente a convenção (por exemplo: `open` deve ser a última palavra do header; case-insensitive) no README para evitar confusões futuras.
    - Torne `addAnchors` opcional para não forçar alterações no corpo sem consentimento — inclua um comando `Annotate anchors` para aplicar em lote se desejar.
    - Faça o front-end simples inicialmente (HTML estático + vanilla JS) e depois evolua para bundlers/frameworks se quiser.
</details>

<details>
<summary><h2 style="display: inline">4. Lógicas (Revisado)</h2></summary>

- Fluxo de Renderização da View
    1. Usuário aciona o comando para abrir o painel.
    2. `panelManager.js` é ativado.
    3. `panelManager.js` chama uma função em `mainHtml.js` para construir o HTML inicial (com o estado "Carregando...").
    4. `mainHtml.js` lê `web/index.html`, `web/styles.css`, `web/panel.js`.
    5. `mainHtml.js` gera uma string HTML única, com o CSS embutido em `<style>` e o JS embutido em `<script>`.
    6. `panelManager.js` recebe essa string e a injeta no painel com `joplin.views.panels.setHtml()`.
    7. `panelManager.js` então processa a nota atual (usando os módulos da `api/`) para gerar o conteúdo dinâmico.
    8. `panelManager.js` envia o conteúdo dinâmico para a webview via `postMessage`.
    9. O `panel.js` (agora rodando na webview) recebe a mensagem e atualiza o DOM para exibir o conteúdo da nota.
- versão antiga, revisar depois
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
<summary><h2 style="display: inline">5. Implantação (Revisado)</h2></summary>

- regras para criação das etapas de implantação
    - seguir recomendaçoes da API principal
    - dividir em etapas que:
        - tenham contexto limitado de forma que o agente possa manter foco na qualidade e eficiencia do codigo
        - sejam funcionais do ponto de vista do usuário
        - possam ser testadas por funcionalidades acessadas pelo usuário e por mensagens no console
<details>
<summary><h3 style="display: inline">5.1. Etapas</h3></summary>

- etapas concluidas
    - Etapa 1 — Núcleo de parsing & sectioning (Concluída)
    - Objetivo: Construir e validar o motor que entende a nota.
    - Status: Concluída.
    - Etapa 2 — Sincronização segura da nota (Concluída)
    - Objetivo: Implementar leitura/escrita segura da nota.
    - Status: Concluída.
    - Etapa 3 — Refatoração da Arquitetura da View (Em andamento)
    - Objetivo: Reestruturar o código para separar a lógica de montagem do HTML da lógica de gerenciamento do painel, resolvendo o problema de carregamento de assets.
    - Tarefas:
        1. Criar o novo arquivo `src/ui/mainHtml.js`.
        2. Implementar a lógica em `mainHtml.js` para ler `web/index.html`, `web/styles.css` e `web/panel.js`.
        3. Implementar a função em `mainHtml.js` que combina os assets lidos em uma única string HTML auto-contida.
        4. Refatorar `panelManager.js` para remover as chamadas `addCss` e `addScript`.
        5. Refatorar `panelManager.js` para importar e usar `mainHtml.js` para obter o HTML e injetá-lo com `setHtml`.
- Etapa 4 — Renderização Inicial da View (Em andamento)
  - Objetivo: Corrigir o bug atual e fazer com que o painel exiba o conteúdo da nota corretamente, mesmo que ainda sem interatividade.
  - Tarefas:
      1. Depurar o `mainHtml.js` para garantir que o CSS e o JS estão sendo embutidos como tags `<style>` e `<script>`, e não como texto.
      2. Garantir que o `panel.js` (embutido) receba a mensagem `init` com o fragmento HTML e o insira corretamente no DOM.
      3. Testar até que o conteúdo da nota seja visível e estilizado no painel.
- Etapa 5 — Persistência do Estado de Toggle (Próxima)
  - Objetivo: Implementar a funcionalidade de clique nos cabeçalhos (`<summary>`) para salvar o estado `open`/fechado na nota.
  - Tarefas:
      1. Validar que a comunicação `postMessage` do `panel.js` para o `panelManager.js` está funcionando.
      2. Testar a lógica em `noteSync.js` e `patcher.js` para garantir que a nota é atualizada corretamente quando um clique ocorre.
- Etapa 6 — Sincronização de Edições Externas (Próxima)
  - Objetivo: Fazer com que o painel atualize automaticamente quando a nota é modificada em outro editor.
  - Tarefas:
      1. Implementar e testar o gatilho `onNoteChange` para chamar a função `refreshPanelForSelectedNote`.
</details></details>

<details open>
<summary><h2 style="display: inline">6. Refatoração e Teste da Arquitetura de Content Scripts</h2></summary>

<details>
<summary><h3 style="display: inline">6.1. Analise</h3></summary>

#### Pontos Críticos da Combinação (usando Content Scripts)

Baseado na nossa investigação, os principais desafios técnicos (pontos críticos) para fazer essa combinação de funcionalidades funcionar são:

**Acesso e "Timing"**: Como e, principalmente, quando nosso script acessa o HTML da nota? Precisamos ter certeza que o conteúdo já foi totalmente renderizado pelo Joplin antes de tentarmos manipulá-lo.
**Manipulação Segura do DOM**: Como podemos modificar o HTML (adicionar um sumário, envolver seções em divs) sem quebrar funcionalidades nativas do Joplin, como a sincronização de rolagem entre o editor e o visualizador?
Comunicação Bidirecional: Como o content script (que roda na webview) envia dados de volta para o plugin (que roda no processo principal)? Por exemplo, para informar sobre a estrutura da nota. E como o plugin envia configurações para o content script?
**Estilização Isolada**: Como aplicamos nosso CSS customizado nos elementos que criamos sem afetar ou sermos afetados negativamente pelo tema atual do Joplin (claro, escuro, etc.)?

#### Pesquisa por Soluções nos Documentos

A boa notícia é que a documentação e o plugin de exemplo que analisamos já nos dão pistas claras para cada um desses pontos:

**Acesso e "Timing":** O modelo do MarkdownItPlugin é a solução. Ele nos permite registrar uma função que é chamada durante o processo de renderização do Joplin. Isso garante que nosso código execute no momento exato em que o HTML está sendo gerado, nos dando controle total.
Manipulação Segura do DOM: O exemplo markdownItTestPlugin.ts mostra como substituir as regras de renderização. Em vez de manipular o DOM depois, nós geramos o HTML correto diretamente. Para os nossos objetivos, podemos, por exemplo, criar uma regra que renderiza os cabeçalhos (#, ##) não apenas como <h1>, <h2>, mas já envolvendo-os em divs com IDs, preparando o terreno para nossas outras funcionalidades.
**Comunicação Bidirecional:**
Script -> Plugin: O exemplo mostra a função joplinContentScriptPostMessage('ID_DO_SCRIPT', MENSAGEM). Podemos usá-la para enviar dados.
Plugin -> Script: A comunicação nesse sentido é mais simples. O plugin pode passar dados ao registrar o script ou ao definir o HTML, mas a forma mais elegante é o script pedir dados ao plugin usando a mesma postMessage.
**Estilização Isolada:** O plugin de exemplo tem uma função assets que retorna uma lista de arquivos CSS e JS a serem incluídos na página. Essa é a solução perfeita: criamos um arquivo CSS para nossos componentes e o Joplin o injetará na página.
**Persistência é Prioridade:** As soluções devem sempre considerar que a expperiencia do usuario será contínua, tanto entre sessões () quanto entre dispositivos. Para persistencia de estado de abertura de `<details>` foi adotada uma solução não usual de atualizar automaticamente essa informação  de volta no conteudo da nota.
**Simplicidade e Aprendizado:** Lembrar sempre que este é um projeto de uso individual, o plugin não será publicado, e que também tem o objetivo de aprendizado do desenvolvedor. Algumas otimizações e seguranças não são necessárias. O código deve ser claro, direto e com funções que possam ser facilmente relacionadas às funcionalidades do plugin, evitando complexidade desnecessária para facilitar o entendimento e a manutenção.

#### Testes Simples

Para validar essas soluções em nosso plugin, sugiro implementarmos os seguintes testes mínimos, um de cada vez:

##### Teste de Renderização e Estilo:

Objetivo: Provar que conseguimos interceptar a renderização de um elemento e aplicar um estilo customizado.
Implementação: Usar a API de ContentScript como um MarkdownItPlugin para encontrar todos os cabeçalhos de nível 1 (# Titulo) e adicionar uma classe CSS meu-h1-custom. Ao mesmo tempo, registrar um arquivo meu-estilo.css que define meu-h1-custom { color: red; }.
Resultado Esperado: Todos os títulos H1 na nota renderizada devem aparecer em vermelho.
<br>

##### Teste de Comunicação (Script -> Plugin):

Objetivo: Provar que a webview pode enviar uma mensagem para o nosso plugin.
Implementação: No MarkdownItPlugin do teste anterior, além de colorir o H1, adicionar um botão <button id="meu-botao">Clique-me</button> abaixo dele. Registrar um script JS que adiciona um listener a esse botão. Ao ser clicado, ele deve chamar joplinContentScriptPostMessage('meu-plugin', 'H1 clicado!'). No index.ts do plugin, usar joplin.contentScripts.onMessage para ouvir essa mensagem e logá-la no console do Joplin (console.info(...)).
Resultado Esperado: Ao clicar no botão na nota renderizada, a mensagem "H1 clicado!" deve aparecer no console de desenvolvimento do Joplin.
</details>

<details open>
<summary><h3 style="display: inline">6.2. Projeto de Refatoração</h2></summary>

#### 6.2.1. reforço do Objetivo Geral do Projeto

Aprimorar a funcionalidade das notas no Joplin, adicionando recursos como sumário automático, seções recolhíveis e outras melhorias de formatação.
Requisito Chave: As modificações geradas (como um sumário) devem ser persistidas diretamente no corpo do Markdown da nota.

#### 6.2.2. Arquitetura Decidida:

Abandonar: A abordagem de "fábrica de HTML", que consiste em criar um painel webview separado (panelManager.js, mainHtml.js, web/).
Adotar: A abordagem de Content Scripts, utilizando a API joplin.contentScripts. Esta é a forma nativa e recomendada para modificar a visualização de notas.


#### 6.2.4. Fluxo de Trabalho da Nova Arquitetura:

Um Content Script (especificamente um MarkdownItPlugin) "lê" a estrutura da nota durante a renderização do Joplin.
O script envia a estrutura extraída (ex: lista de cabeçalhos) para o Plugin Principal (index.ts).
O Plugin Principal "escreve" o conteúdo necessário (ex: um sumário em formato Markdown).
O Plugin Principal usa a API do Joplin (ex: joplin.data.put) para inserir ou atualizar esse Markdown no corpo da nota.

#### 6.2.5. Plano de Testes Incrementais (Fase Atual): O objetivo é validar os pontos críticos da nova arquitetura com testes mínimos antes de implementar a funcionalidade completa.

**TESTE 1:** Renderização e Estilo (Nosso Próximo Passo)

Tarefa: Interceptar a renderização de todos os cabeçalhos H1 (# Titulo), adicionar uma classe CSS customizada (h1-customizado) e, através de um arquivo CSS injetado, alterar sua cor para vermelho.
Valida: A capacidade de usar MarkdownItPlugin e de registrar assets (CSS).

**TESTE 2:** Comunicação (Script -> Plugin)

Tarefa: Adicionar um botão ao lado de cada H1 renderizado. Ao clicar, o Content Script enviará uma mensagem para o Plugin Principal, que a registrará no console do Joplin.
Valida: A comunicação da webview para o plugin (postMessage / onMessage).

#### 6.2.6. Estado Atual do Código:

O projeto está estruturado para a abordagem antiga (painel/webview). Iniciaremos a refatoração para alinhar com a nova arquitetura de Content Scripts a partir do TESTE 1.
</details>
