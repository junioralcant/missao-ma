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
#    RESEND_API_KEY vazia é obrigatório: sem isso a captura dispara e-mail
#    de verdade para os endereços fictícios e queima a reputação do domínio
rm -rf /tmp/demo-pec
DATABASE_PATH=/tmp/demo-pec/app.db ADMIN_PASSWORD=demo123 \
  SESSION_SECRET=demo-secret RESEND_API_KEY= npx next dev -p 3100

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
| `seed-pec-demo.js`  | cria 42 assinaturas fictícias **já confirmadas** no banco de demonstração |
| `shoot-pec.js`      | captura as telas da PEC (público, painel e admin)      |
| `pdf-pec.js`        | converte `manual-pec.html` em PDF                      |

## Regras

- **Nunca** capturar prints com cadastros reais — WhatsApp, e-mail e CPF são dados pessoais
  (LGPD). Use sempre um banco de demonstração (`DATABASE_PATH` apontando para fora do
  repositório) com dados fictícios válidos, como faz o `seed-pec-demo.js`.
- **Recrie o banco de demonstração antes de capturar** (`rm -rf /tmp/demo-pec`). Rodar
  `shoot-pec.js` duas vezes sobre o mesmo banco faz a tela de sucesso virar "você já havia
  assinado", que não é o fluxo que o manual ilustra.
- **Confira que o envio foi suprimido** depois da primeira captura:
  `grep -c "RESEND_API_KEY não configurada" <log da instância>` precisa ser maior que zero.
  Se for zero, a chave vazou do `.env.local` e e-mails reais saíram.
- O fluxo de confirmação exige o token, que só existe no e-mail. Tanto o seed quanto o
  `shoot-pec.js` contornam isso gravando um token conhecido direto na tabela
  `signature_requests` — é o único ponto em que os geradores tocam o banco.
- A senha do admin não entra nos documentos; é entregue ao cliente separadamente.

## Paginação

Cada `<div class="page">` vira uma página A4 (269mm úteis). Se um bloco passar disso, ele
transborda e cria uma página órfã. Ao editar o conteúdo, conferir a altura de cada bloco
antes de gerar o PDF.

A conferência precisa ser feita na **largura real de impressão** (A4 menos as margens de
16mm = 672px a 96dpi). Medir em viewport largo subestima a altura e deixa passar bloco que
estoura:

```bash
node -e "
const path=require('path');
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({channel:'chrome'});
  const p=await b.newPage({viewport:{width:672,height:1016}});
  await p.goto('file://'+path.join(process.cwd(),'manual-pec.html'),{waitUntil:'networkidle'});
  await p.emulateMedia({media:'print'});
  await p.waitForTimeout(1500);
  const r=await p.evaluate(()=>[...document.querySelectorAll('.page')]
    .map((el,i)=>({n:i+1,mm:Math.round(el.getBoundingClientRect().height/3.7795)})));
  r.filter(x=>x.mm>269).forEach(x=>console.log('ESTOURA',x.n,x.mm+'mm'));
  await b.close();
})();"
```

Confirmação final: o PDF precisa ter exatamente **capa + número de blocos `.page`**. Se tiver
uma página a mais, algum bloco quebrou.
