# Manuais de uso (PDF para o cliente)

Dois documentos, gerados com prints reais das telas:

| PDF                                   | Assunto                                   |
| ------------------------------------- | ----------------------------------------- |
| `Missao-Maranhao-Manual-de-Uso.pdf`    | Grupos de WhatsApp por cidade             |
| `Missao-Maranhao-Manual-PEC.pdf`       | Assinatura popular da PEC 14/2026         |

## Como regerar (quando a UI mudar)

```bash
# 1. dependências dos geradores (uma vez)
cd docs && npm install

# 2. sobe uma instância com banco de demonstração isolado
DATABASE_PATH=/tmp/demo-pec/app.db ADMIN_PASSWORD=demo123 \
  SESSION_SECRET=demo-secret npx next dev -p 3100

# 3a. manual dos grupos: popule os grupos pelo /admin e capture
node shoot.js && node pdf.js

# 3b. manual da PEC: semeia assinaturas fictícias, captura e gera
node seed-pec-demo.js
node shoot-pec.js
node pdf-pec.js
```

Usa o Chrome já instalado no sistema (`channel: 'chrome'`), sem baixar navegador.

## Arquivos

| Arquivo             | Papel                                                  |
| ------------------- | ------------------------------------------------------ |
| `manual.html`       | conteúdo e layout do manual dos grupos (impressão A4)  |
| `shoot.js`          | captura as telas dos grupos                            |
| `pdf.js`            | converte `manual.html` em PDF                          |
| `manual-pec.html`   | conteúdo e layout do manual da PEC (impressão A4)      |
| `seed-pec-demo.js`  | cria 42 assinaturas fictícias no banco de demonstração |
| `shoot-pec.js`      | captura as telas da PEC (público, painel e admin)      |
| `pdf-pec.js`        | converte `manual-pec.html` em PDF                      |

## Regras

- **Nunca** capturar prints com cadastros reais — WhatsApp, e-mail e CPF são dados pessoais
  (LGPD). Use sempre um banco de demonstração (`DATABASE_PATH` apontando para fora do
  repositório) com dados fictícios válidos, como faz o `seed-pec-demo.js`.
- **Recrie o banco de demonstração antes de capturar** (`rm -rf /tmp/demo-pec`). Rodar
  `shoot-pec.js` duas vezes sobre o mesmo banco faz a tela de sucesso virar "você já havia
  assinado", que não é o fluxo que o manual ilustra.
- A senha do admin não entra nos documentos; é entregue ao cliente separadamente.

## Paginação

Cada `<div class="page">` vira uma página A4 (269mm úteis). Se um bloco passar disso, ele
transborda e cria uma página órfã. Ao editar o conteúdo, conferir a altura de cada bloco
antes de gerar o PDF.
