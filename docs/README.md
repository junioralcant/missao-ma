# Manual de uso (PDF para o cliente)

Gera o `Missao-Maranhao-Manual-de-Uso.pdf` com prints reais das telas.

## Como regerar (quando a UI mudar)

```bash
# 1. sobe uma instância com banco de demonstração isolado
npm run build
DATABASE_PATH=/tmp/demo/app.db ADMIN_PASSWORD=demo123 \
  SESSION_SECRET=demo-secret PORT=3100 npm start

# 2. popule com dados fictícios pelo /admin (nunca use dados reais nos prints)

# 3. capture as telas e gere o PDF
cd docs
npm install playwright
node shoot.js   # salva em docs/shots/
node pdf.js     # gera o PDF ao lado
```

Usa o Chrome já instalado no sistema (`channel: 'chrome'`), sem baixar navegador.

## Arquivos

| Arquivo       | Papel                                         |
| ------------- | --------------------------------------------- |
| `manual.html` | conteúdo e layout do documento (impressão A4) |
| `shoot.js`    | navega no sistema e captura os prints         |
| `pdf.js`      | converte o HTML em PDF com rodapé e numeração |

## Regras

- **Nunca** capturar prints com cadastros reais — CPF é dado pessoal (LGPD). Use sempre um banco de demonstração com CPFs fictícios válidos.
- A senha do admin não entra no documento; é entregue ao cliente separadamente.
