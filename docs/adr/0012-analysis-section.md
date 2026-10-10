# 0012 — Seção de análise da apuração

- Status: aceita
- Data: 2026-10-10

## Contexto

Para diferenciar o site na noite do 2º turno, queremos responder às perguntas de quem acompanha a apuração: "ainda dá virada?", "como a apuração evoluiu?", "de onde vem a vantagem?" e "o que mudou desde o 1º turno?". O design de referência (ADR 0007) não tem esses elementos, e a pessoa responsável pelo projeto pediu que eles fossem criados seguindo a identidade e o layout existentes.

## Decisão

- Nova seção entre o mapa e a lista de estados (`features/insights`), com cards no mesmo formato da lista de estados: título 18/22 px peso 800, subtítulo secundário, cores dos candidatos (`--cand-*`), barras com marcador de 50%, números-chave em grade de duas colunas, alvos de toque ≥ 44 px. Uma coluna no celular e duas a partir de 960 px.
- **2º turno:** "Ainda dá virada?" (`outlook`), "Como a apuração evoluiu" (curva + ritmo + previsão de 100%, ADR 0011), "De onde vem a vantagem" (saldo líquido por estado) e "Do 1º para o 2º turno" (`swing` e estados que mudaram de líder). **1º turno:** só "De onde vem a vantagem".
- A seção é um **chunk carregado sob demanda** (`React.lazy`), fora do JS inicial (ADR 0005). A curva é um SVG próprio em caixa 0–100 com `vector-effect: non-scaling-stroke`, rótulos em HTML e nenhuma biblioteca de gráficos.
- Os snapshots do polling ficam numa história em memória do módulo (`live-history.ts`), somada ao histórico do servidor buscado uma vez por abrangência.
- Durante o 2º turno, o 1º turno também é carregado (uma vez, com 1 h de cache no CDN) para a comparação.

## Consequências

- Chunk da seção: ~5,5 KB de JS e ~2,2 KB de CSS (gzip). O JS inicial subiu ~1,5 KB, porque a divisão em chunks separou um módulo compartilhado.
- Cada visitante do 2º turno baixa o 1º turno uma vez (~10 KB comprimidos) e o histórico da abrangência aberta (poucos KB).
- O design no Claude Design precisa ser atualizado com essas telas para continuar sendo a fonte da verdade.
