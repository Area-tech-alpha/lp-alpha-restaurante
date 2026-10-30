# Agendamento no Google Agenda (lp-09)

Fluxo: o lead preenche o formulário em `/lp-09`.

- **Desqualificado** (até 30 mil respondendo "Não" para investir): segue o fluxo de
  todas as LPs, `CRM_WEBHOOK_URL` → n8n → Growth Hub.
- **Qualificado:** **nunca passa pelo Growth Hub.** No envio do form ele entra no CRM
  da Matriz (`POST {CRM_API_URL}/external/leads`, `destination: "hq"`) já com o
  closer de `CLOSER_CALENDAR_EMAIL`, e vai para `/lp-09/agendamento?t=<token>`. Ao
  escolher o horário, a reunião é criada **na agenda do closer/SDR**, com Google Meet e o
  lead como convidado, e anexada ao mesmo lead no CRM: estágio "Reunião agendada" e
  call pendente. Quem não agenda fica no CRM com o closer/SDR, em "Novo Lead", e
  **5 minutos depois é enviado ao comercial** (ver "Follow-up: lead que não agendou").

O lead do form e a reunião se juntam no CRM pelo e-mail/telefone (até 7 dias, a
validade do link). Se o envio do form tiver falhado, o do agendamento cria o lead.

**O agendamento não usa o banco de dados.** Os dados do lead vão do formulário até a
página de horários num token criptografado (AES-256-GCM) no `?t=` da URL; quem abre
o link não consegue ler nem alterar o conteúdo. A única trava fica no Google:
- **lead já agendou:** o id do evento é derivado do lead, então um segundo
  agendamento do mesmo lead é recusado pelo próprio Google.

**Não há checagem de agenda ocupada:** a grade não consulta o freebusy e vários leads
podem marcar o mesmo horário.

## Grade de horários

- Slots de 30 em 30 min (`:00` e `:30`), em três períodos `[início, fim)`:
  **Manhã** 08:00–11:30, **Tarde** 13:00–17:30, **Noite** 18:00–21:30.
- Dias de seg a sáb (domingo nunca). **Hoje entra** e conta como um dos 3 dias
  (hoje qui → QUI, SEX, SÁB; num domingo → SEG, TER, QUA). Se hoje não tiver mais
  nenhum horário (ex.: 21:45), a grade pula para os 3 próximos dias úteis.
- Antecedência mínima de 30 min (`minNoticeMinutes`): só aparece slot que começa em
  `>= agora + 30 min`, e o `POST` recusa (`invalid_slot`) qualquer outro.
- Na página, cada dia tem três gavetas (Manhã / Tarde / Noite) com a contagem de
  horários; período sem horário aparece desabilitado como "Indisponível".

Todos os agendamentos caem numa única agenda: a do `AGENDA_ORGANIZER_EMAIL`, se
definida, ou a do `CLOSER_CALENDAR_EMAIL` (ver "Esconder o e-mail do closer").

Para o evento nascer na agenda do closer/SDR, com ele como organizador, usamos uma
**Service Account com Domain-Wide Delegation** no Google Workspace, que se faz
passar pelo e-mail do dono da agenda. Não há OAuth nem tela de consentimento.

## Onde fica cada coisa

