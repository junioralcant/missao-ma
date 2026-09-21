# Missão Maranhão

Duas plataformas no mesmo app Next.js, com banco e área administrativa compartilhados:

| Plataforma             | Rota pública           | Admin        | O que faz                                                                                   |
| ---------------------- | ---------------------- | ------------ | ------------------------------------------------------------------------------------------- |
| **Grupos de WhatsApp** | `/`                    | `/admin`     | Direciona o usuário ao grupo de WhatsApp da sua cidade                                      |
| **Assinatura da PEC**  | `/pec` e `/pec/painel` | `/admin/pec` | Coleta assinaturas de iniciativa popular e mede os requisitos constitucionais em tempo real |

## Stack

- Next.js 14 (App Router) + TypeScript + React 18
- SQLite via módulo nativo `node:sqlite` do Node.js — zero dependência nativa (arquivo em `data/app.db`, criado automaticamente)
- Sem dependências de UI — CSS puro em `src/app/globals.css`

Requisito: Node.js 22.5 ou superior (o módulo `node:sqlite` é embutido no Node).

## Como rodar

```bash
npm install
npm run dev
```

- Grupos de WhatsApp: http://localhost:3000
- Assinatura da PEC: http://localhost:3000/pec
- Íntegra da proposta: http://localhost:3000/pec/minuta
- Painel público da coleta: http://localhost:3000/pec/painel
- Área administrativa: http://localhost:3000/admin e http://localhost:3000/admin/pec

A senha do admin fica em `.env.local` (`ADMIN_PASSWORD`). Troque antes de publicar.

## Funcionalidades

## Plataforma 1 — Grupos de WhatsApp

### Página pública (`/`)

- Formulário com nome completo, número do WhatsApp (com máscara e validação de DDD + nono dígito), e-mail e cidade de atuação.
- O select lista todos os 217 municípios do Maranhão. Se a cidade tem grupo próprio, o usuário vai para ele; senão, vai para o **grupo padrão** configurado no admin (o cadastro guarda a cidade real informada).
- Checkbox de consentimento (LGPD) obrigatório.
- Ao enviar, o cadastro é salvo e o usuário é redirecionado ao link do grupo. Um botão de fallback aparece caso o redirecionamento automático falhe.
- **O número do WhatsApp é único no sistema**: quem já se cadastrou e tenta de novo na mesma cidade só recebe o link novamente (nome e e-mail são atualizados, sem duplicar); em outra cidade, o cadastro é recusado ("Este número de WhatsApp já está cadastrado.").

### Área administrativa (`/admin`)

- Login por senha (`ADMIN_PASSWORD`), sessão via cookie assinado (HMAC com `SESSION_SECRET`).
- Cadastro de grupo: cidade (autocomplete com os 217 municípios oficiais do MA, lista do IBGE em `src/data/municipios-ma.json`) + link de convite (normalizado para `https://chat.whatsapp.com/<código>`; aceita colar o link com `?mode=...` que o WhatsApp gera).
- **Grupo padrão**: link usado quando a cidade escolhida ainda não tem grupo próprio (editável/removível no topo do painel).
- **Cobertura dos 217 municípios**: contador `X de 217` com quantos ainda faltam e barra de progresso, alimentado por `src/lib/coverage.ts`.
- A tabela lista **todos os 217 municípios** (não só os que já têm grupo), com busca por nome e filtros `Todos` / `Com grupo` / `Sem grupo`. Município sem grupo traz o botão **Cadastrar**, que já preenche a cidade no formulário e leva o cursor para o campo do link.
- Edição e remoção de links existentes.
- Tabela com todos os cadastros recebidos (nome, WhatsApp, e-mail, cidade, data) e exportação em CSV.

## Plataforma 2 — Assinatura da PEC

Coleta assinaturas para uma **proposta de emenda à Constituição do Estado do Maranhão de iniciativa popular**, conforme o ofício da Diretoria-Geral da Mesa da ALEMA (17/08/2026), que aplica o art. 41, inciso IV, da Constituição Estadual.

### Os quatro requisitos e como o sistema os mede

