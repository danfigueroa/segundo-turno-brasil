# Frontend

React 19 + Vite, organizado por funcionalidade em `apps/web/src/features`.

## Turnos

- Abas **2º turno** / **1º turno** (`features/round-tabs`). O turno vai no hash (`#/1turno/sp`, `#/2turno`).
- Sem turno no endereço, `resolveRound` (`lib/view.ts`) mostra o **1º turno enquanto a apuração do 2º não começou** e muda sozinho para o 2º quando a primeira seção é totalizada — o site nunca fica vazio.
- O 2º turno é sempre carregado (é o dado ao vivo e decide o padrão); o 1º turno é buscado só quando exibido, uma vez (`staleTime: Infinity`, sem polling).
- No 1º turno, o placar mostra os dois finalistas, os **demais candidatos** num `<details>` e a barra inclui os demais em cinza — o marcador de 50% passa a ser o limite de maioria absoluta. O mapa usa os mesmos dois finalistas (em 2026 todas as UFs e o exterior foram liderados por eles).
- Antes da apuração do 2º turno: selo "Aguardando", contagem regressiva até 17h de 25/10 (`features/countdown`) e atalho para o 1º turno; sem barra de abrangência nem lista de estados.

## Dados e estado

- `api/use-results.ts`: TanStack Query por turno; o 2º turno tem polling de 60s (ADR 0028), pausado com a aba oculta. `api/polling.ts` (`pollIntervalOf`, ADR 0031) para o polling quando a abrangência buscada fica 100% apurada e o deixa em 120s antes das 17h de 25/10. O `staleTime` de 45s evita nova consulta ao voltar à aba ou a uma abrangência vista há pouco, e cada consulta que falha tem uma nova tentativa só.
- Resposta validada com o schema de `@stb/contracts` (zod/mini, ~9 KB gzip).
- Turno e seleção (Brasil / região / UF / cidade / exterior / país) vivem no hash da URL (`lib/use-view.ts`: `#/sp`, `#/regiao/ne`, `#/exterior`, `#/sp/3550308`, `#/exterior/portugal`): links compartilháveis e botão voltar funcionam. A cidade é o código do IBGE dentro da UF (ADR 0014); um código que não começa pelo da UF cai no estado. O país é o nome sem acentos (`countrySlug`, ADR 0019); um slug malformado cai no Exterior. Na tela, o Exterior se chama "Outros países" (`ABROAD_LABEL`, em chip, botão do mapa, seletor, migalhas, título do card, compartilhamento e análise); o card mantém a linha "votos de brasileiros no exterior".

## Identidade visual

Desenho de referência no Claude Design (ADR 0007). Tokens em `styles/tokens.css`:

- Verde `#00843D` e amarelo `#FFD60A` da bandeira (faixa no topo e no rodapé, marca), fundo `#F5F6F1`, texto `#0F1A14`.
- Fonte Schibsted Grotesk auto-hospedada (`@fontsource-variable/schibsted-grotesk`).
- O desenho é a fonte da verdade: cores, tipografia (inclusive algarismos tabulares em toda a página), layout e textos iguais ao design.
- Só tema claro, com as cores exatas do desenho (o tema escuro do sistema é ignorado).
- Textos e casas decimais seguem o desenho em cada tamanho de tela: "Toque…" no celular, "Clique…" no desktop; vantagem com 1 casa no celular e 2 na tabela do desktop.

## Página

