# Frontend

React 19 + Vite, organizado por funcionalidade em `apps/web/src/features`.

## Turnos

- Abas **2º turno** / **1º turno** (`features/round-tabs`). O turno vai no hash (`#/1turno/sp`, `#/2turno`).
- Sem turno no endereço, `resolveRound` (`lib/view.ts`) mostra o **1º turno enquanto a apuração do 2º não começou** e muda sozinho para o 2º quando a primeira seção é totalizada — o site nunca fica vazio.
- O 2º turno é sempre carregado (é o dado ao vivo e decide o padrão); o 1º turno é buscado só quando exibido, uma vez (`staleTime: Infinity`, sem polling).
- No 1º turno, o placar mostra os dois finalistas, os **demais candidatos** num `<details>` e a barra inclui os demais em cinza — o marcador de 50% passa a ser o limite de maioria absoluta. O mapa usa os mesmos dois finalistas (em 2026 todas as UFs e o exterior foram liderados por eles).
- Antes da apuração do 2º turno: selo "Aguardando", contagem regressiva até 17h de 25/10 (`features/countdown`) e atalho para o 1º turno; sem barra de abrangência nem lista de estados.

## Dados e estado

- `api/use-results.ts`: TanStack Query por turno; o 2º turno tem polling de 20s, pausado com a aba oculta, e `keepPreviousData` para não piscar.
- Resposta validada com o schema de `@stb/contracts` (zod/mini, ~9 KB gzip).
- Turno e seleção (Brasil / região / UF / cidade / exterior / país) vivem no hash da URL (`lib/use-view.ts`: `#/sp`, `#/regiao/ne`, `#/exterior`, `#/sp/3550308`, `#/exterior/portugal`): links compartilháveis e botão voltar funcionam. A cidade é o código do IBGE dentro da UF (ADR 0014); um código que não começa pelo da UF cai no estado. O país é o nome sem acentos (`countrySlug`, ADR 0019); um slug malformado cai no Exterior.

## Identidade visual

Desenho de referência no Claude Design (ADR 0007). Tokens em `styles/tokens.css`:

- Verde `#00843D` e amarelo `#FFD60A` da bandeira (faixa no topo e no rodapé, marca), fundo `#F5F6F1`, texto `#0F1A14`.
- Fonte Schibsted Grotesk auto-hospedada (`@fontsource-variable/schibsted-grotesk`).
- O desenho é a fonte da verdade: cores, tipografia (inclusive algarismos tabulares em toda a página), layout e textos iguais ao design.
- Só tema claro, com as cores exatas do desenho (o tema escuro do sistema é ignorado).
- Textos e casas decimais seguem o desenho em cada tamanho de tela: "Toque…" no celular, "Clique…" no desktop; vantagem com 1 casa no celular e 2 na tabela do desktop.

## Página

