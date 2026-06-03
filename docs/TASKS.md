# TASKS.md — Backlog de execução (spec-driven)

Cada fase abaixo é uma unidade de trabalho para o Claude Code. **Execute em ordem.**
Comece cada sessão dizendo ao Claude Code algo como:
*"Leia CLAUDE.md e SPEC.md. Vamos executar a Fase N do TASKS.md."*

Ao terminar uma fase, marque o checkbox e rode os critérios de aceite antes de seguir.
Não pule a Fase 0.

---

## Fase 0 — Fundação

> Pré-requisito: o projeto Next 15 + TS + Tailwind + App Router já foi criado via npm.
> Esta fase configura a base sobre o projeto existente.

- [ ] Configurar fontes via `next/font` (display + corpo, ver SPEC §Tipografia).
- [ ] Definir tokens de cor da SPEC como CSS vars no globals + mapear no Tailwind.
      ⚠️ Cores são provisórias (ver aviso na SPEC) — centralizar em vars para troca fácil.
- [ ] Criar estrutura de pastas: `components/sections/`, `components/ui/`, `lib/`, `app/actions/`.
- [ ] Criar `lib/content.ts` com TODO o conteúdo textual da SPEC tipado (objeto por seção).
- [ ] Criar `.env.example` com `CRM_WEBHOOK_URL=https://webhook3.assessorialpha.com/webhook/wordpress-geral`
      e documentar o formato do payload. Criar `.env.local` com o mesmo valor (não commitar).
- [ ] Configurar metadata global (title, description, OG, lang pt-BR) em `app/layout.tsx`.
- [ ] `app/page.tsx` renderiza um `<main>` vazio com as seções importadas (stubs por enquanto).

**Aceite:** projeto roda (`npm run dev`), fontes carregam auto-hospedadas, sem erros de TS.

---

## Fase 1 — Formulário + Server Action (PRIORIDADE — fazer antes do resto)

> Esta é a peça que gera receita. Construa e teste isolada antes do design das outras seções.

- [ ] `components/ui/cta-button.tsx` — botão CTA reutilizável (verde, pill, seta ↗).
- [ ] `components/sections/form-section.tsx` — seção do formulário (SPEC §3). Server
      Component que renderiza a copy + importa o `<LeadForm>` client.
- [ ] `components/lead-form.tsx` — `"use client"`. Todos os campos da SPEC §3, com
      máscara de telefone (com país) e CNPJ, validação client-side, estados
      idle/enviando/sucesso/erro, honeypot oculto.
- [ ] `lib/validation.ts` — schema `zod` compartilhado (client + server).
- [ ] `app/actions/submit-lead.ts` — `"use server"`. Valida com zod, monta payload
      snake_case, POST para `CRM_WEBHOOK_URL`, trata erro, retorna resultado tipado.
- [ ] Mensagem de sucesso substitui o form ao enviar.

**Aceite:** form valida corretamente, submit com `CRM_WEBHOOK_URL` apontando para um
endpoint de teste (ex: webhook.site) chega com o payload certo, estados de UI funcionam,
todos os campos têm label acessível. Testar contra o webhook real
(`https://webhook3.assessorialpha.com/webhook/wordpress-geral`) só após confirmar o
formato de payload esperado com o cliente.

---

## Fase 2 — Hero + Marquee

- [ ] `components/sections/hero.tsx` — SPEC §1. Fundo laranja + textura chevron, logo
      (`priority`), headline com mix de pesos, subtítulo, CTA → `#formulario`.
- [ ] `components/sections/marquee.tsx` — SPEC §2. Faixa(s) diagonal(is) com animação
      CSS pura infinita, respeitando `prefers-reduced-motion`.

**Aceite:** hero idêntico ao screenshot (cores, pesos, layout), marquee roda suave sem
JS, CLS ~0, logo com priority.

---

## Fase 3 — Seções de conteúdo escuras (estáticas)

