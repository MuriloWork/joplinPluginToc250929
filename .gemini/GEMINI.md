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
- lembrete: ao final, sugerir o que fazer a seguir e pedir autorização para executar
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
        - Explica o propósito do plugin, como usar os comandos para gerar/atualizar o sumário e as opções de configuração.
    - `package.json`
        - Dependências (markdown-it), scripts de build, e metadados do plugin.
    - `manifest.json`
        - Arquivo de manifesto do plugin Joplin, definindo ID, versão, nome, etc.
    - `src/`
        - `index.ts`
            - Ponto de entrada principal (`joplin.plugins.register`).
            - Registra os `Content Scripts` (MarkdownIt plugins) para analisar a nota.
            - Registra os comandos do usuário (ex: gerar sumário).
            - Orquestra a lógica principal: recebe dados dos content scripts e usa os módulos da `api/` para modificar o corpo da nota.
        - `commands.js`
            - Define e registra os comandos do usuário, como por exemplo `gerarSumarioNaNota`.
        - `content_scripts/`
            - `tocGenerator.js`
                - Um `MarkdownItPlugin` que analisa os títulos da nota durante a renderização.
                - Extrai a estrutura de títulos (nível, texto, slug).
                - Envia essa estrutura para o plugin principal (`index.ts`) via `postMessage`.
            - `sectionHandler.js`
                - Um `MarkdownItPlugin` para a lógica de seções recolhíveis (`<details>`).
                - Modifica a renderização dos títulos para envolvê-los em tags `<details>` e `<summary>`.
        - `api/`
            - `parser.js`
                - Encapsula o uso de `markdown-it` para analisar o corpo da nota (`note.body`) em tokens.
                - Fornece utilitários para extrair títulos e seus níveis.
            - `sectioner.js`
                - Implementa o algoritmo para agrupar conteúdo sob os títulos corretos, respeitando a hierarquia.
                - Essencial para a funcionalidade de seções recolhíveis (`<details>`).
            - `slug.js`
                - Centraliza a lógica para criar "slugs" (IDs de URL amigáveis) a partir dos textos dos títulos, para criar os links do sumário.
            - `noteSync.js`
                - Gerencia a leitura e escrita segura da nota usando `joplin.data.api`.
                - Implementa um fluxo de "ler-modificar-escrever" para inserir o sumário ou atualizar os estados (`open`) das seções.
            - `patcher.js`
                - Contém a lógica para aplicar as alterações (o sumário gerado ou as tags `<details>`) no corpo do markdown da nota de forma inteligente.
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

- fluxo do plugin
    - Fluxo de Geração do Sumário (TOC)
        - Este fluxo é iniciado manualmente pelo usuário através de um comando.
        - 1. O usuário executa o comando para criar/atualizar o sumário na nota ativa.
        - 2. `index.ts` recebe a chamada do comando.
        - 3. `noteSync.js` é usado para ler o conteúdo atual e completo da nota.
        - 4. O conteúdo markdown é passado para o `parser.js`, que extrai todos os títulos (nível, texto).
        - 5. Com a lista de títulos, uma nova lista de links em formato markdown é gerada. O `slug.js` cria os links de âncora (ex: `[Título](#título)`).
        - 6. `patcher.js` pega o corpo original da nota e o novo sumário em markdown, e insere ou substitui o sumário antigo de forma inteligente (procurando por um marcador como `<!-- TOC -->` ou um sumário anterior).
        - 7. `noteSync.js` salva o corpo da nota modificado de volta no Joplin.
    - Fluxo de Renderização das Seções Recolhíveis
        - Este fluxo acontece automaticamente toda vez que o Joplin renderiza a visualização de uma nota.
        - 1. O Joplin inicia a renderização do markdown.
        - 2. O nosso `ContentScript` (`content_scripts/sectionHandler.js`), registrado como um `MarkdownItPlugin`, é ativado.
        - 3. O plugin sobrescreve as regras de renderização padrão para títulos (`heading_open`, `heading_close`).
        - 4. Ao encontrar um título, em vez de renderizar apenas `<h1>`, ele o envolve em tags `<details>` e `<summary>`.
        - 5. A lógica do `sectioner.js` é usada para garantir que todo o conteúdo abaixo de um título fique dentro da sua respectiva tag `<details>`, respeitando a hierarquia de títulos.
        - 6. O script também verifica se o texto do título no markdown original contém a palavra-chave `open`. Se contiver, ele adiciona o atributo `open` à tag `<details>` (`<details open>`), fazendo com que a seção já apareça aberta.
    - Fluxo de Persistência do Estado de Abertura (Toggle)
        - Este fluxo salva o estado (aberto/fechado) de uma seção quando o usuário clica nela.
        - 1. O usuário clica em um `<summary>` na nota renderizada, o que abre ou fecha a seção.
        - 2. Um pequeno script Javascript, também injetado pelo `ContentScript`, detecta esse evento de clique.
        - 3. O script identifica o título que foi clicado e seu novo estado (aberto ou fechado).
        - 4. Ele envia uma mensagem para o plugin principal via `postMessage` (ex: `{ command: 'toggleState', slug: 'titulo-clicado', isOpen: true }`).
        - 5. `index.ts` recebe a mensagem.
        - 6. Usando `patcher.js` e `noteSync.js`, ele localiza a linha do título correspondente no markdown da nota.
        - 7. Ele adiciona ou remove a palavra-chave ` open` no final da linha do título.
        - 8. `noteSync.js` salva a nota com a alteração.

