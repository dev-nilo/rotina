# Rotina

Web app (PWA) que mostra o que fazer agora, segundo uma rotina produtiva e sustentável
baseada em cronobiologia, *O Milagre da Manhã*, *O Poder do Hábito*, *Behave*, *Sapiens*
e *A Sociedade do Cansaço*.

- **Hoje**: escolha entre dia estruturado (agenda completa) ou caótico (3 Âncoras).
- **cat-modoro**: timer de foco do Deep Work (90/15 ou 25/5).
- **Ajustes**: horário de acordar, ciclos de Deep Work, almoço, desligamento, treino e
  avisos e exportação da rotina para o Calendário (.ics).

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
