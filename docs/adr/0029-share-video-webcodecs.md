# 0029 — Vídeo de compartilhamento com WebCodecs

- Status: aceita
- Data: 2026-10-19
- Substitui em parte: ADR 0023 (a forma de gerar o vídeo)

## Contexto

O vídeo dos Stories (ADR 0023) era gravado em tempo real com `captureStream` + `MediaRecorder`. No Safari funcionava, mas no Chrome do Android "Gerar vídeo animado" falhava ou ficava travado em "Gravando vídeo…":

- O `MediaRecorder` do Chrome no Android para no meio, ou não grava nada, com canvas grandes (a partir de ~720p; o nosso tem 1080×1920), e não dispara erro (bug 897727 do Chromium).
- `isTypeSupported()` no Android pode dizer que aceita H.264 e depois falhar com `EncodingError` no `start()`.
- O primeiro formato pedido, `avc1.42E01E`, é H.264 Baseline nível 3.0, que vai só até ~720×576.
- O MP4 do `MediaRecorder` do Chrome sai fragmentado. Onde não há MP4, sai WebM, que o Instagram não aceita.
- O código não conferia o resultado: um arquivo vazio virava "Compartilhar vídeo", e sem `onstop` o botão ficava desabilitado para sempre.

## Decisão

- **WebCodecs primeiro** (`encode-share-video.ts`): o vídeo é codificado quadro a quadro, sem tempo real, com o **Mediabunny** (`CanvasSource` → `VideoEncoder`). Sai um MP4 H.264 comum, com o índice no início (`fastStart: 'in-memory'`), a 30 fps, 6 Mbit/s e um quadro-chave por segundo. O Mediabunny escolhe o perfil e o nível de H.264 que cabem em 1080×1920.
- Antes de codificar, `canEncodeVideo('avc', …)` confere se o navegador codifica H.264 nesse tamanho. Os quadros da introdução são desenhados um a um; o resultado final é desenhado uma vez e repetido.
- **`MediaRecorder` como reserva** (`share-video.ts`), para navegadores sem WebCodecs: pede H.264 High 4.0 (`avc1.640028`), rejeita gravação vazia, erro ao criar ou iniciar o gravador, e desiste se a gravação não terminar 5 s depois do previsto.
- O botão aparece quando há `VideoEncoder` ou um formato de `MediaRecorder` (`canMakeVideo`). Se as duas formas falharem, o botão vira "Tentar gerar o vídeo de novo".

## Consequências

- O Mediabunny fica num chunk próprio (~50 KB gzip), baixado só ao tocar em "Gerar vídeo animado". O JS inicial e o chunk do diálogo não mudam.
- O vídeo não perde quadros em celulares mais lentos, continua com a aba oculta e costuma ficar pronto em menos que os 6 s da gravação em tempo real.
- O Safari (16.4+) também passa a usar WebCodecs; o comportamento visível é o mesmo.
- Validar no Preview: vídeo gerado, aceito nos Stories e no WhatsApp, no iPhone e no Android.
