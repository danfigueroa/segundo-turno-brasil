# 0007 — Redesenho com identidade verde e amarela

- Status: aceita
- Data: 2026-10-10

## Contexto

O visual foi refeito no Claude Design (telas de celular para Brasil, região, estado, exterior e 2º turno aguardando; desktop; card de Stories). O novo desenho muda a arquitetura da página, não só as cores: o resultado vira um card com navegação em migalhas, a escolha de abrangência fica numa barra fixa e o compartilhar entra no card.

## Decisão

- **Identidade:** verde `#00843D` e amarelo `#FFD60A` da bandeira, fundo `#F5F6F1`, texto `#0F1A14`; fonte **Schibsted Grotesk** auto-hospedada (`@fontsource-variable`, só o subconjunto latino é baixado, ~47 KB). Candidatos: vermelho `#D92D20` e azul `#1F5FD1`, com variantes mais escuras para texto. **Só tema claro**, exatamente como no desenho: o site ignora o tema escuro do sistema (`color-scheme: light`).
- **Sem bottom sheet:** tocar num estado (mapa, lista ou seletor) troca o card de resultado e rola a página até ele (`scrollIntoView` com `block: 'nearest'`, sem animação com `prefers-reduced-motion`). Com isso o `motion` saiu do bundle.
- **Compartilhar no card de resultado** ("Compartilhar Bahia"), em vez de botão flutuante. A barra fixa de abrangência fica sempre à mão para voltar ao topo do contexto.
- **Região** mostra quantos estados cada finalista lidera (e a maior vantagem), não a soma de votos.
- **Exterior** vira um botão HTML sobre o mapa, no lugar do bloco desenhado no SVG.
- **Antes da apuração do 2º turno:** contagem regressiva até 17h de 25/10 e atalho para o 1º turno, sem barra de abrangência nem lista de estados.
- **Imagem de compartilhamento** segue o card de Stories, no tema claro, respeitando as áreas seguras do Instagram.

- **O design é a fonte da verdade**: nada além do que ele mostra (sem tooltip no mapa, sem barra de progresso extra no card); o % apurado aparece como no desenho.

## Consequências

- JS inicial cai de ~138 KB para ~115 KB gzip (sem `motion`); a fonte soma ~47 KB, em cache longo.
- O botão de compartilhar deixa de ser fixo no celular: está no card, logo abaixo do placar.
- A seção "Votação por país" do desenho (exterior por país, com busca e continentes) depende de dados que a API ainda não serve: o TSE publica o exterior em 186 arquivos por cidade (`zz{código}-c0001-e{eleição}-u.json`), sem país nem continente. Fica pendente.
