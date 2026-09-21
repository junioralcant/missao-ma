# Plano — confirmação da assinatura da PEC por e-mail (double opt-in com Resend)

## Status

**Implementado em 21/09/2026** — fases 0 a 5 concluídas, 213 testes passando, `tsc --noEmit` limpo e
fluxo validado ponta a ponta no servidor de desenvolvimento (pedido → link no console → tela de
confirmação → protocolo → progresso). Falta apenas a verificação do DNS do `missaoma.com.br` no
Resend para o envio real funcionar.

## Objetivo

A pessoa preenche o formulário em `/pec`, recebe um e-mail e só vira assinante depois de clicar em
**Assinar PEC** na mensagem. E-mail já usado em uma assinatura confirmada não pode assinar de novo;
e-mail com cadastro apenas pendente pode refazer o cadastro, sobrescrevendo os dados anteriores.

## Decisão central de arquitetura

A assinatura só entra na tabela `signatures` — a cadeia encadeada que vale juridicamente — **quando o
e-mail é confirmado**. O cadastro não confirmado vive em `signature_requests` com `status = 'pending'`.
Assim a cadeia (`verifySignatureChain`), o painel público e as metas constitucionais continuam
contando apenas assinatura real.

A fórmula de `buildEntryHash` **não muda**: e-mail fica fora do encadeamento, senão toda cadeia já
gravada passa a ser inválida. O e-mail vira coluna de `signatures` com índice único — prova de
vínculo e trava de unicidade, sem entrar no hash.

## Situação em 21/09/2026

**Implementação concluída e suite verde** — 213 testes em 20 suítes, `tsc --noEmit` limpo.

| Fase | Situação | Onde ficou |
| --- | --- | --- |
| 0 — infra de e-mail | entregue | `src/lib/mailer.ts`, `src/lib/signatureEmail.ts`, `jest.setup.js` zera a chave nos testes |
| 1 — dados e migração | entregue | coluna `email` + índice único em `signatures`, tabela `signature_requests`, `src/lib/signatureToken.ts`, `src/lib/signatureRequest.ts` |
| 2 — `POST /api/pec/sign` | entregue | cria pendência, envia e-mail, cooldown via `shouldResendConfirmation` |
| 3 — confirmação | entregue | `src/app/api/pec/confirm/`, `src/app/pec/confirmar/[token]/`, `ConfirmSignatureCard` |
| 4 — formulário público | entregue | campo de e-mail no `SignatureForm`, `SignatureReceipt` |
| 5 — admin e docs | entregue | `PendingSignaturesTable`, remoção em cascata do pedido, seções no README |

### Conta do Resend

- Domínio `missaoma.com.br` **verificado** na região `sa-east-1`; os quatro registros estão na zona da
  HostGator (tabela no README, seção "E-mail (Resend)").
- API key própria `Missao Maranhao`, só de envio, com escopo nesse domínio. A conta é compartilhada
  com o projeto `corrida-trilha`, mas as chaves são separadas.
- Remetente `Missão Maranhão <pec@missaoma.com.br>`.

### Pendências antes de publicar

1. **Variáveis no Railway**: `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` e, principalmente,
   `APP_URL=https://www.missaoma.com.br`. Sem o `APP_URL` correto o link do e-mail aponta para
   `localhost` e a confirmação não funciona para ninguém.
2. **Plano pago**: free entrega 3.000 e-mails/mês e 100/dia; a meta são 103.732 confirmações.
3. **`EMAIL_REPLY_TO`** ainda é um gmail pessoal — trocar por uma caixa do próprio domínio.
4. **DMARC**: a zona não tem `_dmarc`. Publicar ao menos `v=DMARC1; p=none; rua=mailto:<e-mail>`.

## Decisões assumidas

- **Expiração do link: 48h.** Depois disso o pendente pode ser recriado normalmente.
- **Pendente não conta** no painel público nem nas metas constitucionais.
- **CPF continua sendo a chave legal**: CPF já confirmado devolve o protocolo existente, mesmo com
  outro e-mail. O e-mail é a segunda trava.
- **E-mail fora do `entry_hash`**, para não invalidar a cadeia já gravada.

## Validação

`npm test` + `npx tsc --noEmit` + dev server. O `npm run build` não termina nesta máquina.