| Requisito do ofício                                                  | Como o sistema trata                                                                      |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Assinaturas de no mínimo **2% do eleitorado estadual**               | Meta global calculada do eleitorado cadastrado (hoje: **103.732** de 5.186.562 eleitores) |
| Subscrições distribuídas em pelo menos **18% dos municípios**        | Meta de cobertura: **40** dos 217 municípios                                              |
| Em cada município abrangido, no mínimo **0,3% dos eleitores locais** | Meta por município, de 11 (São Félix de Balsas) a 2.269 (São Luís)                        |
| Assinaturas firmadas **preferencialmente por meio eletrônico**       | Toda a coleta é eletrônica, com protocolo por assinante e trilha de auditoria             |

Um município só entra na conta dos 18% quando atinge a própria fração de 0,3%. O painel mostra dois totais: o **total geral** e o **total contido em municípios já qualificados**. A proposta é marcada como _apta a protocolo_ pelo critério mais rigoroso — assinaturas em municípios qualificados ≥ 2% do eleitorado **e** municípios qualificados ≥ 18% —, que é a leitura que resiste a impugnação. Protocolada, a ALEMA tem 60 dias para apreciar.

### Íntegra da proposta (`/pec/minuta`)

A minuta oficial (`PEC 14/2026` — Programa de Equilíbrio Fiscal Estrutural) fica disponível de duas formas:

- **Leitura na plataforma** — o texto é extraído do `.docx` e renderizado como página, sem exigir Word nem download.
- **Download do original** — o arquivo `.docx` é servido byte a byte idêntico ao recebido, em `public/minuta/`.

A página também exibe o **SHA-256 do arquivo**, que é o mesmo valor gravado em toda assinatura — dá para baixar o documento, calcular o hash e conferir que é exatamente o que foi assinado.

Para trocar a minuta:

```bash
node scripts/importar-minuta.js ~/Downloads/PEC\ 14-2026.docx
```

O script extrai o texto (descartando os cabeçalhos repetidos de página e reunindo parágrafos cortados por quebra de página), copia o `.docx` para `public/minuta/` e grava `src/data/minuta-pec.json` com o hash. Título e ementa da página pública passam a vir do próprio documento.

### Página de assinatura (`/pec`)

- Nome completo, CPF (mesma validação de dígitos verificadores), e-mail e município de votação.
- **Duas confirmações obrigatórias**: que leu a íntegra da proposta e a declaração de subscrição + consentimento LGPD. O botão só habilita com as duas marcadas, e o servidor recusa se faltar qualquer uma.
- Link para ler a proposta e para baixar o `.docx` logo acima das confirmações.
- **Um CPF, uma assinatura**: reenvio devolve o mesmo protocolo em vez de duplicar.
- **Um e-mail, uma assinatura**: e-mail já usado em assinatura confirmada é recusado (409).
- Cada assinatura recebe um **protocolo** (`PEC-XXXXXXXXXX`), derivado do CPF por HMAC — estável, conferível e sem expor o CPF.
- Trilha de auditoria: data/hora, user-agent e **hash HMAC do IP** (o IP em claro nunca é gravado).

### Confirmação por e-mail (double opt-in)

Enviar o formulário **não** assina nada. O fluxo é:

1. `POST /api/pec/sign` valida os dados, grava um **pedido pendente** em `signature_requests` e dispara um e-mail com o botão **Assinar PEC**.
2. O botão leva para `/pec/confirmar/<token>`, que mostra nome, município e e-mail para conferência.
3. `POST /api/pec/confirm` registra a assinatura na cadeia (`signatures`) e devolve o protocolo.

Detalhes que importam:

- **Só assinatura confirmada conta** — pendente não entra na cadeia, no painel público nem nas metas constitucionais.
- **Token de 32 bytes**, guardado apenas como SHA-256: quem tem acesso ao banco não consegue forjar o link. Vale **48 horas**.
- **Pendente pode ser sobrescrito**: refazer o cadastro com o mesmo e-mail (ou o mesmo CPF) substitui os dados e invalida o link anterior. Já **confirmado** bloqueia o e-mail de vez.
- **Repetir o mesmo cadastro em menos de 60s não reenvia** o e-mail; mudar qualquer dado gera um novo link.
- Se o Resend falhar, o pedido pendente é desfeito e a rota responde 502 — sem pendência órfã.
- Abrir o link duas vezes é inofensivo: a segunda vez devolve o mesmo protocolo.
- Sem `RESEND_API_KEY` no ambiente, nada é enviado e o link cai no console — é assim que o fluxo roda em desenvolvimento e nos testes.