1. **Cabeçalho:** marca, selo de status (Resultado final / Aguardando / Ao vivo / Apuração encerrada) e, no desktop, as abas de turno; no celular as abas ficam numa linha própria (`lib/use-media-query.ts`).
2. **Barra de abrangência** fixa no topo (`features/scope-chips`): Brasil, regiões e "Outros países". Com um estado selecionado, o chip da região dele fica marcado como "pai". O lugar fixado pelo usuário ("★ Bahia") vem primeiro.
3. **Card de resultado** (`features/result-card`): migalhas (Brasil › Nordeste › Bahia) e % apurado; avatares com a foto oficial do TSE num anel da cor do candidato (`components/CandidateAvatar`, ADR 0009; iniciais se faltar a foto), selo "Lidera"/"Mais votado"; barra com o marcador de 50%; duas linhas de três números-chave e o botão "Compartilhar …" ("Compartilhar a vitória de Lula" no Brasil, quando o 2º turno está decidido; `lib/winner.ts`). Num estado, cidade ou país do exterior, "Fixar como meu estado/minha cidade/meu país" guarda o lugar no navegador (`lib/my-place.ts`, `localStorage`, sem servidor) e o oferece como atalho na barra de abrangência. A lógica fica em `headline.ts` (testada).
4. **Mapa** (`features/map`): seletor de estado (com Exterior) e legenda em grade. Com a apuração começada, "Quem lidera" / "Abstenção" troca o mapa do Brasil para a **abstenção por estado** (nas seções apuradas, ADR 0022), numa escala neutra de cinza-esverdeado em 5 faixas (`<15`, `15–20`, `20–25`, `25–30`, `30+`; `lib/abstention.ts`), que nunca se confunde com um candidato. Com um estado ou uma cidade aberta, vira o **mapa municipal** (`features/state-map`, ADR 0014): municípios na cor e intensidade de quem lidera, a cidade selecionada contornada e com o nome escrito acima dela (`city-label.ts`), toque para selecionar e, além do seletor de estado, o seletor **"Ir para uma cidade"** (`CitySelect`, municípios em ordem alfabética; "Todas as cidades" volta ao estado). No desktop os dois seletores ficam lado a lado, numa linha abaixo do título. A malha de cada UF é um chunk próprio (`map:cities`), baixado só com aquele estado aberto. Com o Exterior aberto, vira o **mapa do exterior por país** (`features/world-map`, carregado sob demanda; ADR 0017): um continente por vez (chips Américas, Europa, Ásia e Oceania e África; a Europa abre primeiro), cada país com seção eleitoral na cor e intensidade de quem lidera e os demais em cinza claro; os nomes dos países com mais seções (`country-labels.ts`); um marcador para países pequenos demais para ver; e o botão "Voltar ao Brasil". A malha de cada continente é um chunk próprio (`map:world`). Tocar num país o seleciona (ADR 0019): card completo do país, com migalhas Brasil › Outros países › País, o país contornado e o mapa no continente dele; as linhas da "Votação por país" também selecionam o país, e "Compartilhar" desenha o continente com o país contornado.
5. **Análise da apuração** (`features/insights`, chunk carregado sob demanda, ADR 0012):
   - **Ainda dá virada?** — votos válidos que faltam (estimativa pelas seções pendentes), vantagem do líder e quanto o segundo colocado precisa do que falta, numa barra com marcador de 50%. Selo "Decidido" quando a vantagem supera todos os eleitores ainda não apurados (`outlook`). Some com 100% apurado.
   - **Como a apuração evoluiu** — curva da participação de cada finalista conforme as seções são apuradas, eixo vertical centrado em 50% (zoom de 5 em 5 p.p.), marcador "Virada · X%" quando a liderança muda, ritmo (seções/min) e previsão de 100% (`paceOf`). Junta o histórico de `GET /api/history` (uma busca por abrangência) com os snapshots do polling (`live-history.ts`).
   - **De onde vem a vantagem** — barras divergentes com o saldo de votos de cada estado (e do exterior, no Brasil), o primeiro finalista à esquerda; 10 linhas até "Ver todos". Tocar numa linha seleciona o estado. Também no 1º turno.
   - **Do 1º para o 2º turno** — participação de cada finalista nos dois turnos (variação em p.p.), votos dos demais candidatos no 1º turno e estados que mudaram de líder (tocar seleciona).
   - **Comparação com 2022** (ADR 0024) — cada número de urna no 2º turno de 2022 (13 Lula, 22 Jair Bolsonaro) e agora; no Brasil, o mesmo momento da apuração de 2022 ("com 50% das seções apuradas, Lula tinha…"); estados com outro líder que em 2022. Dados versionados em `data/runoff-2022.generated.json` (`data:2022`).
6. **Votação por cidade** (`features/cities`, com um estado ou uma cidade aberta, no lugar da lista de estados): resumo ("Lula lidera em 3 cidades, Flávio lidera em 19 cidades, de 22 cidades."), busca sem acento, ordenação ("Maior eleitorado", "Maior vantagem" ou "Mais urnas a apurar"; `sortCityRows`) e uma linha (botão) por município com os votos dos dois finalistas, 12 no celular e 20 no desktop até "Ver todas". É o caminho por teclado e leitor de tela até cada cidade. Dados de `GET /api/cities` (`api/cities.ts`, polling de 60s no 2º turno).
   **Cidade selecionada:** card completo (percentuais, votos, as duas linhas de números-chave, "Compartilhar Salvador"), com migalhas Brasil › Região › Estado › Cidade. A imagem compartilhada desenha o mapa municipal com a cidade contornada e "X lidera em N cidades" do estado. Sem análise da apuração, porque não existe histórico por município.
