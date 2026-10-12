# 0020 — ETag e 304 nas respostas da API

- Status: aceita
- Data: 2026-10-12

## Contexto

O front consulta `/api/results` a cada 20s, e `/api/cities` e `/api/abroad` a cada minuto. Na maior parte dessas consultas os dados não mudaram: o TSE publica em lotes, e o 1º turno é final. Mesmo assim, cada consulta baixava o JSON inteiro, e a banda de 100 GB/mês é o maior risco do plano Hobby.

## Decisão

- Toda resposta 200 das funções sai com um **ETag fraco** (`W/"…"`, os 16 primeiros caracteres do SHA-1 do JSON em base64url), gerado em `http/json-response.ts`.
- O hash **ignora `fetchedAt`**: uma atualização que trouxe os mesmos dados mantém o mesmo ETag.
- Quando o `If-None-Match` traz esse ETag (comparação fraca, lista ou `*`), a resposta é **`304` sem corpo**, com o mesmo `cache-control`.
- No front não muda nada: o navegador guarda a resposta (tem ETag), manda o `If-None-Match` sozinho e entrega ao `fetch` o corpo guardado.

## Consequências

- Polling sem novidade custa só cabeçalhos. O CDN guarda o ETag e responde às revalidações sem chamar a função.
- Num 304, o `fetchedAt` visto pelo cliente é o da primeira resposta com aqueles dados. Ele só aparece no aviso de dados antigos, onde esse horário é o certo.
- O hash custa um `JSON.stringify` a mais por resposta, desprezível perto do fetch ao TSE.