### Como funciona a assinatura eletrônica

Juridicamente é uma **assinatura eletrônica simples** (Lei 14.063/2020, art. 4º, I): registra a manifestação de vontade e associa dados que identificam o signatário. O ofício pede coleta "preferencialmente por meio eletrônico" sem exigir nível.

Para que essa assinatura produza prova, cada registro guarda:

| Campo                      | Para que serve                                                            |
| -------------------------- | ------------------------------------------------------------------------- |
| `proposal_hash`            | SHA-256 do texto da minuta (título + ementa + link) que a pessoa endossou |
| `consent_text`             | o texto literal do consentimento aceito, não só um booleano               |
| `prev_hash` / `entry_hash` | encadeamento SHA-256 de todos os registros                                |

O encadeamento torna a coleta **à prova de adulteração**: cada assinatura carrega o hash da anterior, então alterar, remover, reordenar ou inserir qualquer registro quebra a cadeia dali em diante. O admin verifica isso em um clique e exibe o **hash final da coleta** — registre esse valor fora do sistema (ata, e-mail, protocolo) para que reescrever o passado se torne detectável.

Como o título, a ementa e o arquivo entram no hash, qualquer troca gera uma **nova versão**, e o admin mostra quantas assinaturas pertencem a cada versão. Ninguém "herda" assinaturas dadas a outro texto — nem trocando o `.docx`.

**O que isso não resolve:** nada prova que quem digitou é o dono do CPF. A confirmação por e-mail já cobre parte disso — prova a posse do canal e impede assinatura em massa com endereços inventados. O reforço seguinte seria login gov.br (assinatura eletrônica avançada, identidade verificada na origem, mas exige credenciamento OAuth de semanas).

### Painel público (`/pec/painel`)

Progresso dos três requisitos em cartões, e a tabela dos 217 municípios com eleitorado, meta de 0,3%, assinaturas e percentual, com busca e filtro por meta atingida.

### Admin da PEC (`/admin/pec`)

- Tabela de conformidade: exigido × atual × situação para cada requisito.
- **Integridade da coleta**: verificação da cadeia de hashes, hash final para registro externo e lista das versões da minuta com quantas assinaturas cada uma recebeu.
- **Proposta**: título, ementa e link da íntegra da minuta, exibidos na página pública (o teor da PEC não está no ofício, por isso é configurável).
- Lista de assinaturas com exportação CSV (inclui e-mail, hash da minuta e hash do registro, para conferência independente) e remoção individual. Remover uma assinatura também apaga o pedido correspondente, liberando o e-mail e o CPF para assinar de novo.
- **Aguardando confirmação**: pedidos pendentes com e-mail, município, data do pedido e prazo de expiração — separados do total oficial.

### ⚠️ Eleitorado: substituir os números provisórios

Todas as metas derivam do eleitorado por município. O `cdn.tse.jus.br` bloqueia acesso automatizado, então o seed atual é **parcialmente estimado** e está marcado como tal — o painel exibe um aviso vermelho enquanto a origem for `estimativa`.

O que é oficial no seed: o total estadual (**5.186.562**, TSE/TRE-MA, eleitores aptos às Eleições 2026), São Luís (756.232), Imperatriz (194.881) e Nova Iorque (4.142). Os demais 214 municípios são rateados pela população do Censo IBGE 2022 e ajustados para fechar no total oficial — o que é reprodutível por `node scripts/estimar-eleitorado.js`.

Para trocar pelo dado oficial:

```bash
# 1. baixe no navegador (o CDN do TSE bloqueia curl/wget)
#    https://cdn.tse.jus.br/estatistica/sead/odsele/perfil_eleitor_secao/perfil_eleitor_secao_2026_MA.zip

# 2. agregue por município
node scripts/import-eleitorado.js ~/Downloads/perfil_eleitor_secao_2026_MA.zip \
  "TSE — perfil do eleitorado por seção, MA, 2026"

# 3. publique — o deploy sincroniza o banco sozinho
git add src/data/eleitorado-ma.json && git commit -m "chore: eleitorado oficial do TSE" && git push
```

