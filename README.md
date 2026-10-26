# Rotina

Web app (PWA) que mostra o que fazer agora, segundo uma rotina produtiva e sustentável
baseada em cronobiologia, *O Milagre da Manhã*, *O Poder do Hábito*, *Behave*, *Sapiens*
e *A Sociedade do Cansaço*.

- **Hoje**: escolha entre dia estruturado (agenda completa) ou caótico (3 Âncoras).
- **cat-modoro**: timer de foco do Deep Work (90/15 ou 25/5).
- **Ajustes**: horário de acordar, ciclos de Deep Work, almoço, desligamento, treino e
  exportação da rotina para o Calendário (.ics).

Os dados ficam só no aparelho (localStorage).

## Instalar no iPhone
Abra o site no Safari → Compartilhar → **Adicionar à Tela de Início**.

## Rodar localmente
```
python -m http.server 8765
```

`ios/` é o app nativo em SwiftUI, que vai substituir o PWA. Veja [ios/README.md](ios/README.md).
