# Grupos de WhatsApp — Maranhão

Sistema web que direciona o usuário para o grupo de WhatsApp da sua cidade (municípios do Maranhão). O usuário informa **nome + CPF**, escolhe a cidade e é redirecionado ao grupo. Os dados (nome, CPF e cidade) ficam armazenados.

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

- Página pública: http://localhost:3000
- Área administrativa: http://localhost:3000/admin

A senha do admin fica em `.env.local` (`ADMIN_PASSWORD`). Troque antes de publicar.

## Funcionalidades

### Página pública (`/`)

- Formulário com nome completo, CPF (com máscara e validação de dígitos verificadores) e cidade.
- O select lista todos os 217 municípios do Maranhão. Se a cidade tem grupo próprio, o usuário vai para ele; senão, vai para o **grupo padrão** configurado no admin (o cadastro guarda a cidade real informada).
- Checkbox de consentimento (LGPD) obrigatório.
- Ao enviar, o cadastro é salvo e o usuário é redirecionado ao link do grupo. Um botão de fallback aparece caso o redirecionamento automático falhe.
- **CPF é único no sistema**: quem já se cadastrou e tenta de novo na mesma cidade só recebe o link novamente (sem duplicar); em outra cidade, o cadastro é recusado ("Este CPF já está cadastrado.").

### Área administrativa (`/admin`)

- Login por senha (`ADMIN_PASSWORD`), sessão via cookie assinado (HMAC com `SESSION_SECRET`).
- Cadastro de grupo: cidade (autocomplete com os 217 municípios oficiais do MA, lista do IBGE em `src/data/municipios-ma.json`) + link de convite (normalizado para `https://chat.whatsapp.com/<código>`; aceita colar o link com `?mode=...` que o WhatsApp gera).
- **Grupo padrão**: link usado quando a cidade escolhida ainda não tem grupo próprio (editável/removível no topo do painel).
- Edição e remoção de links existentes.
- Tabela com todos os cadastros recebidos (nome, CPF, cidade, data) e exportação em CSV.

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
├── data/municipios-ma.json            # 217 municípios do MA (IBGE)
└── lib/                               # db, repository, cpf, session, validation, types
```

## Testes

```bash
npm test
```

Suíte Jest (preset `next/jest`), sem mocks de código próprio:

- `src/lib/__tests__/` — unitários de `cpf` (máscara + dígitos verificadores), `validation` (municípios do MA + formato do link), `session` (assinatura HMAC do cookie) e `repository` (CRUD real contra SQLite em memória, via `DATABASE_PATH=':memory:'` no `jest.setup.js`)
- `src/app/api/register/__tests__/` — a rota pública inteira com `Request` real e banco em memória (cadastro, dedup, validações e body malformado)

## Variáveis de ambiente

| Variável         | Descrição                                                         |
| ---------------- | ----------------------------------------------------------------- |
| `ADMIN_PASSWORD` | Senha da área administrativa (obrigatória)                        |
| `SESSION_SECRET` | Segredo para assinar o cookie de sessão (obrigatória em produção) |
| `DATABASE_PATH`  | Caminho do arquivo SQLite (opcional; padrão `data/app.db`)        |

## Deploy

O banco é um arquivo SQLite — hospede em um servidor com disco persistente (VPS, Railway, Fly.io, Render com disco). **Não** use Vercel/plataformas serverless sem trocar o banco (o filesystem não persiste); nesse caso migre para Postgres.

## LGPD

O sistema coleta CPF (dado pessoal). Mantenha finalidade clara, colete só o necessário e proteja o acesso ao banco e à área administrativa. O formulário já inclui consentimento explícito e aviso de finalidade.