**O eleitorado não é editável pelo painel, e isso é intencional.** Esses números definem os limites legais da coleta, então ficam versionados no git — com histórico, autoria e revisão — em vez de editáveis por formulário por quem tiver a senha do admin.

A sincronização é automática: o app guarda no banco a assinatura SHA-256 do `eleitorado-ma.json` e, quando o arquivo muda, atualiza os 217 municípios e a referência da fonte no próximo boot. Como o Railway faz deploy automático do `main`, atualizar o eleitorado é rodar o script e dar `git push`.

## Estrutura

```
src/
├── app/
│   ├── page.tsx                       # página pública
│   ├── components/RegistrationForm.tsx
│   ├── admin/
│   │   ├── page.tsx                   # painel (protegido)
│   │   ├── login/page.tsx
│   │   └── components/                # GroupsManager, RegistrationsTable, LogoutButton
│   └── api/
│       ├── register/                  # POST cadastro público
│       └── admin/                     # login, logout, groups (CRUD), registrations (+CSV)
│       ├── pec/                       # sign (POST), confirm (POST), progress (GET)
│       └── admin/pec/                 # signatures (+CSV), proposal, integrity
├── app/pec/                           # página de assinatura, confirmação e painel público
├── app/admin/pec/                     # admin da PEC
├── data/municipios-ma.json            # 217 municípios do MA (IBGE)
├── data/eleitorado-ma.json            # eleitorado por município (sincronizado no boot)
├── data/minuta-pec.json               # texto e hash da minuta (gerado pelo importador)
└── lib/                               # db, repository, phone, email, cpf, session,
                                       # validation, types, coverage (grupos por município),
                                       # pec (metas), electorate (import), signature,
                                       # proposal, consent, document, integrity,
                                       # mailer (Resend), signatureEmail, signatureToken,
                                       # signatureRequest (prazo e reenvio)
```

Scripts:

| Script                          | Papel                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------- |
| `scripts/estimar-eleitorado.js` | Regenera o seed provisório a partir do IBGE + âncoras oficiais                  |
| `scripts/import-eleitorado.js`  | Agrega o arquivo oficial do TSE por município e gera o JSON + CSV de importação |

## Testes

```bash
npm test
```

Suíte Jest (preset `next/jest`), sem mocks de código próprio:

- `src/lib/__tests__/` — unitários de `phone` (máscara + DDD e nono dígito), `email` (formato do endereço), `cpf` (máscara + dígitos verificadores, usado na PEC), `validation` (municípios do MA + formato do link), `session` (assinatura HMAC do cookie), `coverage` (cobertura dos 217 municípios: contagem, faltantes e casamento de cidade sem acento) e `repository` (CRUD real contra SQLite em memória, via `DATABASE_PATH=':memory:'` no `jest.setup.js`)
- `src/app/api/register/__tests__/` — a rota pública inteira com `Request` real e banco em memória (cadastro, dedup, validações e body malformado)
- `src/lib/__tests__/pec.test.ts` — as três metas (2%, 18%, 0,3%), qualificação por município e a distinção entre meta atingida e proposta apta a protocolo
- `src/lib/__tests__/signature.test.ts` — protocolo determinístico sem expor CPF e hash do IP
- `src/lib/__tests__/integrity.test.ts` — detecção de adulteração (inclusive troca do arquivo da minuta e da declaração de leitura), remoção, reordenação e inserção forjada na cadeia
- `src/app/api/pec/sign/__tests__/` — a rota de pedido com banco real (pendência criada sem entrar na cadeia, dedup por CPF e por e-mail, sobrescrita do pendente, envio do e-mail, rollback quando o envio falha)
- `src/app/api/pec/confirm/__tests__/` — a rota de confirmação (registro na cadeia, idempotência, token inválido/expirado, corrida entre CPF e e-mail)
- `src/lib/__tests__/mailer.test.ts` e `signatureEmail.test.ts` — envio pelo Resend (payload, chave ausente, erro) e montagem do link de confirmação
- `src/lib/__tests__/signatureToken.test.ts` e `signatureRequest.test.ts` — token irreversível, prazo de 48h e regra de reenvio
- `src/lib/__tests__/dbMigration.test.ts` — bancos antigos: cadastros com CPF, e-mails repetidos e assinaturas sem a coluna `email` (a cadeia continua válida após a migração)

## Variáveis de ambiente

