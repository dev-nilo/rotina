# Rotina

Web app (PWA) que mostra o que fazer agora, segundo uma rotina produtiva e sustentável
baseada em cronobiologia, *O Milagre da Manhã*, *O Poder do Hábito*, *Behave*, *Sapiens*
e *A Sociedade do Cansaço*.

- **Hoje**: o bloco de agora, com um check para o bloco inteiro e os passos só para ler.
  A prioridade do dia aparece no Deep Work e é definida na véspera, às 16:15.
  Num dia caótico, um link troca a agenda pelas 3 Âncoras.
- **cat-modoro**: timer de foco (90/15) no Deep Work e nos Estudos.
- **Duas semanas alternadas** (`WEEKS` em `js/routine.js`): uma com presencial na terça e na quinta, a outra na segunda,
  quarta e sexta. Dia presencial tem bike de 15 km na ida e na volta e treino ao meio-dia; em casa, treino às 16:30.
  O treino de cada dia da semana é o mesmo nas duas (perna sempre na quarta). English Club seg, ter e qui às 19h; Futsal ter às 21h.
  Em Ajustes dá para inverter a semana atual. Feriados nacionais em dia útil seguem a rotina de sábado; dá para marcar ou desmarcar à mão.
- **Ajustes**: horário de acordar (desloca a semana inteira), avisos e a chave do assistente.

Os dados ficam no aparelho (localStorage). Com os avisos ligados, os horários dos próximos
7 dias também vão para o Worker de push (veja abaixo).

## Avisos
Um web app no iPhone não agenda notificações locais. Por isso `worker/` é um Cloudflare Worker
(plano gratuito) que recebe os horários do app e, a cada minuto, dispara por Web Push os avisos
que venceram. Funciona com o app instalado na Tela de Início, no iOS 16.4 ou mais novo.

```
cd worker
npx wrangler deploy                               # publica
npx wrangler secret put VAPID_PRIVATE_JWK < chave  # chave privada VAPID (fora do repositório)
```

A chave pública VAPID está em `worker/wrangler.toml` e em `js/push.js`; se trocar uma, troque as duas.

## Instalar no iPhone
Abra o site no Safari → Compartilhar → **Adicionar à Tela de Início**.

## Rodar localmente
```
python -m http.server 8765
```

`ios/` é um app nativo em SwiftUI, pausado: instalar no iPhone exige configurar o aparelho
(SideStore, Modo Desenvolvedor). Veja [ios/README.md](ios/README.md).