7. **Lista de estados** (`features/states-list`): cartões no celular, grade tipo tabela no desktop; no Brasil começa recolhida (8 no celular, 10 no desktop). Em região/estado mostra os estados da região. Escondida no Exterior.

8. **Votação por país** (`features/countries`, só no Exterior): resumo ("Lula venceu em 64 países, Flávio em 36 e houve 1 empate…", abstenção), busca sem acento, filtro por continente e uma linha por país com os votos dos dois finalistas; 12 países no celular e 20 no desktop até "Ver todos". Dados de `GET /api/abroad`, buscados só com o Exterior aberto (`api/abroad.ts`, polling de 60 s no 2º turno).
9. **App recomendado** (`features/recommended`, exceção pedida ao design): card no fim da página, em todas as telas (também na contagem regressiva, nunca no embed), com o WeRacha, de um amigo, e o botão "Conhecer o WeRacha", que abre https://weracha.app numa nova aba.
10. **Rodapé:** horário dos dados (fonte TSE) e "Desenvolvido por @danmfigueroa" (Instagram).

**Percentual e total de votos aparecem sempre**, em qualquer abrangência. No 1º turno, o card lista também os demais candidatos (nome, partido, % e votos). Numa região, o card mostra o % e os votos de cada finalista na região e, abaixo, em quantos estados cada um venceu (ou lidera). No Exterior, o terceiro número-chave é "Países com votos".

Números-chave do card, em duas linhas:

- **Primeira linha:** "Diferença"; "Demais candidatos" (1º turno) ou "Abstenção" (2º turno, % do eleitorado das seções apuradas, ADR 0022); "Seções apuradas" ("Países com votos" no Exterior).
- **Segunda linha** (inspirada no seuimposto.com, exceção pedida ao design), igual em toda abrangência e nos dois turnos: "Votos válidos" (total abreviado, ex.: "119,3 mi", e % do comparecimento), "Comparecimento" (% do eleitorado das seções apuradas) e "Brancos e nulos" (% do comparecimento, como o TSE). Antes de haver votos, os percentuais aparecem como "—".

Escolher uma abrangência em qualquer lugar rola até o card de resultado, se ele estiver fora da tela.

O **título da aba** traz o placar da abrangência na tela ("Bahia: Lula 70,00% × 30,00% Flávio · 87,40% apurado", `lib/document-title.ts`), para quem deixa a aba aberta em segundo plano.

**Visão incorporável** (ADR 0025): `/?embed#/ba` mostra só o card de resultado, com polling a cada 120s e pausado enquanto o iframe está fora da tela (`usePageInViewport`, ADR 0031), e um botão para o site completo, para blogs e portais incorporarem num `<iframe>`.

## Finalistas e cores

- `lib/finalists.ts`: os dois primeiros nacionais, em **ordem fixa por número de urna**. A cor segue o candidato e nunca a posição: uma virada não troca lados nem cores.
- Vermelho `#D92D20` e azul `#1F5FD1` (claro) / `#EF5A4C` e `#4B83E8` (escuro); para texto, `#B42318` e `#1A4FB5` (contraste 4,5:1).
- Mapa: escala divergente por **margem em pontos percentuais**, em 5 faixas (`<2`, `2–5`, `5–10`, `10–20`, `20+`), cada passo também mais escuro (lê-se sem cor). Cinza para "sem votos" ou empate.
- Ao escolher uma região, os outros estados esmaecem; ao escolher um estado, os vizinhos de região ficam a meio-tom (`features/map/emphasis.ts`).
- Nomes do TSE vêm sem acento: `formatName` corrige os conhecidos ("Flávio").
- Cor nunca é a única pista: `aria-label` por estado, o card de resultado e a lista de estados trazem os números.

## Mapa

- Malha das UFs do IBGE (qualidade "mínima") em `data/br-uf.topo.json`.
- `scripts/build-map.ts` projeta (Mercator) e grava caminhos SVG em `brazil-map.generated.json` (~7 KB gzip, comandos relativos via `compactPath`): o navegador não carrega d3 nem topojson.
- Estados são botões acessíveis por teclado (Enter/Espaço). Sem tooltip nem efeito de hover, como no design.
- **Votos no exterior** (escopo `zz` do TSE, já somados ao total do Brasil) aparecem como um botão "Outros países" sobre o Atlântico, na mesma escala de cores e com ≥ 44px. Também há chip na barra de abrangência e opção no seletor.
- Siglas dos estados só no desktop.

