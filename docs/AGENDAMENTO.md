# Agendamento no Google Agenda (lp-09)

Fluxo: o lead preenche o formulário em `/lp-09`. Se for qualificado, vai para
`/lp-09/agendamento?lead=<id>`, escolhe um horário e a reunião é criada **na agenda
do closer**, com Google Meet e o lead como convidado. Depois disso, os dados vão
para o webhook do Growth Hub.

Para o evento nascer na agenda do closer, com ele como organizador, usamos uma
**Service Account com Domain-Wide Delegation** no Google Workspace, que se faz
passar pelo e-mail do closer. Não há OAuth nem tela de consentimento.

## Onde fica cada coisa

| O quê | Onde |
|---|---|
| Regras (duração do slot, janela 08:30–18:00, nº de dias, dias úteis, feriados, timezone, `sendUpdates`) | `lib/agendamento-config.ts` |
| Montagem da grade de dias e slots (lógica pura) | `lib/agendamento.ts` |
| Quem vai para o agendamento depois do form | `agendamentoPathAposCadastro` em `lib/agendamento.ts` |
| Chamadas ao Google (freebusy e criação do evento) | `lib/google-calendar.ts` |
| APIs | `GET /api/agendamento/slots?lead=<id>` e `POST /api/agendamento` |
| Payload do Growth Hub | `lib/growth-hub.ts` |
| Textos da página | `content.agendamento` em `lib/content.ts` |

## 1. Google Cloud: projeto, API e Service Account

1. Acesse <https://console.cloud.google.com/> com uma conta `@assessorialpha.com`.
2. **Criar o projeto:** no seletor de projetos, clique em **Novo projeto**. Sugestão
   de nome: `alpha-lp-agendamento`.
3. **Ativar a API:** vá em **APIs e serviços → Biblioteca**, procure
   **Google Calendar API** e clique em **Ativar**.
4. **Criar a Service Account:** vá em **IAM e administrador → Contas de serviço →
   Criar conta de serviço**.
   - Nome: `lp-agendamento`.
   - Não é preciso conceder nenhum papel (role) no projeto. Pule essas etapas e
     clique em **Concluir**.
5. **Gerar a chave:** abra a conta criada, vá na aba **Chaves**, clique em
   **Adicionar chave → Criar nova chave → JSON**. Um arquivo `.json` será baixado.
   - ⚠️ Esse arquivo é uma credencial. Não commite e não mande por chat aberto.
     Guarde num cofre de senhas.
6. **Anotar o Client ID:** na aba **Detalhes** da Service Account, copie o
   **ID exclusivo** (Unique ID / Client ID), um número de ~21 dígitos. É o mesmo
   valor do campo `client_id` do JSON.

> Se a organização bloquear a criação de chaves (`iam.disableServiceAccountKeyCreation`),
> um admin do Google Cloud precisa abrir uma exceção para esse projeto em
> **IAM → Políticas da organização**.

## 2. Google Workspace: Domain-Wide Delegation (feito pelo admin)

Quem faz esta etapa é um **super admin do Workspace**.

1. Acesse <https://admin.google.com/>.
2. Vá em **Segurança → Controle de acesso e dados → Controles de API**.
3. Em **Delegação em todo o domínio**, clique em **Gerenciar delegação em todo o
   domínio → Adicionar novo**.
4. Preencha:
   - **ID do cliente:** o Client ID do passo 1.6.
   - **Escopos OAuth** (separados por vírgula, exatamente assim):

     ```
     https://www.googleapis.com/auth/calendar.events,https://www.googleapis.com/auth/calendar.freebusy
     ```
5. Clique em **Autorizar**. A propagação pode levar de alguns minutos até ~24h. Se
   aparecer `unauthorized_client` logo depois, é só aguardar.

`calendar.events` permite criar eventos (com Meet) e `calendar.freebusy` permite
consultar os horários ocupados. Nenhum dos dois dá acesso ao conteúdo de outros
eventos da agenda.

## 3. Variáveis de ambiente

Em `.env.local` (local) e em **Vercel → Settings → Environment Variables**:

```bash
GOOGLE_SA_CLIENT_EMAIL=lp-agendamento@<projeto>.iam.gserviceaccount.com   # "client_email" do JSON
GOOGLE_SA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"  # "private_key" do JSON
CLOSER_CALENDAR_EMAIL=calebe.tech@assessorialpha.com
CLOSER_INITIAL=D
MEETING_TITLE_PREFIX=Consultoria
GROWTH_HUB_WEBHOOK_URL=
```

- A `GOOGLE_SA_PRIVATE_KEY` pode ser colada com os `\n` literais, do jeito que vem
  no JSON. O código converte para quebras de linha reais.
- Título gerado: `{MEETING_TITLE_PREFIX}: {CLOSER_INITIAL} | {empresa}`, por
  exemplo `Consultoria: D | Mestre do Frango`. O sufixo
  `- 2026/10/21 17:05 GMT-03:00 - Recording` é adicionado pelo próprio Google
  quando a reunião é gravada no Meet. Ele não faz parte do título.
- Se `GROWTH_HUB_WEBHOOK_URL` estiver vazia, o envio é ignorado (com log) e o
  agendamento funciona normalmente.

## 4. Banco de dados

A migration `prisma/migrations/20261027120000_add_lead_agendamento` adiciona ao
`leads` as colunas `agendadoPara`, `googleEventId`, `closerEmail`,
`agendamentoCriadoEm`, `growthHubSentAt` e `growthHubStatus`, além de um índice
único `(closerEmail, agendadoPara)`. Esse índice impede que dois leads reservem o
mesmo horário mesmo com requisições simultâneas.

```bash
npx prisma migrate deploy
```

> Cancelamentos: o índice único continua "segurando" o horário de um lead mesmo que
> o closer apague o evento no Google. Para liberar o horário, zere `agendadoPara` e
> `closerEmail` desse lead no banco.

## 5. Trocar do e-mail de teste para o closer real

1. Confirme que `douglas.junior@assessorialpha.com` é um usuário ativo do mesmo
   Workspace. A delegação vale para qualquer usuário do domínio, então não é preciso
   refazer a etapa 2.
2. Na Vercel (Production), altere:
   - `CLOSER_CALENDAR_EMAIL=douglas.junior@assessorialpha.com`
   - `CLOSER_INITIAL=D` (confira a inicial)
3. Faça um redeploy, porque variáveis de ambiente só valem a partir do próximo
   deploy.
4. Teste com um lead de verdade e um horário qualquer. Confira o evento na agenda
   do Douglas e depois apague o evento e zere o lead no banco.

Os agendamentos antigos continuam ligados ao `closerEmail` de teste no banco e não
bloqueiam a agenda do novo closer.

## 6. Testar localmente

```bash
cp .env.example .env.local   # preencher DATABASE_URL, CRM_WEBHOOK_URL e as variáveis acima
npx prisma migrate deploy    # use um banco de dev, não o de produção
npm run dev
```

1. Abra <http://localhost:3000/lp-09> e envie o form com faturamento acima de 30 mil
   (lead qualificado). Você deve ser levado para `/lp-09/agendamento?lead=<id>`.
2. Escolha um horário, confirme e verifique o evento com Meet na agenda de
   `CLOSER_CALENDAR_EMAIL`.
3. Para testar a API isoladamente:

   ```bash
   curl "http://localhost:3000/api/agendamento/slots?lead=<id>"
   curl -X POST http://localhost:3000/api/agendamento \
     -H "Content-Type: application/json" \
     -d '{"leadId":"<id>","start":"2026-10-28T13:30:00.000Z","variant":"lp-09"}'
   ```

Respostas de erro do `POST`: `400 invalid_slot` (fora da grade ou no passado),
`404 lead_not_found`, `409 already_scheduled`, `409 slot_taken` (a página recarrega
os horários sozinha) e `502/503` (falha no Google ou no banco).

## Problemas comuns

| Erro no log | Causa |
|---|---|
| `unauthorized_client` | O Client ID ou os escopos da etapa 2 estão errados, ou a delegação ainda está propagando |
| `invalid_grant` | `CLOSER_CALENDAR_EMAIL` não é um usuário do Workspace, ou a chave foi revogada |
| `freeBusy sem acesso ao calendário` | O usuário impersonado não tem agenda ou está suspenso |
| `Calendar API 403 ... has not been used in project` | A Google Calendar API não foi ativada no projeto (etapa 1.3) |