| Variável         | Descrição                                                                            |
| ---------------- | ------------------------------------------------------------------------------------ |
| `ADMIN_PASSWORD` | Senha da área administrativa (obrigatória)                                           |
| `SESSION_SECRET` | Segredo para assinar o cookie de sessão (obrigatória em produção)                    |
| `DATABASE_PATH`  | Caminho do arquivo SQLite (opcional; padrão `data/app.db`)                           |
| `RESEND_API_KEY` | Chave do Resend para o e-mail de confirmação (sem ela, o link só aparece no console) |
| `EMAIL_FROM`     | Remetente das mensagens (padrão `Missão Maranhão <pec@missaoma.com.br>`)             |
| `EMAIL_REPLY_TO` | Endereço de resposta (opcional)                                                      |
| `APP_URL`        | Base do link de confirmação enviado por e-mail (padrão `http://localhost:3000`)      |

## Deploy

Em produção: **https://www.missaoma.com.br** (Railway, `web-production-9572a.up.railway.app`)

O banco é um arquivo SQLite, então o serviço precisa de **disco persistente** e **uma única réplica** (Vercel e outras plataformas serverless não servem sem trocar para Postgres).

Configuração do serviço no Railway:

| Item            | Valor                                                          |
| --------------- | -------------------------------------------------------------- |
| Volume          | montado em `/data`                                             |
| `DATABASE_PATH` | `/data/app.db`                                                 |
| Réplicas        | 1 (SQLite é arquivo local)                                     |
| Node            | 22.5+ (via `engines`, por causa do `node:sqlite`)              |
| Build / start   | `npm run build` / `npm start` (o `next start` respeita `PORT`) |

Deploys a partir do `main` são automáticos (repo conectado). O primeiro acesso ao banco cria o arquivo e as tabelas no volume.

### Domínio e DNS

O endereço canônico é **`www.missaoma.com.br`** — é o que está impresso no manual de uso. O apex (`missaoma.com.br`, sem www) não serve o site: redireciona 308 para o www, regra que vive no `next.config.mjs` e roda no próprio app.

Os dois hosts são custom domains do serviço `web` no Railway, e **cada um recebe um alvo próprio**:

| Host                  | Registro | Valor                                                                             |
| --------------------- | -------- | --------------------------------------------------------------------------------- |
| `www.missaoma.com.br` | CNAME    | `k2ozjlus.up.railway.app.`                                                        |
| `missaoma.com.br`     | A        | IP de `zbnfldar.up.railway.app` (`69.46.46.80`)                                   |
| `_railway-verify`     | TXT      | `railway-verify=6a7fa9e765d7f7ecce4fb56f6464c59ac8b578e72339f7dbbe47b86ef81f5e1f` |

O apex usa **A** porque CNAME na raiz da zona é proibido pela RFC 1034 e o DNS da HostGator (dns3/dns4.hostgator.com.br) não faz CNAME flattening. O Railway **não promete IP estático**, então esse A é uma aposta consciente: mantenha o **TTL em 300s** para conseguir corrigir rápido se o IP mudar. O TXT `_railway-verify` é o que prova a propriedade e libera o certificado — sem ele o apex não ganha TLS.

Para reconferir o IP atual do apex a qualquer momento:

```bash
dig +short zbnfldar.up.railway.app A   # alvo que o A do apex deve seguir
dig +short missaoma.com.br A           # o que o apex realmente aponta
```

Se os dois divergirem, o apex está quebrado — sintoma: `curl https://missaoma.com.br/` dá timeout enquanto o www responde 200. Migrar o DNS para um provedor com CNAME flattening (Cloudflare) elimina essa classe de problema.

### E-mail (Resend)

