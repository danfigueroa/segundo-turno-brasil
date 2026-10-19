# 0023 — Vídeo para os Stories gerado no cliente

- Status: aceita; geração do vídeo substituída pela ADR 0029
- Data: 2026-10-12

## Contexto

Nos Stories, vídeo chama mais atenção que imagem parada. A imagem já é gerada no cliente com Canvas 2D (ADR 0004).

## Decisão

- `drawShareImage(canvas, content, format, progress)` desenha um quadro da introdução: percentuais, votos e % apurado sobem do zero (`contentAt`, easing cúbico) e as cores do mapa e as contagens de liderança aparecem aos poucos.
- `recordShareVideo` grava esse canvas fora da página com `captureStream(30)` e `MediaRecorder`: 2,5 s de introdução e 3,5 s no quadro final, a 6 Mbit/s. Prefere MP4 (H.264), que Instagram e WhatsApp aceitam em todo lugar, e usa WebM onde não houver MP4.
- No diálogo, "Gerar vídeo animado" grava sob demanda. Depois, "Compartilhar vídeo" exige um segundo toque, porque o Safari só abre a folha de compartilhamento logo após um toque. "Baixar vídeo" fica sempre disponível.
- Sem `MediaRecorder` ou `captureStream`, o botão não aparece.

## Consequências

- Nenhum custo de servidor ou banda. O módulo vai no chunk do diálogo, carregado só ao compartilhar.
- A gravação roda em tempo real (~6 s) e pausa se a aba ficar oculta.
- No Android sem MP4, o WebM pode não ser aceito pelo Instagram. Nesse caso, sobra baixar o arquivo.