| O quê | Onde |
|---|---|
| Regras (duração do slot, períodos manhã/tarde/noite, antecedência mínima, nº de dias, dias da semana (seg a sáb), dias bloqueados, timezone, `sendUpdates`) | `lib/agendamento-config.ts` |
| Montagem da grade de dias e slots (lógica pura) | `lib/agendamento.ts` |
| Quem vai para o agendamento depois do form | `agendamentoPathAposCadastro` em `lib/agendamento.ts` |
| Token com os dados do lead | `lib/agendamento-token.ts` |
| Chamadas ao Google (criação e busca do evento) | `lib/google-calendar.ts` |
| APIs | `GET /api/agendamento/slots?t=<token>`, `POST /api/agendamento` e `POST /api/agendamento/followup` (QStash) |
| Follow-up de 5 min (QStash + webhook do comercial) | `lib/agendamento-followup.ts` |
| Envio do lead qualificado ao CRM (closer + reunião) | `lib/crm.ts` |
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
     https://www.googleapis.com/auth/calendar.events
     ```
5. Clique em **Autorizar**. A propagação pode levar de alguns minutos até ~24h. Se
   aparecer `unauthorized_client` logo depois, é só aguardar.

`calendar.events` permite criar eventos (com Meet) e buscar o evento do próprio lead.
(O escopo `calendar.freebusy` não é mais usado; pode continuar autorizado sem problema.)

## 3. Variáveis de ambiente

Em `.env.local` (local) e em **Vercel → Settings → Environment Variables**:

```bash
GOOGLE_SA_CLIENT_EMAIL=lp-agendamento@<projeto>.iam.gserviceaccount.com   # "client_email" do JSON
GOOGLE_SA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"  # "private_key" do JSON
CLOSER_CALENDAR_EMAIL=calebe.tech@assessorialpha.com
CLOSER_INITIAL=Y
MEETING_TITLE_PREFIX=Consultoria
CRM_API_URL=https://<api do CRM>
CRM_EXTERNAL_LEADS_API_KEY=   # EXTERNAL_LEADS_API_KEY do Dashboard-Comercial-Back-V2
```

> O nome da variável continua `CLOSER_*` por compatibilidade; ela vale para
> qualquer pessoa do Workspace que vá atender a reunião.

- A `GOOGLE_SA_PRIVATE_KEY` pode ser colada com os `\n` literais, do jeito que vem
  no JSON. O código converte para quebras de linha reais.
- Título gerado: `{MEETING_TITLE_PREFIX}: {CLOSER_INITIAL} | {empresa}`, por
  exemplo `Consultoria: Y | Mestre do Frango`. O sufixo
  `- 2026/10/21 17:05 GMT-03:00 - Recording` é adicionado pelo próprio Google
  quando a reunião é gravada no Meet. Ele não faz parte do título.
- `CLOSER_CALENDAR_EMAIL` é ao mesmo tempo a agenda e o closer do lead no CRM: o
  e-mail precisa ser de um usuário ativo do CRM. Se não for, o lead entra na Matriz
  sem closer (log `closer_email sem usuário ativo` no CRM).
- Sem `CRM_API_URL`/`CRM_EXTERNAL_LEADS_API_KEY`, o lead qualificado não é aceito
  ("Erro ao enviar") — de propósito, para não cair no Growth Hub.
- O token usa como chave a `AGENDAMENTO_TOKEN_SECRET` ou, se ela não existir, o
  `AUTH_SECRET` que já está em produção (login do `/dashboard`). Trocar a chave
  invalida os links de agendamento que ainda não foram usados. O link vale 7 dias.

## 4. Trocar o e-mail da agenda (teste → produção)

1. Confirme que `yoshio.aragao@assessorialpha.com` é um usuário ativo do mesmo
   Workspace. A delegação vale para qualquer usuário do domínio, então não é preciso
   refazer a etapa 2.
2. Na Vercel (Production), altere:
   - `CLOSER_CALENDAR_EMAIL=yoshio.aragao@assessorialpha.com`
   - `CLOSER_INITIAL=Y` (confira a inicial)
3. Faça um redeploy, porque variáveis de ambiente só valem a partir do próximo
   deploy.
4. Teste com um lead de verdade e um horário qualquer. Confira o evento na agenda
   do Yoshio e depois apague o evento.

Os eventos já criados continuam na agenda de teste; só os novos agendamentos vão
para a agenda nova.

## 5. Testar localmente

```bash
cp .env.example .env.local   # preencher CRM_WEBHOOK_URL, AUTH_SECRET e as variáveis acima
npm run dev
```

1. Abra <http://localhost:3000/lp-09> e envie o form com faturamento acima de 30 mil
   (lead qualificado). Você deve ser levado para `/lp-09/agendamento?t=<token>`.
2. Escolha um horário, confirme e verifique o evento com Meet na agenda de
   `CLOSER_CALENDAR_EMAIL`.
3. Para testar a API isoladamente (copie o `<token>` da URL do passo 1):

   ```bash
   curl "http://localhost:3000/api/agendamento/slots?t=<token>"
   curl -X POST http://localhost:3000/api/agendamento \
     -H "Content-Type: application/json" \
     -d '{"token":"<token>","start":"2026-10-28T13:30:00.000Z"}'
   ```

Respostas de erro do `POST`: `400 invalid_slot` (fora da grade ou no passado),
`404 lead_not_found` (token inválido ou com mais de 7 dias), `409 already_scheduled`
`429 rate_limited` e `502/503` (falha no Google). Com `invalid_slot` a página avisa e recarrega a grade.

Testes da grade e do follow-up (sem rede): `npm test`.

## Esconder o e-mail do closer

O e-mail do closer/SDR **nunca vai para o navegador**: as rotas públicas
(`/api/agendamento`, `/api/agendamento/slots`, `/api/agendamento/followup`) e a
server action do form só devolvem códigos de erro e textos fixos, e
`CLOSER_CALENDAR_EMAIL` só é lido no servidor. Ele só aparece em chamadas
server-to-server (CRM, n8n, Google) e nos logs.

O ponto em que o lead ainda podia vê-lo era o **convite do Google**, onde o
organizer aparece. Para esconder:

1. Crie (ou escolha) uma conta genérica do Workspace, ex.: `agenda@assessorialpha.com`.
   Precisa ser um usuário ativo, com Google Agenda; a delegação da etapa 2 vale
   para ela sem refazer nada.
2. Defina `AGENDA_ORGANIZER_EMAIL=agenda@assessorialpha.com` na Vercel e faça redeploy.

Com ela definida, o evento é criado **na agenda da conta genérica** (organizer), o
closer entra como convidado já aceito, e o evento sai com
`guestsCanSeeOtherGuests: false` e `guestsCanInviteOthers: false`: o lead vê só a
conta genérica. A trava "lead já agendou" passa a procurar na agenda da conta
genérica. A descrição do evento não leva o e-mail do closer. O CRM continua
recebendo o closer em `closer_email`.

Sem a variável, nada muda: o closer é o organizer.

> Ao ligar a variável, reuniões criadas antes ficam na agenda do closer, e a trava
> "já agendou" não as enxerga: um lead dos últimos 7 dias com link ainda válido
> conseguiria marcar uma segunda reunião. Para evitar isso, ligue a variável num
> horário de pouco movimento ou confira os duplicados no CRM.

## Rate limit (lp-09)

O envio do form nas variações com agendamento e o `POST /api/agendamento` passam
por um rate limit no **Upstash Redis** (`lib/rate-limit.ts`), com janela fixa de 5
min, checado depois da validação e antes de gravar no banco ou enviar ao CRM:

| Chave | Limite |
|---|---|
| e-mail (trim + minúsculas) | 1 envio / 5 min |
| telefone (E.164) | 1 envio / 5 min |
| IP (`x-forwarded-for`) | 3 envios / 5 min (IP compartilhado não trava pessoas diferentes) |
| IP no `POST /api/agendamento` | 10 / 5 min (a trava "1 agendamento por lead" continua) |

- As chaves são `lp09:<tipo>:<sha256 do valor>`: o Redis nunca guarda e-mail,
  telefone ou IP em claro.
- Envio bloqueado: o form mostra "Recebemos seu cadastro há pouco. Tente novamente
  em X min." (`content.form.rateLimited`) e nada é gravado ou enviado: nem banco,
  CRM, CAPI/Pixel ou follow-up do QStash. No agendamento a resposta é
  `429 rate_limited`.
- **Fail-open:** sem `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`, com o Redis
  fora do ar ou demorando mais de 1,5s, o envio passa e o erro é logado
  (`[rate-limit]`).

## Follow-up: lead que não agendou em 5 min

1. No envio do form, depois de gerar o token, o lead qualificado da variação com
   agendamento ganha uma mensagem no **Upstash QStash** com `delay` de 300s para
   `POST {SITE_URL}/api/agendamento/followup` com `{ token }`. Falha ao agendar só
   loga (`[agendamento-followup]`); o envio do form nunca quebra por isso.
2. A rota verifica a assinatura do QStash (`QSTASH_CURRENT_SIGNING_KEY` /
   `QSTASH_NEXT_SIGNING_KEY`; sem assinatura válida → `401`), lê o lead do token e
   procura o evento do lead na agenda do closer:
   - **agendou:** não faz nada (log `Lead agendou, não envia ao comercial`);
   - **não agendou:** `POST` JSON para `COMERCIAL_WEBHOOK_URL` com o mesmo payload do
     `CRM_WEBHOOK_URL` (`lead_id`, contato, empresa, segmento, faturamento, cnpj,
     investiria, `origem`, `variante`, UTMs, referrer, fbclid/fbc/fbp) mais
     `crm_lead_id` e `motivo: "nao_agendou_5min"`. Timeout 10s; o status é logado.
3. Responde `200` nos dois casos (inclusive se o webhook do comercial falhar ou o
   token for inválido), para o QStash não repetir. Só devolve `503` se a consulta ao
   Google falhar — aí o QStash tenta de novo.

Variáveis (Vercel → Production):

```bash
COMERCIAL_WEBHOOK_URL=        # webhook do comercial
QSTASH_TOKEN=                 # Upstash Console → QStash → Request
QSTASH_CURRENT_SIGNING_KEY=   # Upstash Console → QStash → Signing Keys
QSTASH_NEXT_SIGNING_KEY=
SITE_URL=https://cadastro.assessorialpha.com
```

> O QStash precisa alcançar `SITE_URL` pela internet: não funciona com `localhost`
> nem com preview da Vercel protegido por senha/Deployment Protection. Sem
> `QSTASH_TOKEN`/`SITE_URL` o follow-up é só pulado (com log).

## Problemas comuns

| Erro no log | Causa |
|---|---|
| `unauthorized_client` | O Client ID ou os escopos da etapa 2 estão errados, ou a delegação ainda está propagando |
| `invalid_grant` | `CLOSER_CALENDAR_EMAIL` não é um usuário do Workspace, ou a chave foi revogada |
| `freeBusy sem acesso ao calendário` | O usuário impersonado não tem agenda ou está suspenso |
| `Calendar API 403 ... has not been used in project` | A Google Calendar API não foi ativada no projeto (etapa 1.3) |
