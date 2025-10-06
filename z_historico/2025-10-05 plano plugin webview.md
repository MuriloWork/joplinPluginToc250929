# 1. Regras de desenvolvimento open

- papeis
    - o meu papel é de **desenvolvedor** com as seguintes regras:
        1. planejar com a melhor clareza, detalhamento e consistencia possíveis;
        2. validar o plano com o agente em conversas prévias;
        3. dividir o desenvolvimento em etapas para permitir que o agente possa ser mais efetivo
        4. interromper o desenvolvimento após 3 tentativas de solucionar um problema e conduzir análise em busca da causa;
        5. corrigir o plano quando necessario e atualizar o agente.
    - o seu papel é de **"agente"** com as seguintes regras:
        - seguir as instruções planejadas, sempre conforme A versão Mais atualizada do plano;
        - adotar soluções usando ao máximo a tecnologia, linguagem, padrão;
        - alertar Quando for seguir Uma direção diferente da planejada Informando o motivo;
        - Junto com as alterações de código propostas Informar Como podem ser verificadas pelo desenvolvedor, através de logs, mensagens e Funções que possam ser verificadas Na interface de usuário;
        - diante de erros, identificar as possíveis causas e resumir o que pode ser feito para corrigir, antes de sair criando ou revisando codigos e alertar se identificar um possível problema no paradigma de programação que está no plano.
        - modo de solução de problema
            - quero
                - Identificação de possíveis causas
                - Explicação Dos trechos de código correspondentes
                - Sugestão de possíveis soluções
                - que alerte quando a possivel solução Representar uma mudança de paradigma
            - não quero
                - sugestão de alteração de nada que não esteja relacionado estritamente a causa do problema
                - Alteração de nada que não tenha sido explicitamente autorizado
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
    - PARA O DESENVOLVEDOR
        - **Início de cada sessão:** Relembrar os papéis estabelecidos
        - **A cada 5-10 mensagens:** Reconfirmar papéis
        - **Antes de cada etapa:** Confirmar se estou seguindo o plano atualizado
        - **Quando houver desvio:** Alertar imediatamente e corrigir a direção
        - **Após 3 tentativas:** Interromper e conduzir análise da causa
        - a cada requisição
            - modo de desenvolvimento: ao final, sugerir o que fazer a seguir e pedir autorização para executar
            - modo de solução de problema
                - quero
                    - Identificação de possíveis causas
                    - Explicação Dos trechos de código correspondentes
                    - Sugestão de possíveis soluções
                    - que alerte quando a possivel solução Representar uma mudança de paradigma
                - não quero
                    - sugestão de alteração de nada que não esteja relacionado estritamente a causa do problema
                    - Alteração de nada que não tenha sido explicitamente autorizado
        - PALAVRAS-CHAVE DE ATIVAÇÃO:**
            - **"Relembrar papéis"** - Para reativar a estrutura
            - **"Verificar plano"** - Para confirmar alinhamento
            - **"Pausar para análise"** - Para interromper e analisar
    - PARA O AGENTE
        - **Sempre começar** cada resposta com confirmação do papel
        - **Antes de cada ação:** Verificar se está alinhada com o plano
        - **Ao desviar:** Alertar explicitamente o motivo
        - **Incluir sempre:** Como verificar as alterações propostas
        - **Em erros:** Identificar causas antes de criar códigos
- modo de desenvolvimento: ao final, sugerir o que fazer a seguir e pedir autorização para executar
- modo de solução de problema
    - quero
        - Identificação de possíveis causas
        - Explicação Dos trechos de código correspondentes
        - Sugestão de possíveis soluções
        - que alerte quando a possivel solução Representar uma mudança de paradigma
    - não quero
        - sugestão de alteração de nada que não esteja relacionado estritamente a causa do problema
        - Alteração de nada que não tenha sido explicitamente autorizado

## 2. Objetivos e contextos do projeto

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

## 3. Estrutura do projeto e configurações