1. **Cabeçalho:** marca, selo de status (Resultado final / Aguardando / Ao vivo / Apuração encerrada) e, no desktop, as abas de turno; no celular as abas ficam numa linha própria (`lib/use-media-query.ts`).
2. **Barra de abrangência** fixa no topo (`features/scope-chips`): Brasil, regiões e Exterior. Com um estado selecionado, o chip da região dele fica marcado como "pai".
3. **Card de resultado** (`features/result-card`): migalhas (Brasil › Nordeste › Bahia) e % apurado; avatares com a foto oficial do TSE num anel da cor do candidato (`components/CandidateAvatar`, ADR 0009; iniciais se faltar a foto), selo "Lidera"/"Mais votado"; barra com o marcador de 50%; duas linhas de três números-chave e o botão "Compartilhar …". A lógica fica em `headline.ts` (testada).
4. **Mapa** (`features/map`): seletor de estado (com Exterior) e legenda em grade. Com um estado ou uma cidade aberta, vira o **mapa municipal** (`features/state-map`, ADR 0014): municípios na cor e intensidade de quem lidera, a cidade selecionada contornada e com o nome escrito acima dela (`city-label.ts`), toque para selecionar e, além do seletor de estado, o seletor **"Ir para uma cidade"** (`CitySelect`, municípios em ordem alfabética; "Todas as cidades" volta ao estado). No desktop os dois seletores ficam lado a lado, numa linha abaixo do título. A malha de cada UF é um chunk próprio (`map:cities`), baixado só com aquele estado aberto. Com o Exterior aberto, vira o **mapa do exterior por país** (`features/world-map`, carregado sob demanda; ADR 0017): um continente por vez (chips Américas, Europa, Ásia e Oceania e África; a Europa abre primeiro), cada país com seção eleitoral na cor e intensidade de quem lidera e os demais em cinza claro; os nomes dos países com mais seções (`country-labels.ts`); um marcador para países pequenos demais para ver; e o botão "Voltar ao Brasil". A malha de cada continente é um chunk próprio (`map:world`). Tocar num país o seleciona (ADR 0019): card completo do país, com migalhas Brasil › Exterior › País, o país contornado e o mapa no continente dele; as linhas da "Votação por país" também selecionam o país, e "Compartilhar" desenha o continente com o país contornado.
5. **Análise da apuração** (`features/insights`, chunk carregado sob demanda, ADR 0012):
   - **Ainda dá virada?** — votos válidos que faltam (estimativa pelas seções pendentes), vantagem do líder e quanto o segundo colocado precisa do que falta, numa barra com marcador de 50%. Selo "Decidido" quando a vantagem supera todos os eleitores ainda não apurados (`outlook`). Some com 100% apurado.
   - **Como a apuração evoluiu** — curva da participação de cada finalista conforme as seções são apuradas, eixo vertical centrado em 50% (zoom de 5 em 5 p.p.), marcador "Virada · X%" quando a liderança muda, ritmo (seções/min) e previsão de 100% (`paceOf`). Junta o histórico de `GET /api/history` (uma busca por abrangência) com os snapshots do polling (`live-history.ts`).
   - **De onde vem a vantagem** — barras divergentes com o saldo de votos de cada estado (e do exterior, no Brasil), o primeiro finalista à esquerda; 10 linhas até "Ver todos". Tocar numa linha seleciona o estado. Também no 1º turno.
   - **Do 1º para o 2º turno** — participação de cada finalista nos dois turnos (variação em p.p.), votos dos demais candidatos no 1º turno e estados que mudaram de líder (tocar seleciona).
6. **Votação por cidade** (`features/cities`, com um estado ou uma cidade aberta, no lugar da lista de estados): resumo ("Lula lidera em 3 cidades, Flávio lidera em 19 cidades, de 22 cidades."), busca sem acento e uma linha (botão) por município com os votos dos dois finalistas, maiores eleitorados primeiro, 12 no celular e 20 no desktop até "Ver todas". É o caminho por teclado e leitor de tela até cada cidade. Dados de `GET /api/cities` (`api/cities.ts`, polling de 60s no 2º turno).
   **Cidade selecionada:** card completo (percentuais, votos, as duas linhas de números-chave, "Compartilhar Salvador"), com migalhas Brasil › Região › Estado › Cidade. A imagem compartilhada desenha o mapa municipal com a cidade contornada e "X lidera em N cidades" do estado. Sem análise da apuração, porque não existe histórico por município.
7. **Lista de estados** (`features/states-list`): cartões no celular, grade tipo tabela no desktop; no Brasil começa recolhida (8 no celular, 10 no desktop). Em região/estado mostra os estados da região. Escondida no Exterior.

8. **Votação por país** (`features/countries`, só no Exterior): resumo ("Lula venceu em 64 países, Flávio em 36 e houve 1 empate…", abstenção), busca sem acento, filtro por continente e uma linha por país com os votos dos dois finalistas; 12 países no celular e 20 no desktop até "Ver todos". Dados de `GET /api/abroad`, buscados só com o Exterior aberto (`api/abroad.ts`, polling de 60 s no 2º turno).
9. **Rodapé:** horário dos dados (fonte TSE) e "Desenvolvido por @danmfigueroa" (Instagram).

**Percentual e total de votos aparecem sempre**, em qualquer abrangência. No 1º turno, o card lista também os demais candidatos (nome, partido, % e votos). Numa região, o card mostra o % e os votos de cada finalista na região e, abaixo, em quantos estados cada um venceu (ou lidera). No Exterior, o terceiro número-chave é "Países com votos".

Números-chave do card, em duas linhas:

- **Primeira linha:** "Diferença"; "Demais candidatos" (1º turno) ou "Abstenção" (2º turno, % do eleitorado); "Seções apuradas" ("Países com votos" no Exterior).
- **Segunda linha** (inspirada no seuimposto.com, exceção pedida ao design), igual em toda abrangência e nos dois turnos: "Votos válidos" (total abreviado, ex.: "119,3 mi", e % do comparecimento), "Comparecimento" (% do eleitorado) e "Brancos e nulos" (% do comparecimento, como o TSE). Antes de haver votos, os percentuais aparecem como "—".

