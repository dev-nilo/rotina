# Rotina para iPhone

> **Pausado.** O PWA voltou a ser o app principal; veja o README da raiz.

App nativo em SwiftUI (iOS 17+). Não precisa de Mac nem de conta paga da Apple:

- o **GitHub Actions** gera o projeto com o [XcodeGen](https://github.com/yonaskolb/XcodeGen)
  a partir de `project.yml`, compila sem assinatura e publica o `Rotina.ipa` na release
  [`ios-latest`](https://github.com/dev-nilo/rotina/releases/tag/ios-latest) a cada push em `ios/`;
- o **SideStore** assina o `.ipa` no próprio iPhone com um Apple ID gratuito e renova a
  assinatura a cada 7 dias.

O `.xcodeproj` não é versionado: edite `project.yml`.

## Instalar no iPhone (uma vez)

O SideStore precisa de um computador só na instalação inicial (o Windows serve).
Siga o guia oficial em <https://docs.sidestore.io>. Ele cobre:

1. instalar o SideStore no iPhone com o instalador do computador e o seu Apple ID;
2. ativar o **Modo Desenvolvedor** (Ajustes → Privacidade e Segurança);
3. importar o arquivo de pareamento e ativar a VPN local que o SideStore usa para
   assinar apps sem o computador.

## Instalar e atualizar o Rotina

1. No iPhone, abra a release [`ios-latest`](https://github.com/dev-nilo/rotina/releases/tag/ios-latest)
   no Safari e baixe o `Rotina.ipa`.
2. No SideStore: **My Apps → +** → escolha o `Rotina.ipa` em Arquivos.
3. Para atualizar, repita com o `.ipa` novo. Os dados do app são mantidos.

Abra o SideStore pelo menos uma vez por semana para ele renovar a assinatura
(a conta gratuita expira apps em 7 dias).