Arquivos, principais responsabilidades

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
    - linguagens:
        - typescript apenas para `index.ts`
        - javascript e nodejs para todos os demais scripts
    - bibliotecas: markdown-it
- dicas e lembretes
    - Mantenha o parser/slug/sectioner bem testados — são o coração da lógica; preferível escrever testes unitários antes de integrar UI.
    - Minimize writes: use debounce e compare `note.updated_time` para reduzir sobrescritas acidentais.
    - Documente a convenção (por exemplo: `open` deve ser a última palavra do header; case-insensitive) no README para evitar confusões futuras.
    - Torne `addAnchors` opcional para não forçar alterações no corpo sem consentimento — inclua um comando `Annotate anchors` para aplicar em lote se desejar.
    - Faça o front-end simples inicialmente (HTML estático + vanilla JS) e depois evolua para bundlers/frameworks se quiser.

## 4. Lógicas open

- fluxo do plugin
    - Organização de Arquivos e Arquitetura
        Nossa arquitetura atual é muito mais limpa e eficiente do que a inicial. Consolidamos toda a funcionalidade em um único arquivo, aproveitando ao máximo o motor de renderização do Joplin e os recursos nativos do HTML.
        - `src/index.js` (Ponto de Entrada):
            Este arquivo continua sendo o ponto de entrada padrão do plugin. Sua principal responsabilidade é registrar o contentScript que injeta nossa lógica de renderização.
        - `src/sectionHandler.js` (Coração do Plugin):
            Este é agora o único arquivo com toda a lógica funcional. Ele contém um plugin markdown-it que manipula o processo de conversão de Markdown para HTML.
            - Eliminação de Dependências: Ao adotar as tags nativas `<details>` e `<summary>` do HTML, eliminamos a necessidade de:
                - section-styles.css: O estilo básico de expandir/recolher é fornecido pelo navegador.
                - toggle-handler.js: A funcionalidade de clique é nativa das tags `<details>`/`<summary>`, dispensando JavaScript customizado no lado do cliente.
    - Resumo da Lógica em sectionHandler.js
        A lógica pode ser dividida em três partes principais: Ativação, Renderização Principal e Tratamento de Casos Especiais.
        - Lógica de Ativação (Por Nota)
            - Como funciona: Usamos uma regra de "core" do markdown-it chamada frontmatter_remover.
            - O que faz:
                - Ela é executada no início de cada renderização de nota.
                - Procura por um bloco de metadados (YAML frontmatter) no topo da nota.
                - Verifica se a propriedade pluginWebview: true está presente.
                - Se estiver, ela ativa a funcionalidade do plugin para aquela renderização específica, definindo uma flag env.mdPanelEnabled = true.
                - Por fim, remove os tokens do frontmatter para que eles não apareçam no painel renderizado.
            - Resultado: O plugin só modifica as notas que explicitamente o ativam, tornando-o não intrusivo.
        - Lógica de Renderização Principal (Seções e Listas)
            - Tecnologia Base: Usamos as tags `<details>` (o contêiner que expande/recolhe) e `<summary>` (o título clicável).
            - Para Títulos (heading_open / heading_close):
            - A regra heading_open é o principal motor. Ela usa uma stack (pilha) para rastrear os níveis dos títulos (h1, h2, etc.).
                - Ao encontrar um novo título, ela fecha as seções (`</details>`) de níveis iguais ou inferiores que estavam abertas.
                - Em seguida, ela injeta as tags `<details><summary>` antes do título.
                - A regra heading_close simplesmente fecha a tag `</summary>`.
                - A palavra-chave open no final de um título adiciona o atributo open à tag `<details>`, fazendo com que a seção já comece expandida.
            - Para Listas com Sub-listas (list_item_open, etc.):
                - A lógica aqui é mais complexa e lida com o caso de um item de lista que contém uma sub-lista aninhada.
                - A regra list_item_open detecta se um item de lista tem filhos. Se tiver, ela o transforma em uma seção recolhível, injetando `<li><details><summary>`.
                - Ela usa uma variável de estado (listDetailsToClose) para "lembrar" que precisa fechar o `<summary>` e o `<details>` nos momentos certos, que são, respectivamente, quando a sub-lista abre (bullet_list_open) e quando ela fecha (bullet_list_close).
        - Tratamento de Casos Especiais (As Correções Finais)
            - Espaçamento com `<br>` (br_section_fixer):
                - Problema: Um `<br>` usado para criar espaço vertical entre duas seções estava sendo renderizado dentro da seção anterior.
                - Solução: Criamos uma regra de "core" que é executada antes da renderização. Ela procura pelo padrão de um token `<br>` seguido por um token de título. Ao encontrar, ela insere um novo token de </html_block> contendo `</details>` antes do `<br>`. Isso força o fechamento da seção anterior no local exato, garantindo que o `<br>` seja renderizado entre as seções.
            - Fechamento no Final do Documento (section_closer):
                - Problema: Se a nota terminasse com seções abertas, as tags `</details>` não seriam fechadas.
                - Solução: Uma regra de "core" final, section_closer, verifica a stack e adiciona todas as tags `</details>` de fechamento necessárias no final do documento.