Os e-mails da PEC (confirmação de assinatura) saem pelo [Resend](https://resend.com), com o domínio `missaoma.com.br` verificado na região `sa-east-1` e remetente `Missão Maranhão <pec@missaoma.com.br>`.

Registros que a zona precisa ter — no Zone Editor da HostGator o cPanel completa o nome com o domínio sozinho:

| Nome                | Tipo  | Valor                                   | Para que serve                   |
| ------------------- | ----- | --------------------------------------- | -------------------------------- |
| `resend._domainkey` | TXT   | chave DKIM (abaixo)                     | assina as mensagens              |
| `send`              | MX    | `feedback-smtp.sa-east-1.amazonses.com` | prioridade 10; recebe os bounces |
| `send`              | TXT   | `v=spf1 include:amazonses.com ~all`     | SPF do subdomínio de envio       |
| `rsend`             | CNAME | `send.forge.rmta.net`                   | MTA do Resend                    |

Valor do DKIM (chave pública, pode ficar versionada):

```
p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDP8KUPFhfz1jzXdLRrrJg6rNRony6bK3tWDAweWDfKhIUidJKLFmHoNJ0fsw+kf1xgkpPYcylbUP4jMfA/NUGWHrdzKBMk00b9KIc1HzFJCkF/hnnuWnX0Y2tiUqtJ0Np5MOoKJxzrAQxHRu/wDXv6kvA46eZgevVpYHU5tVDUbQIDAQAB
```

O SPF fica em `send.missaoma.com.br`, **não na raiz** — por isso não conflita com o e-mail da hospedagem, que continua respondendo pelo MX do apex (`0 missaoma.com.br`). Vale publicar também um DMARC em `_dmarc` (TXT `v=DMARC1; p=none; rua=mailto:<seu e-mail>`): o domínio hoje não tem nenhum, e sem ele não há relatório de quem está usando o remetente.

Para conferir o estado da verificação:

```bash
curl -s -H "Authorization: Bearer $RESEND_API_KEY" https://api.resend.com/domains
dig +short resend._domainkey.missaoma.com.br TXT
```

A chave de API usada aqui é exclusiva deste projeto (`Missao Maranhao`, permissão só de envio, escopo no domínio) — revogar a chave de outro projeto na mesma conta não derruba o envio da PEC.

O plano free do Resend entrega 3.000 e-mails/mês e **100 por dia**, o que serve para desenvolver mas não para a campanha: a meta de 2% do eleitorado são 103.732 assinaturas, uma confirmação por assinante.

### Cuidados

- **Backup**: o volume guarda dados pessoais (WhatsApp e e-mail nos grupos, CPF na PEC). Configure backup do volume no Railway ou exporte o CSV periodicamente.
- **Não versionar** `data/` nem `.env.local` — já cobertos pelo `.gitignore`.
- **Migração dos cadastros antigos**: no primeiro boot após a troca de CPF por WhatsApp + e-mail, a tabela `registrations` antiga é renomeada para `registrations_legacy_cpf` e os cadastros são copiados para a tabela nova com WhatsApp e e-mail em branco — eles continuam aparecendo no painel e no CSV. Nada é apagado: a tabela arquivada guarda os dados originais, inclusive o CPF. Se quiser descartar os CPFs por minimização (LGPD), basta `DROP TABLE registrations_legacy_cpf` depois de conferir a migração.
- O eleitorado é sincronizado do `src/data/eleitorado-ma.json` a cada boot em que o arquivo mudar; ajustes manuais na tabela `municipality_electorate` são sobrescritos no próximo deploy.
- Um `next build` **não** deve abrir o banco: a conexão é lazy (`getDb()`) justamente porque o build importa as rotas em processos paralelos e o SQLite trava com escrita concorrente.

## LGPD

O sistema coleta dados pessoais: nome, WhatsApp, e-mail e cidade de atuação nos grupos; nome, CPF, e-mail e município na PEC. Mantenha finalidade clara, colete só o necessário e proteja o acesso ao banco e à área administrativa. Os dois formulários incluem consentimento explícito e aviso de finalidade.

Na assinatura da PEC, o IP é gravado apenas como hash HMAC (nunca em claro), o protocolo é derivado do CPF sem revelá-lo, o token do link de confirmação só existe em hash no banco e o consentimento aceito fica registrado literalmente em cada assinatura. O e-mail serve para confirmar a assinatura e falar com quem assinou sobre a proposta. A finalidade declarada é instruir o protocolo da proposta na Assembleia Legislativa — não reutilize a base para outro fim.

## Limitação conhecida da coleta

A coleta registra nome, CPF e município, sem título de eleitor. Isso maximiza a conversão, mas a ALEMA não consegue cruzar cada assinante com a base do TSE só por esses campos, o que abre espaço para impugnação. A tabela `signatures` já tem a coluna `voter_id` (nula) preparada: adicionar o campo depois é mudar o formulário e a rota, sem migrar dados.