## Mobile

- Layout de uma coluna até 960px; acima disso, card de resultado e mapa lado a lado e a lista de estados embaixo.
- Tocar num estado troca o card de resultado e rola até ele.
- Alvos de toque ≥ 44px, `safe-area-inset`, `prefers-reduced-motion` respeitado (números e transições).
- Números animados por um tween próprio em `requestAnimationFrame` (sem re-render do React).

## Compartilhamento

`features/share`:

1. `share-content.ts` resolve o que mostrar a partir da seleção atual.
2. `render-share-image.ts` desenha em Canvas 2D — reaproveitando os caminhos do mapa via `Path2D` — em 1080×1920 (Stories, conteúdo fora dos ~250px de topo/base) ou 1080×1350 (Feed). Segue o card de Stories do desenho: faixa verde com o losango da bandeira, card branco com o placar, mapa com quantos estados cada um lidera e rodapé com fonte e endereço. Sempre no tema claro; a fonte é carregada (`document.fonts.load`) antes de desenhar.
3. `ShareDialog` (carregado sob demanda) gera o PNG **antes** do toque em "Compartilhar", porque o Safari só permite `navigator.share` dentro do gesto do usuário.
4. Sem suporte a compartilhar arquivos (desktop): "Baixar imagem". O endereço do arquivo baixado vive 60 s, porque o Chrome do Android pergunta "Baixar arquivo?" antes de lê-lo. Se a folha de compartilhamento falhar, a linha de status sugere baixar.
5. **Vídeo animado** (ADRs 0023 e 0029): "Gerar vídeo animado" monta ~6 s do canvas (números subindo e o mapa se colorindo, depois o resultado parado). `encode-share-video.ts` codifica quadro a quadro com WebCodecs e o Mediabunny (chunk sob demanda) num MP4 H.264 comum; sem WebCodecs, `share-video.ts` grava em tempo real com `MediaRecorder` (MP4 ou WebM), recusando gravação vazia ou travada. Depois vêm "Compartilhar vídeo" (segundo toque) e "Baixar vídeo".
6. **Texto** (`share-text.ts`): "Enviar como texto" manda pela folha do sistema (ou copia) um resumo com emojis da cor de cada candidato, % e votos, % apurado, horário e o link da mesma abrangência, para WhatsApp e grupos.
7. **Incorporar** (só no desktop): copia o `<iframe>` da visão incorporável.
8. Com o 2º turno decidido, a imagem do Brasil vira "Lula vence" (`2º TURNO 2026 · BRASIL`), e o texto começa com "✅ Lula vence a eleição presidencial".

**Endereço de produção:** a imagem, o vídeo, o texto, o código de incorporação e o link da visão incorporável usam `SITE_URL` (`lib/site.ts`), fixado no build pelo `define` `__SITE_URL__` do `vite.config.ts` (o mesmo domínio das meta tags). Assim, compartilhar a partir de `segundo-turno-brasil.vercel.app`, de um Preview ou do `localhost` leva sempre a `eleicao.danielfigueroa.dev`.

Não existe API web para postar direto nos Stories; a folha nativa do sistema oferece o Instagram.

### Prévia de links