Escolher uma abrangência em qualquer lugar rola até o card de resultado, se ele estiver fora da tela.

## Finalistas e cores

- `lib/finalists.ts`: os dois primeiros nacionais, em **ordem fixa por número de urna**. A cor segue o candidato e nunca a posição: uma virada não troca lados nem cores.
- Vermelho `#D92D20` e azul `#1F5FD1` (claro) / `#EF5A4C` e `#4B83E8` (escuro); para texto, `#B42318` e `#1A4FB5` (contraste 4,5:1).
- Mapa: escala divergente por **margem em pontos percentuais**, em 5 faixas (`<2`, `2–5`, `5–10`, `10–20`, `20+`), cada passo também mais escuro (lê-se sem cor). Cinza para "sem votos" ou empate.
- Ao escolher uma região, os outros estados esmaecem; ao escolher um estado, os vizinhos de região ficam a meio-tom (`features/map/emphasis.ts`).
- Nomes do TSE vêm sem acento: `formatName` corrige os conhecidos ("Flávio").
- Cor nunca é a única pista: `aria-label` por estado, o card de resultado e a lista de estados trazem os números.

## Mapa

- Malha das UFs do IBGE (qualidade "mínima") em `data/br-uf.topo.json`.
- `scripts/build-map.ts` projeta (Mercator) e grava caminhos SVG em `brazil-map.generated.json` (~14 KB gzip): o navegador não carrega d3 nem topojson.
- Estados são botões acessíveis por teclado (Enter/Espaço). Sem tooltip nem efeito de hover, como no design.
- **Votos no exterior** (escopo `zz` do TSE, já somados ao total do Brasil) aparecem como um botão "Exterior" sobre o Atlântico, na mesma escala de cores e com ≥ 44px. Também há chip na barra de abrangência e opção no seletor.
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
4. Sem suporte a compartilhar arquivos (desktop): "Baixar imagem".

Não existe API web para postar direto nos Stories; a folha nativa do sistema oferece o Instagram.

### Prévia de links

Um link do site colado no WhatsApp, Facebook, X ou LinkedIn mostra título, descrição e a imagem `public/og.png` (1200×630), pelas meta tags Open Graph e `twitter:card` do `index.html` (ADR 0018). As URLs absolutas usam `%SITE_URL%`, que o plugin `site-url` do `vite.config.ts` troca pelo domínio de produção (`VERCEL_PROJECT_PRODUCTION_URL`, ou `segundo-turno-brasil.vercel.app`). A imagem é estática, sem placar, e se regera com `pnpm --filter @stb/web og:build` (precisa de Chromium: `npx playwright install chromium-headless-shell` ou `CHROME_PATH`). As redes guardam a prévia: depois de trocar a imagem, use o [depurador de compartilhamento do Facebook](https://developers.facebook.com/tools/debug/) para renovar o cache.

## Orçamento de performance

JS inicial ≈ 113 KB gzip, somando o `index` e os chunks que ele importa de início (React DOM ≈ 62 KB, mapa ≈ 14 KB, TanStack Query ≈ 10 KB, zod/mini ≈ 8 KB), CSS ≈ 6 KB, fonte ≈ 47 KB (woff2, subconjunto latino). Ficam em chunks separados, carregados só quando aparecem: diálogo de compartilhamento, análise da apuração (~5,5 KB), listas "Votação por cidade" e "Votação por país", mapas municipais e por continente e o Vercel Analytics (ADR 0010), que carrega depois do primeiro paint.

Para o primeiro paint (ADR 0021):

- **Tela de carregamento pré-renderizada:** o build (`vite build --ssr src/shell.tsx` + `scripts/prerender-shell.ts`) escreve o cabeçalho e "Carregando resultados…" (`layout/LoadingScreen.tsx`) dentro do `#root` do `index.html`. O celular pinta a página antes de baixar o JS, e o React substitui esse conteúdo ao iniciar. As classes dos CSS Modules saem iguais nos dois builds.
- **Fonte pré-carregada:** um plugin do Vite (`preloadFont`) põe `<link rel="preload">` para o woff2 latino, que o navegador só descobriria depois do CSS.
- **Prefetch da malha municipal:** encostar o dedo numa UF (no mapa ou na lista) já baixa o chunk do mapa dela (`prefetchStateMap`), antes de o toque terminar.
- **Polling sem re-render:** as respostas da API têm ETag (ADR 0020). Sem novidade, o navegador recebe 304, o structural sharing do TanStack mantém as mesmas referências e nada é renderizado de novo.