<details>
<summary><h2 style="display: inline">4.1. versões anteriores e testes</h2></summary>

- logicas, versão antiga, revisar depois
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
- testes webview, comunicação
    - analise
        #### Pontos Críticos da Combinação (usando Content Scripts)

        Baseado na nossa investigação, os principais desafios técnicos (pontos críticos) para fazer essa combinação de funcionalidades funcionar são:

        **Acesso e "Timing":** Como e, principalmente, quando nosso script acessa o HTML da nota? Precisamos ter certeza que o conteúdo já foi totalmente renderizado pelo Joplin antes de tentarmos manipulá-lo.
        **Manipulação Segura do DOM:** Como podemos modificar o HTML (adicionar um sumário, envolver seções em divs) sem quebrar funcionalidades nativas do Joplin, como a sincronização de rolagem entre o editor e o visualizador?
        **Comunicação Bidirecional:** Como o content script (que roda na webview) envia dados de volta para o plugin (que roda no processo principal)? Por exemplo, para informar sobre a estrutura da nota. E como o plugin envia configurações para o content script?
        **Estilização Isolada**: Como aplicamos nosso CSS customizado nos elementos que criamos sem afetar ou sermos afetados negativamente pelo tema atual do Joplin (claro, escuro, etc.)?

        #### Pesquisa por Soluções nos Documentos

        A boa notícia é que a documentação e o plugin de exemplo que analisamos já nos dão pistas claras para cada um desses pontos:

        **Acesso e "Timing":** O modelo do MarkdownItPlugin é a solução. Ele nos permite registrar uma função que é chamada durante o processo de renderização do Joplin. Isso garante que nosso código execute no momento exato em que o HTML está sendo gerado, nos dando controle total.
        Manipulação Segura do DOM: O exemplo markdownItTestPlugin.ts mostra como substituir as regras de renderização. Em vez de manipular o DOM depois, nós geramos o HTML correto diretamente. Para os nossos objetivos, podemos, por exemplo, criar uma regra que renderiza os cabeçalhos (#, ##) não apenas como <h1>, <h2>, mas já envolvendo-os em divs com IDs, preparando o terreno para nossas outras funcionalidades.
        **Comunicação Bidirecional:**
        Script -> Plugin: O exemplo mostra a função joplinContentScriptPostMessage('ID_DO_SCRIPT', MENSAGEM). Podemos usá-la para enviar dados.
        Plugin -> Script: A comunicação nesse sentido é mais simples. O plugin pode passar dados ao registrar o script ou ao definir o HTML, mas a forma mais elegante é o script pedir dados ao plugin usando a mesma postMessage.
        **Estilização Isolada:** O plugin de exemplo tem uma função assets que retorna uma lista de arquivos CSS e JS a serem incluídos na página. Essa é a solução perfeita: criamos um arquivo CSS para nossos componentes e o Joplin o injetará na página.
        **Persistência:** As soluções devem sempre considerar que a expperiencia do usuario será contínua, tanto entre sessões () quanto entre dispositivos. Para persistencia de estado de abertura de `<details>` foi adotada uma solução não usual de atualizar automaticamente essa informação  de volta no conteudo da nota.
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
    - plano de testes
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

        #### 6.2.5. Plano de Testes Incrementais (Fase Atual)
        
        - Objetivo é validar os pontos críticos da nova arquitetura com testes mínimos antes de implementar a funcionalidade completa.
        - regra para os testes
            - arquivos existentes do projeto podem ser consumidos e copiados, mas não devem ser refatorados para os testes
            - usar pasta `\refat` para arquivos criados para os testes
        - TESTE 1: Renderização e Estilo (Nosso Próximo Passo)
            - Tarefa: Interceptar a renderização de todos os cabeçalhos H1 (# Titulo), adicionar uma classe CSS customizada (h1-customizado) e, através de um arquivo CSS injetado, alterar sua cor para vermelho.
            - Valida: A capacidade de usar MarkdownItPlugin e de registrar assets (CSS).
        - TESTE 2: Comunicação (Script -> Plugin)
            - Tarefa: Adicionar um botão ao lado de cada H1 renderizado. Ao clicar, o Content Script enviará uma mensagem para o Plugin Principal, que a registrará no console do Joplin.
            - Valida: A comunicação da webview para o plugin (postMessage / onMessage).

        #### 6.2.6. Estado Atual do Código:

        O projeto está estruturado para a abordagem antiga (painel/webview). Iniciaremos a refatoração para alinhar com a nova arquitetura de Content Scripts a partir do TESTE 1.
</details></details>

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

- plano atual
    - Etapa 1 — Configuração e Limpeza
        - objetivo: Limpar a arquitetura de painel antiga e configurar a base para a nova abordagem de `Content Script`.
        - tarefas:
            - Remover os diretórios `src/ui/` e `web/`.
            - Reescrever `index.ts` para registrar um `Content Script` básico do tipo `MarkdownItPlugin`.
            - Criar o arquivo `src/content_scripts/sectionHandler.ts` como um placeholder.
            - Limpar `webpack.config.js` e `commands.js` de referências à arquitetura antiga.
        - verificação:
            - O plugin compila e carrega no Joplin sem erros.
            - O console de desenvolvimento do Joplin exibe uma mensagem confirmando que o `MarkdownItPlugin` foi carregado.
    - Etapa 2 — Renderização Simples e Estilo
        - objetivo: Provar que conseguimos interceptar a renderização de um elemento e aplicar um estilo customizado.
        - tarefas:
            - Implementar a lógica em `sectionHandler.ts` para interceptar a renderização de títulos `H1` e envolvê-los em uma tag `<details>`.
            - Criar um arquivo `src/assets/section-styles.css` e registrá-lo no `Content Script` para estilizar os novos elementos.
        - verificação:
            - Na visualização de nota do Joplin, todos os títulos `H1` aparecem como seções `<details>` recolhíveis e com o estilo customizado aplicado.
    - Etapa 3 — Depuração da Renderização HTML
        - objetivo: Criar uma ferramenta de depuração para extrair o HTML renderizado pelo nosso plugin e salvá-lo em um arquivo para inspeção.
        - tarefas:
            - Criar um novo comando (ex: `debug.renderNoteToHtml`) em `commands.js`.
            - A lógica do comando irá:
                - Obter o corpo da nota selecionada.
                - Instanciar o `markdown-it` localmente, carregar nosso plugin `sectionHandler` e renderizar o corpo da nota para uma string HTML.
                - Salvar a string HTML em um arquivo (ex: `debug_render.html`) na raiz do projeto.
        - verificação:
            - Executar o novo comando pela paleta de comandos do Joplin.
            - Um arquivo `debug_render.html` é criado na raiz do projeto, permitindo inspecionar o HTML gerado em um navegador.
    - Etapa 4 — Comunicação e Persistência (Teste com Botão)
        - objetivo: Validar o ciclo completo de comunicação (da visualização para o plugin) e a persistência da alteração na nota.
        - tarefas:
            - Modificar o `sectionHandler.ts` para adicionar um botão de teste ao lado de cada `H1` renderizado.
            - Criar e registrar um arquivo `src/assets/toggle-handler.js` que, ao clicar no botão, envia uma mensagem para o plugin via `webviewApi.postMessage`.
            - Em `index.ts`, ouvir a mensagem com `joplin.contentScripts.onMessage` e, ao recebê-la, usar a API do Joplin para adicionar um texto de confirmação ao final da nota.
        - verificação:
            - Clicar no botão de teste na visualização da nota faz com que um texto (ex: "Teste OK!") seja adicionado ao corpo do markdown da nota.
    - Etapa 5 — Implementação Completa das Seções (Headings)
        - objetivo: Expandir a lógica para todos os níveis de título e usar o clique nativo do `<summary>`.
        - tarefas:
            - Substituir o botão de teste pela lógica de clique nativa do `<summary>` no `toggle-handler.js`.
            - Expandir a lógica do `sectionHandler.ts` para funcionar com todos os níveis de título (H1-H6), utilizando a lógica do `sectioner.js` para garantir o aninhamento correto.
            - Implementar a lógica de persistência que adiciona/remove a palavra-chave ` open` no markdown.
        - verificação:
            - Todos os títulos na visualização são seções `<details>` aninhadas corretamente.
            - Clicar em um título para abrir/fechar a seção adiciona/remove a palavra ` open` da linha correspondente no editor de markdown.
    - Etapa 6 — Implementação das Seções (Listas)
        - objetivo: Adicionar a funcionalidade de transformar listas em seções recolhíveis, similar aos cabeçalhos.
        - tarefas:
            - Modificar o `sectionHandler.ts` para interceptar a renderização das listas (`bullet_list_open`, `ordered_list_open`) existentes no documento.
            - Envolver todos os itens da listas que tenham filhos em tags `<details>``<summary>`.
            - Implementar a lógica de persistência para listas, usando a palavra-chave ` open` no final do conteudo de todos os itens com filhos.
            - Atualizar o `toggle-handler.js` para gerenciar o clique em `summary` de listas.
        - verificação:
            - Todas as listas na visualização aparecem completamente recolhíveis.
            - Clicar no `summary` da lista adiciona/remove ` open` no texto do item da lista no markdown.
    - Etapa 7 — Leitura do Estado `open`
        - objetivo: Fazer com que as seções já apareçam abertas se a palavra `open` estiver no título do markdown.
        - tarefas:
            - No `MarkdownItPlugin`, ao encontrar um título, verificar se o texto original no markdown contém a palavra-chave ` open`.
            - Se contiver, adicionar o atributo `open` à tag `<details>` (`<details open>`).
        - verificação:
            - Títulos no markdown que terminam com ` open` fazem com que a seção correspondente já apareça expandida na visualização.
    - Etapa 8 — Comando de Geração do Sumário (TOC)
        - objetivo: Criar um comando que o usuário possa executar para gerar ou atualizar um sumário no topo da nota.
        - tarefas:
            - Reativar/revisar o comando `createUpdateToc` em `src/commands.js`.
            - A lógica do comando usará `parser.js`, `slug.js` e `patcher.js` para inserir o sumário em markdown em um local específico da nota.
        - verificação:
            - Executar o novo comando pela paleta de comandos do Joplin insere um sumário com links clicáveis no corpo da nota.
    - Etapa 9 — Estilização e Leitura do Estado `open`
        - objetivo: Aplicar estilos customizados e fazer com que as seções já apareçam abertas se a palavra `open` estiver no título do markdown.
        - tarefas:
            - Criar um arquivo CSS (ex: `src/assets/section-styles.css`) com os estilos para `<details>` e `<summary>`.
            - Registrar este CSS como um asset do `Content Script` em `index.ts`.
            - No `MarkdownItPlugin`, ao encontrar um título, verificar se o texto original no markdown contém a palavra-chave ` open`.
            - Se contiver, adicionar o atributo `open` à tag `<details>` (`<details open>`).
        - verificação:
            - As seções recolhíveis devem ter o estilo definido no arquivo CSS.
            - Títulos no markdown que terminam com ` open` devem fazer com que a seção correspondente já apareça expandida na visualização.
    - Etapa 10 — Comunicação e Persistência do Estado
        - objetivo: Salvar o estado (aberto/fechado) de uma seção de volta no arquivo markdown quando o usuário clica nela.
        - tarefas:
            - Criar um script JS (ex: `src/assets/toggle-handler.js`) e registrá-lo como um asset do `Content Script`.
            - No script, adicionar listeners de clique nos `<summary>`. Ao clicar, enviar uma mensagem para o plugin principal via `webviewApi.postMessage` com o slug do título e o novo estado (`open`).
            - Em `index.ts`, ouvir essas mensagens com `joplin.contentScripts.onMessage`.
            - Ao receber a mensagem, usar `noteSync.js` e `patcher.js` para encontrar a linha do título no markdown e adicionar/remover a palavra-chave ` open`.
        - verificação:
            - Clicar em um título na visualização altera seu estado (abre/fecha).
            - A palavra ` open` é adicionada ou removida da linha correspondente no editor de markdown.
            - A mudança persiste ao selecionar outra nota e voltar.
    - Etapa 11 — Comando de Geração do Sumário (TOC)
        - objetivo: Criar um comando que o usuário possa executar para gerar ou atualizar um sumário (Table of Contents) no topo da nota.
        - tarefas:
            - Reativar/revisar o comando `createUpdateToc` em `src/commands.js`.
            - A lógica do comando usará `parser.js` para extrair todos os títulos, `slug.js` para criar os links, e `patcher.js` para inserir o sumário em markdown em um local específico da nota (ex: após um marcador `<!-- TOC -->`).
        - verificação:
            - Executar o novo comando pela paleta de comandos do Joplin.
            - Um sumário com links clicáveis deve ser inserido no corpo da nota.
- versão antiga, historico 
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