Um link do site colado no WhatsApp, Facebook, X ou LinkedIn mostra título, descrição e a imagem `public/og.png` (1200×630), pelas meta tags Open Graph e `twitter:card` do `index.html` (ADR 0018). As URLs absolutas usam `%SITE_URL%`, que o plugin `site-url` do `vite.config.ts` troca pelo domínio de produção (`VERCEL_PROJECT_PRODUCTION_URL`, ou `eleicao.danielfigueroa.dev` fora da Vercel). A imagem é estática, sem placar, e se regera com `pnpm --filter @stb/web og:build` (precisa de Chromium: `npx playwright install chromium-headless-shell` ou `CHROME_PATH`). As redes guardam a prévia: depois de trocar a imagem, use o [depurador de compartilhamento do Facebook](https://developers.facebook.com/tools/debug/) para renovar o cache.

## Idiomas

O site fala sete idiomas (ADR 0030): português (padrão), inglês, espanhol, francês, italiano, alemão e japonês.

- **Onde ficam os textos:** `src/i18n/messages/pt-BR.ts` é a fonte de todos eles, agrupados por área (`site`, `result`, `map`, `lists`, `insights`, `share`…). Cada tradução (`en.ts`, `es.ts`…) é declarada como `Messages`, então o typecheck falha se faltar uma chave.
- **Nos componentes:** `const { m, f } = useI18n()`; `m` são os textos (`m.result.turnout`, `m.share.place('Bahia')`) e `f` os formatadores (`f.percent`, `f.votes`, `f.time`…). Funções puras que montam texto (`headlineOf`, `shareContentFrom`, `selectionTitle`, `documentTitle`…) recebem o `I18n` por parâmetro; nos testes, `DEFAULT_I18N` (pt-BR) ou `await loadI18n('en')`.
- **Texto novo:** acrescente a chave em `pt-BR.ts` (com TSDoc se o uso não for óbvio) e a tradução nos outros seis arquivos. Textos com números ou nomes viram funções.
- **Idioma novo:** acrescente o código em `LOCALES` e `LOCALE_INFO` (`i18n/locales.ts`, com a bandeira em `features/language/flags.tsx`), o arquivo de mensagens e o carregador em `i18n/load.ts`.
- **Escolha do idioma:** `?lang=xx` > `localStorage` (`stb:locale`) > idioma do navegador > pt-BR. O `main.tsx` carrega o chunk do idioma antes do primeiro render; trocar pela bandeira atualiza o `<html lang>` e o `?lang` da URL, se houver.
- **O que não se traduz:** nomes de estados, cidades, candidatos e partidos, a marca "Segundo Turno", os slugs da URL (`#/exterior/estados-unidos`) e a prévia de links. Países do exterior são nomeados por `Intl.DisplayNames` (`lib/country-codes.ts`).
- **Formatos:** separadores de milhar e decimal do idioma, `%` colado ao número em todos, horários sempre de Brasília.

## Orçamento de performance

JS inicial ≈ 116 KB gzip (orçamento de 124 KiB verificado no CI com `pnpm size`), somando o `index` e os chunks que ele importa de início (React DOM ≈ 62 KB, mapa ≈ 7 KB, TanStack Query ≈ 10 KB, zod/mini ≈ 8 KB, textos em pt-BR e formatadores ≈ 5 KB), CSS ≈ 6 KB, fonte ≈ 47 KB (woff2, subconjunto latino). Ficam em chunks separados, carregados só quando aparecem: as traduções (~4 KB cada) e a tabela de países para elas, diálogo de compartilhamento, análise da apuração (~5,5 KB), listas "Votação por cidade" e "Votação por país", mapas municipais e por continente e o Vercel Analytics (ADR 0010), que carrega depois do primeiro paint.

Para o primeiro paint (ADR 0021):

- **Tela de carregamento pré-renderizada:** o build (`vite build --ssr src/shell.tsx` + `scripts/prerender-shell.ts`) escreve o cabeçalho e "Carregando resultados…" (`layout/LoadingScreen.tsx`) dentro do `#root` do `index.html`. O celular pinta a página antes de baixar o JS, e o React substitui esse conteúdo ao iniciar. As classes dos CSS Modules saem iguais nos dois builds.
- **Fonte pré-carregada:** um plugin do Vite (`preloadFont`) põe `<link rel="preload">` para o woff2 latino, que o navegador só descobriria depois do CSS.
- **Resultados em paralelo:** `main.tsx` dispara a busca de `/api/results` (`resultsQuery`) antes de carregar o idioma e de renderizar, em vez de esperar o React montar.
- **Prefetch da malha municipal:** encostar o dedo numa UF (no mapa ou na lista) já baixa o chunk do mapa dela (`prefetchStateMap`) e os componentes do mapa municipal e da lista de cidades, antes de o toque terminar.
- **Polling sem re-render:** as respostas da API têm ETag (ADR 0020). Sem novidade, o navegador recebe 304 e entrega ao `fetch` o corpo guardado. `createJsonFetcher` (`api/fetch-json.ts`) reconhece o mesmo ETag e devolve o objeto já validado, sem parse de JSON nem do zod. Nada é renderizado de novo.
- **Mapa municipal leve:** cada município é um `CityShape` memoizado, em ordem fixa. O selecionado é desenhado de novo por cima, num `<g>` sem eventos, em vez de ir para o fim da lista, o que movia centenas de nós. As cores mudam sem transição, porque centenas de formas animando ao mesmo tempo pesam no celular. A "Votação por cidade" monta e ordena as linhas uma vez por poll e filtra com `useDeferredValue`; a busca normaliza cada nome uma vez só (`matchesSearch`).