### 4.1. versões anteriores e testes open

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
- testes webview, comunicação open
    - analise
        - Pontos Críticos da Combinação (usando Content Scripts)
            Baseado na nossa investigação, os principais desafios técnicos (pontos críticos) para fazer essa combinação de funcionalidades funcionar são:
            **Acesso e "Timing":** Como e, principalmente, quando nosso script acessa o HTML da nota? Precisamos ter certeza que o conteúdo já foi totalmente renderizado pelo Joplin antes de tentarmos manipulá-lo.
            **Manipulação Segura do DOM:** Como podemos modificar o HTML (adicionar um sumário, envolver seções em divs) sem quebrar funcionalidades nativas do Joplin, como a sincronização de rolagem entre o editor e o visualizador?
            **Comunicação Bidirecional:** Como o content script (que roda na webview) envia dados de volta para o plugin (que roda no processo principal)? Por exemplo, para informar sobre a estrutura da nota. E como o plugin envia configurações para o content script?
            **Estilização Isolada**: Como aplicamos nosso CSS customizado nos elementos que criamos sem afetar ou sermos afetados negativamente pelo tema atual do Joplin (claro, escuro, etc.)?
        - Pesquisa por Soluções nos Documentos
            A boa notícia é que a documentação e o plugin de exemplo que analisamos já nos dão pistas claras para cada um desses pontos:
            **Acesso e "Timing":** O modelo do MarkdownItPlugin é a solução. Ele nos permite registrar uma função que é chamada durante o processo de renderização do Joplin. Isso garante que nosso código execute no momento exato em que o HTML está sendo gerado, nos dando controle total.
            Manipulação Segura do DOM: O exemplo markdownItTestPlugin.ts mostra como substituir as regras de renderização. Em vez de manipular o DOM depois, nós geramos o HTML correto diretamente. Para os nossos objetivos, podemos, por exemplo, criar uma regra que renderiza os cabeçalhos (#, ##) não apenas como <h1>, <h2>, mas já envolvendo-os em divs com IDs, preparando o terreno para nossas outras funcionalidades.
            **Comunicação Bidirecional:**
            Script -> Plugin: O exemplo mostra a função joplinContentScriptPostMessage('ID_DO_SCRIPT', MENSAGEM). Podemos usá-la para enviar dados.
            Plugin -> Script: A comunicação nesse sentido é mais simples. O plugin pode passar dados ao registrar o script ou ao definir o HTML, mas a forma mais elegante é o script pedir dados ao plugin usando a mesma postMessage.
            **Estilização Isolada:** O plugin de exemplo tem uma função assets que retorna uma lista de arquivos CSS e JS a serem incluídos na página. Essa é a solução perfeita: criamos um arquivo CSS para nossos componentes e o Joplin o injetará na página.
            **Persistência:** As soluções devem sempre considerar que a expperiencia do usuario será contínua, tanto entre sessões () quanto entre dispositivos. Para persistencia de estado de abertura de `<details>` foi adotada uma solução não usual de atualizar automaticamente essa informação  de volta no conteudo da nota.
            **Simplicidade e Aprendizado:** Lembrar sempre que este é um projeto de uso individual, o plugin não será publicado, e que também tem o objetivo de aprendizado do desenvolvedor. Algumas otimizações e seguranças não são necessárias. O código deve ser claro, direto e com funções que possam ser facilmente relacionadas às funcionalidades do plugin, evitando complexidade desnecessária para facilitar o entendimento e a manutenção.
        - Testes Simples
            Para validar essas soluções em nosso plugin, sugiro implementarmos os seguintes testes mínimos, um de cada vez:
        - Teste de Renderização e Estilo:
            Objetivo: Provar que conseguimos interceptar a renderização de um elemento e aplicar um estilo customizado.
            Implementação: Usar a API de ContentScript como um MarkdownItPlugin para encontrar todos os cabeçalhos de nível 1 (# Titulo) e adicionar uma classe CSS meu-h1-custom. Ao mesmo tempo, registrar um arquivo meu-estilo.css que define meu-h1-custom { color: red; }.
            Resultado Esperado: Todos os títulos H1 na nota renderizada devem aparecer em vermelho.
        - Teste de Comunicação (Script -> Plugin):
            Objetivo: Provar que a webview pode enviar uma mensagem para o nosso plugin.
            Implementação: No MarkdownItPlugin do teste anterior, além de colorir o H1, adicionar um botão <button id="meu-botao">Clique-me</button> abaixo dele. Registrar um script JS que adiciona um listener a esse botão. Ao ser clicado, ele deve chamar joplinContentScriptPostMessage('meu-plugin', 'H1 clicado!'). No index.ts do plugin, usar joplin.contentScripts.onMessage para ouvir essa mensagem e logá-la no console do Joplin (console.info(...)).
            Resultado Esperado: Ao clicar no botão na nota renderizada, a mensagem "H1 clicado!" deve aparecer no console de desenvolvimento do Joplin.
    - plano de testes
        - reforço do Objetivo Geral do Projeto
            Aprimorar a funcionalidade das notas no Joplin, adicionando recursos como sumário automático, seções recolhíveis e outras melhorias de formatação.
            Requisito Chave: As modificações geradas (como um sumário) devem ser persistidas diretamente no corpo do Markdown da nota.
        - Arquitetura Decidida:
            Abandonar: A abordagem de "fábrica de HTML", que consiste em criar um painel webview separado (panelManager.js, mainHtml.js, web/).
            Adotar: A abordagem de Content Scripts, utilizando a API joplin.contentScripts. Esta é a forma nativa e recomendada para modificar a visualização de notas.
        - Fluxo de Trabalho da Nova Arquitetura:
            Um Content Script (especificamente um MarkdownItPlugin) "lê" a estrutura da nota durante a renderização do Joplin.
            O script envia a estrutura extraída (ex: lista de cabeçalhos) para o Plugin Principal (index.ts).
            O Plugin Principal "escreve" o conteúdo necessário (ex: um sumário em formato Markdown).
            O Plugin Principal usa a API do Joplin (ex: joplin.data.put) para inserir ou atualizar esse Markdown no corpo da nota.
        - Plano de Testes Incrementais (Fase Atual)
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
        - Estado Atual do Código:
            O projeto está estruturado para a abordagem antiga (painel/webview). Iniciaremos a refatoração para alinhar com a nova arquitetura de Content Scripts a partir do TESTE 1.

## 5. Implantação open

- regras para criação das etapas de implantação
    - seguir recomendaçoes da API principal
    - dividir em etapas que:
        - tenham contexto limitado de forma que o agente possa manter foco na qualidade e eficiencia do codigo
        - sejam funcionais do ponto de vista do usuário
        - possam ser testadas por funcionalidades acessadas pelo usuário e por mensagens no console

### 5.1. Etapas open

- plano atual open
    - concluidas
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
        - etapa 8 - melhorias na renderização
            - objetivo: incluir novas condições (a) Renderização da TOC existente; (b) Como tratar a tag `<br>`
            - contexto
                - TOC
                    - as notas são editadas tanto no joplin quanto no vscode
                    - quando editadas no vscode é utilizada uma extensão que aplica e atualiza toc (table of contents) automaticamente
                    - a toc vinda do vscode é uma lista markdown e cada linha é um link markdown atualizado automaticamente pelos títulos dos headings
                    - neste caso a palavra open estará no fim do título do link (entre colchetes) e não no fim da linha
                    - A seção TOC tem heading sempre com titulo "TOC"
                - tag `<br>`
                    - quando existir a tag `<br>` imedatamente acima de um heading o `</details>` deve ser colocado na linha anterior a essa tag `<br>`
                        - exemplo da condição encontrada
                            ```markdown
                            ## heading 1
                            
                            texto

                            <br>

                            ## heading 2

                            texto
                            ```
                        - como fica após a renderização
                            ```markdown
                            <details>
                            <summary><h2 style="display: inline">heading 2<h2></summary>
                            
                            texto
                            </details>
                            <br>

                            <details>
                            <summary><h2 style="display: inline">heading 2<h2></summary>

                            texto
                            </details>
                            ```
                    - sempre existe 1 linha em branco entre `<br>` e o heading
            - Tarefas:
                - Para o TOC:
                    - Modificar a regra list_item_open em src/sectionHandler.js.
                    - Adicionar uma lógica que detecte se o item de lista atual está dentro de uma seção cujo título é "TOC".
                    - Se estiver, a verificação da palavra-chave open deve ser feita dentro do texto do link Markdown (o conteúdo entre []), em vez de no final da linha.
                - Para a tag `<br>`:
                    - Modificar a regra heading_open em src/sectionHandler.js.
                    - Antes de gerar as tags `<details>` de abertura, a lógica deve inspecionar os tokens imediatamente anteriores.
                    - Se um token do tipo html_block contendo `<br>` for encontrado antes do cabeçalho, a tag de fechamento `</details>` da seção anterior deve ser inserida antes da tag `<br>`.'
            - Verificação:
                - Para o TOC:
                    - Crie uma nota com um cabeçalho # TOC seguido por uma lista de links Markdown.
                    - Adicione a palavra open dentro do texto de um dos links (ex: - Título da Seção open).
                    - Verifique se este item da lista é renderizado como uma seção `<details>` já expandida, enquanto os outros itens da lista TOC não são afetados.
                - Para a tag `<br>`:
                    - Crie uma nota com a estrutura: ## Seção 1, conteúdo, `<br>`, ## Seção 2.
                    - Inspecione o HTML renderizado (usando o comando de debug ou as ferramentas do desenvolvedor).
                    - Confirme que o HTML gerado é `</details><br><details...>`, garantindo que a tag `<br>` fique fora da seção recolhível da "Seção 1".
    - Etapa 9 — ocultar frontmatter
    - Etapa 10 — habilitação do plugin via frontmatter
    - etapa 11 — Organização, implantação
        - Limpar códigos e comentários
        - identificar e eliminar arquivos descartáveis
        - Organização final de arquivos
        - Implantar em produção
    - etapa 12 — Planejar possíveis melhorias open
        - Nova condição para listas, "openAll"
        - webview própria open
            - resumo chatGpt open
                A renderização da *webview* no Joplin envolve alguns passos distintos (e um componente chamado *renderer*). Vou explicar de forma direta, passo a passo, e indicar onde isso acontece no código/documentação.
                - Visão geral rápida open
                    1. O Joplin guarda a nota em Markdown.
                    2. Um *renderer* converte esse Markdown para HTML (usa **markdown-it** + plugins e transformações específicas do Joplin). ([GitHub][1])
                    3. O HTML gerado passa por adaptadores: conversão de links/recursos internos (imagens, anexos), sanitização/segurança e injeção de CSS do tema. ([GitHub][1])
                    4. O HTML final é exibido dentro de uma WebView / BrowserWindow (processo de render do Electron ou componente WebView no mobile). A comunicação entre a UI nativa e a webview é feita via mensagens/IPC (postMessage/bridge). ([electronjs.org][2])
                - Componentes importantes (onde olhar) open
                    - **joplin-renderer / @joplin/renderer**: biblioteca que implementa a conversão Markdown → HTML usada pelo Joplin. Antigamente estava num repo separado; hoje faz parte do código do Joplin e também existe como pacote. É aqui que ficam as regras, plugins e transformações específicas (fenced code, mermaid, math, etc.). ([GitHub][1])
                    - **WebView (Electron / Mobile)**: no desktop Joplin usa a arquitetura do Electron — o HTML final roda no processo de render (Chromium). No mobile usa o componente WebView da plataforma. Comunicação e atualização do conteúdo são feitas via mensagens entre processos. ([electronjs.org][2])
                - Detalhes úteis para desenvolvedores de plugin / webview open
                    - Se você abre uma *webview panel* a partir de um plugin, a *webview* não — por si só — fornece uma instância do Markdown renderer dentro do contexto da página. Ou seja, se você quer converter Markdown dentro da sua própria página webview, normalmente precisa incluir/instalar `markdown-it` no seu código de plugin ou pedir ao backend do Joplin que gere o HTML e te envie. (Isso é mencionado nas discussões da comunidade). ([Joplin Forum][3])
                    - Plugins e o renderer trocam assets/CSS: o renderer injeta CSS do tema e adapta caminhos de recursos (anexos/images) para que a webview consiga carregar os arquivos locais corretamente. Há também preocupações de segurança (conteúdo local pode ficar bloqueado conforme configurações). ([GitHub][1])
                - Fluxo técnico simplificado open
                    - Usuário salva/edita nota (Markdown).
                    - App pede ao renderer: “converte essa nota” (renderer aplica markdown-it, plugins e transformações Joplin). ([GitHub][1])
                    - Renderer retorna HTML já sanitizado + referências a assets e CSS.
                    - HTML é entregue à webview; o Chromium (ou WebView nativa) renderiza o HTML/CSS/JS, exibindo a nota renderizada. ([electronjs.org][2])
                - Onde encontrar o código / referência open
                    - Repositório/documentação do renderer (laurent22/joplin-renderer e a versão integrada no repositório principal). ([GitHub][1])
                    - Discussões da comunidade (fórum) sobre parsing no webview e comunicação postMessage (úteis se for desenvolver plugin). ([Joplin Forum][3])
                - Referências open
                    [1]: https://github.com/laurent22/joplin-renderer?utm_source=chatgpt.com "laurent22/joplin-renderer: Markdown and HTML ..."
                    [2]: https://electronjs.org/docs/latest/tutorial/process-model?utm_source=chatgpt.com "Process Model"
                    [3]: https://discourse.joplinapp.org/t/parse-md-from-within-webview/15320?utm_source=chatgpt.com "Parse MD from within webview - Plugins"
        - versão mobile
        - Estilização dos marcadores de lista
            - substittuição do marcador markdown pelo triangulo do `<details>`
            - inversão dos marcadores, Como poderia ser feito?
                Sua dúvida sobre o estilo dos marcadores de lista é muito pertinente. O comportamento que você descreve é o padrão do navegador: o marcador do `<li>` (o bullet) é renderizado, e depois o conteúdo do `<li>`, que no nosso caso é a tag `<details>` com seu próprio marcador (o triângulo).

                Para inverter essa ordem e alcançar o resultado desejado (triângulo -> marcador original), precisaremos fazer uma alteração tanto na estrutura HTML que geramos quanto no CSS para controlar a aparência.

                Seguindo as regras do nosso modo de solução de problema, aqui está a análise de como isso pode ser feito.

                Análise da Causa e Solução Proposta
                Identificação da Causa Raiz:

                O problema é que estamos colocando a tag `<details>` dentro da tag `<li>`. O navegador aplica o estilo de lista (o marcador) ao `<li>` e, separadamente, aplica o marcador padrão (o triângulo) ao `<summary>` dentro do `<details>`. Não temos controle direto sobre a ordem desses dois marcadores gerados pelo navegador.
                Explicação dos Trechos de Código Correspondentes:

                A lógica atual em src/sectionHandler.js na regra list_item_open gera o seguinte HTML:
                ```javascript
                // Lógica atual
                return `<li><details ...><summary>`; 
                ```
                Isso resulta em uma estrutura ``<li><details><summary>...</summary></details></li>``, que causa a ordem de marcadores que você observou.
                Sugestão de Possíveis Soluções:

                A solução é mudar a abordagem: em vez de o `<li>` conter o `<details>`, faremos o `<details>` conter o `<li>`. Além disso, vamos remover o marcador padrão do `<li>` via CSS e "simular" o marcador original dentro do `<summary>`.

                Passo 1: Alterar a Estrutura HTML (em sectionHandler.js)

                Vamos modificar a regra list_item_open para gerar uma estrutura onde o `<details>` envolve o `<li>`.
                O summary conteria o texto do item, e o `<li>` conteria a sub-lista.
                A estrutura HTML alvo seria:

                ```html
                    Show full code block 
                    <details>
                        <summary>
                            <span class="list-marker-content">...texto do item...</span>
                        </summary>
                        <li> <!-- Este li não terá marcador, apenas conterá a sub-lista -->
                            <ul>...sub-lista...</ul>
                        </li>
                    </details>
                ```
                
                Passo 2: Alterar o Estilo (com um novo arquivo CSS)

                Criaríamos um arquivo CSS (src/assets/section-styles.css).
                Nesse CSS, usaríamos a propriedade list-style: none; para remover o marcador padrão do <li> que está dentro do `<details>`.
                Usaríamos o pseudo-elemento ::before no nosso `<span class="list-marker-content">` para recriar o marcador de lista (o bullet • ou o número) ao lado do texto, mas depois do triângulo do `<summary>`.
                Alerta de Paradigma:

                Isso representa uma mudança significativa na forma como renderizamos as listas. Em vez de usar o `<li>` como o contêiner principal, estamos usando o `<details>` e tratando o `<li>` como um mero invólucro para a sub-lista. É uma abordagem mais complexa, mas necessária para obter o controle visual que você deseja.
                Essa combinação de mudanças no HTML e no CSS nos daria controle total sobre a posição dos elementos, permitindo alcançar a ordem triângulo -> marcador -> texto.
    - etapa 13 — Atualizar documentação 
- historico
    - versão 2025-10-04
        - concluidas
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
            - etapa 8 - melhorias na renderização
                - objetivo: incluir novas condições (a) Renderização da TOC existente; (b) Como tratar a tag `<br>`
                - contexto
                    - TOC
                        - as notas são editadas tanto no joplin quanto no vscode
                        - quando editadas no vscode é utilizada uma extensão que aplica e atualiza toc (table of contents) automaticamente
                        - a toc vinda do vscode é uma lista markdown e cada linha é um link markdown atualizado automaticamente pelos títulos dos headings
                        - neste caso a palavra open estará no fim do título do link (entre colchetes) e não no fim da linha
                        - A seção TOC tem heading sempre com titulo "TOC"
                    - tag `<br>`
                        - quando existir a tag `<br>` imedatamente acima de um heading o `</details>` deve ser colocado na linha anterior a essa tag `<br>`
                            - exemplo da condição encontrada
                                ```markdown
                                ## heading 1
                                
                                texto

                                <br>

                                ## heading 2

                                texto
                                ```
                            - como fica após a renderização
                                ```markdown
                                    <details>
                                    <summary><h2 style="display: inline">heading 2<h2></summary>
                                    
                                    texto
                                    </details>
                                    <br>

                                    <details>
                                    <summary><h2 style="display: inline">heading 2<h2></summary>

                                    texto
                                    </details>
                                ```
                        - sempre existe 1 linha em branco entre `<br>` e o heading
                - Tarefas:
                    - Para o TOC:
                        - Modificar a regra list_item_open em src/sectionHandler.js.
                        - Adicionar uma lógica que detecte se o item de lista atual está dentro de uma seção cujo título é "TOC".
                        - Se estiver, a verificação da palavra-chave open deve ser feita dentro do texto do link Markdown (o conteúdo entre []), em vez de no final da linha.
                    - Para a tag `<br>`:
                        - Modificar a regra heading_open em src/sectionHandler.js.
                        - Antes de gerar as tags `<details>` de abertura, a lógica deve inspecionar os tokens imediatamente anteriores.
                        - Se um token do tipo html_block contendo `<br>` for encontrado antes do cabeçalho, a tag de fechamento `</details>` da seção anterior deve ser inserida antes da tag `<br>`.'
                - Verificação:
                    - Para o TOC:
                        - Crie uma nota com um cabeçalho # TOC seguido por uma lista de links Markdown.
                        - Adicione a palavra open dentro do texto de um dos links (ex: - Título da Seção open).
                        - Verifique se este item da lista é renderizado como uma seção `<details>` já expandida, enquanto os outros itens da lista TOC não são afetados.
                    - Para a tag `<br>`:
                        - Crie uma nota com a estrutura: ## Seção 1, conteúdo, `<br>`, ## Seção 2.
                        - Inspecione o HTML renderizado (usando o comando de debug ou as ferramentas do desenvolvedor).
                        - Confirme que o HTML gerado é `</details><br><details...>`, garantindo que a tag <br> fique fora da seção recolhível da "Seção 1".
        - Etapa 9 — Comando de Geração do Sumário (TOC)
            - objetivo: Criar um comando que o usuário possa executar para gerar ou atualizar um sumário no topo da nota.
            - tarefas:
                - Reativar/revisar o comando `createUpdateToc` em `src/commands.js`.
                - A lógica do comando usará `parser.js`, `slug.js` e `patcher.js` para inserir o sumário em markdown em um local específico da nota.
            - verificação:
                - Executar o novo comando pela paleta de comandos do Joplin insere um sumário com links clicáveis no corpo da nota.
        - Etapa 10 — Estilização e Leitura do Estado `open`
            - objetivo: Aplicar estilos customizados e fazer com que as seções já apareçam abertas se a palavra `open` estiver no título do markdown.
            - tarefas:
                - Criar um arquivo CSS (ex: `src/assets/section-styles.css`) com os estilos para `<details>` e `<summary>`.
                - Registrar este CSS como um asset do `Content Script` em `index.ts`.
                - No `MarkdownItPlugin`, ao encontrar um título, verificar se o texto original no markdown contém a palavra-chave ` open`.
                - Se contiver, adicionar o atributo `open` à tag `<details>` (`<details open>`).
            - verificação:
                - As seções recolhíveis devem ter o estilo definido no arquivo CSS.
                - Títulos no markdown que terminam com ` open` devem fazer com que a seção correspondente já apareça expandida na visualização.
        - Etapa 11 — Comunicação e Persistência do Estado
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
        - Etapa 12 — Comando de Geração do Sumário (TOC)
            - objetivo: Criar um comando que o usuário possa executar para gerar ou atualizar um sumário (Table of Contents) no topo da nota.
            - tarefas:
                - Reativar/revisar o comando `createUpdateToc` em `src/commands.js`.
                - A lógica do comando usará `parser.js` para extrair todos os títulos, `slug.js` para criar os links, e `patcher.js` para inserir o sumário em markdown em um local específico da nota (ex: após um marcador `<!-- TOC -->`).
            - verificação:
                - Executar o novo comando pela paleta de comandos do Joplin.
                - Um sumário com links clicáveis deve ser inserido no corpo da nota.
    - versão 2025-09-28
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