- [ ] `components/sections/about.tsx` — Quem Somos (SPEC §5) com polaroids.
- [ ] `components/sections/method.tsx` — O Método Alpha (SPEC §6). Vídeo/visual com
      lazy-load + poster (IntersectionObserver) ou animação SVG. Não hotlinkar WP.
- [ ] `components/sections/plans.tsx` — Planos Personalizados (SPEC §8).
- [ ] `components/sections/team-cta.tsx` — CTA Time Exclusivo (SPEC §9) + bolinha pulsante.

**Aceite:** todas batem com os screenshots, imagens via next/image, lazy load correto.

---

## Fase 4 — Componentes interativos (carrossel + FAQ + depoimentos)

- [ ] `components/sections/services.tsx` + carrossel client leve (scroll-snap + setas),
      SPEC §7. Marcar TODO nos cards cujos bullets não estão na spec.
- [ ] `components/sections/faq.tsx` — accordion acessível (SPEC §10), animação suave.
- [ ] `components/sections/testimonials.tsx` — SPEC §4. Cards de vídeo com poster +
      play sob demanda (não embutir vídeo direto).

**Aceite:** carrossel navega com teclado e mouse, accordion com aria-expanded correto,
vídeos só carregam ao clicar.

---

## Fase 5 — Footer + montagem final

- [ ] `components/sections/footer.tsx` — SPEC §11.
- [ ] Montar todas as seções na ordem em `app/page.tsx`.
- [ ] Garantir âncora `#formulario` e scroll suave dos CTAs.
- [ ] Revisar hierarquia de headings (um h1 no hero, h2 nas seções).

**Aceite:** página completa, navegação por âncora funciona, HTML semântico validado.

---

## Fase 6 — Otimização e auditoria

- [x] Rodar `pnpm build` e conferir que tudo é estático (sem rotas dinâmicas acidentais).
- [ ] Auditar com Lighthouse (mobile). Alvo 95+ nas 4 métricas. ← rodar manualmente no browser
- [x] Verificar: imagens em WebP/AVIF via next/image, fontes com swap, JS client mínimo
      (VideoCard extraído de testimonials.tsx para server component), CLS ~0, LCP: logo com priority.
- [x] Acessibilidade: aria-describedby adicionado nos radios do campo "investiria", aria-expanded
      no accordion, labels sr-only em todos os campos do form.
- [x] `prefers-reduced-motion` respeitado em marquee (CSS paused), accordion (motion-reduce:transition-none),
      carrossel (motion-reduce:transition-none), método (motion-safe:animate-pulse), bolinha pulsante (motion-safe:animate-ping).
- [x] Metadata/OG: metadataBase adicionado, OG title/description/locale/type presentes.
      ⚠️ OG image pendente — aguardando asset raster 1200×630 do cliente (ver pendência #4).

**Aceite:** Lighthouse 95+ mobile, axe sem erros críticos, build limpo.

---

## Pendências para o cliente (não bloqueiam, mas resolver antes do go-live)

1. **Webhook do CRM:** URL **definida** → `https://webhook3.assessorialpha.com/webhook/wordpress-geral`
   (parece n8n). Falta confirmar o **formato de payload** esperado. Para descobrir:
   F12 → Network → enviar form na LP original → inspecionar o corpo do POST e espelhar
   os nomes de campo.
2. **Cores reais:** os hex na SPEC são provisórios (estimados de screenshots). Extrair
   os valores exatos do CSS da LP original e substituir nas CSS vars antes do go-live.
3. **Hospedagem dos vídeos:** mover método + 3 depoimentos para Mux/Cloudflare
   Stream/Vimeo. Não servir do WordPress.
4. **Assets reais:** logo SVG, fotos, mockups (ver SPEC §Assets a coletar).
5. **Fontes da marca:** confirmar se há fonte custom (a spec aproxima com Anton/Oswald/Archivo).
6. **Bullets faltantes** dos cards de serviço (Gestão e Atendimento, Mídia Paga,
   Soluções Comerciais, Vídeos, Acompanhamento).
7. **URL do TikTok** para o footer.
