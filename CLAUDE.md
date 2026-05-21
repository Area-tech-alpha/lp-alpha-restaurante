# CLAUDE.md — Contexto do projeto

> Este arquivo é lido automaticamente pelo Claude Code em toda sessão. Ele define as
> regras inegociáveis do projeto. **Sempre consulte `docs/SPEC.md` (o que construir) e
> `docs/TASKS.md` (a ordem de construção) antes de codar.**

## O que é este projeto

Migração de uma landing page da Assessoria Alpha (assessoria de marketing
gastronômico) de WordPress + Elementor para **Next.js puro**, otimizada ao máximo
para performance. É a primeira de várias LPs que serão migradas — então o código
deve servir de **template reaproveitável**, não de one-off.

A LP é de captação de leads. O formulário é a peça mais importante do projeto:
é o que gera receita. Trate-o com prioridade.

## Stack

- **Next.js 15** (App Router)
- **TypeScript** (strict)
- **Tailwind CSS v4**
- Deploy alvo: **Vercel**
- Gerenciador: `npm`

## Regras de performance (INEGOCIÁVEIS)

Estas regras existem porque o objetivo declarado do cliente é "otimizada ao máximo".
Toda decisão de código deve respeitá-las:

1. **Server Components por padrão.** Só adicione `"use client"` em componentes que
   tenham interatividade real (formulário, accordion do FAQ, carrossel). Nunca
   marque uma seção inteira como client se só um botão dentro dela precisa.
2. **Página totalmente estática.** A LP não tem dados dinâmicos no carregamento.
   Garanta SSG. Não introduza fetch no servidor que force renderização dinâmica.
3. **Imagens sempre via `next/image`.** Formato WebP/AVIF. `priority` APENAS na
   imagem above-the-fold (logo/hero). Todas as outras com lazy loading (padrão).
   Defina `width`/`height` explícitos para evitar layout shift (CLS).
4. **Fontes via `next/font`.** Auto-hospedadas, `display: "swap"`. Zero requisições
   a CDN de fonte externa. (Ver design system para as famílias.)
5. **Vídeos nunca servidos do WordPress.** Os vídeos atuais estão hospedados em
   `assessorialpha.com/wp-content/...`. NÃO faça hotlink. Use poster/thumbnail
   estático + carregamento sob demanda (clicar para tocar). Ver SPEC para detalhes.
6. **Zero bibliotecas pesadas sem justificativa.** Para animações simples, prefira
   CSS puro. Só traga uma lib de animação (ex: Framer Motion / `motion`) se uma
   seção realmente exigir, e isole no client component.
7. **Lighthouse alvo:** 95+ em Performance, Accessibility, Best Practices, SEO no
   mobile. Considere isso um critério de aceite, não um nice-to-have.

## Acessibilidade e SEO

- HTML semântico: `<header>`, `<main>`, `<section>`, `<footer>`, headings em ordem.
- Todo input do form com `<label>` associado (pode ser visualmente oculto, mas presente).
- `alt` descritivo em todas as imagens de conteúdo; `alt=""` em decorativas.
- Metadata via API de metadata do Next (title, description, OG tags). Ver SPEC.
- `lang="pt-BR"` no html.

## Convenções de código

- Componentes em `components/sections/` (um arquivo por seção da LP).
- UI compartilhada (botão CTA, etc.) em `components/ui/`.
- Conteúdo textual em `lib/content.ts` como objeto tipado — NÃO hardcode strings
  longas dentro do JSX. Isso facilita migrar as próximas LPs (troca o conteúdo,
  reusa os componentes).
- Server Action do form em `app/actions/submit-lead.ts`.
- Nomes de componentes em PascalCase, arquivos em kebab-case.
- Sem comentários óbvios. Comente só o "porquê" não-trivial.

## O que NÃO fazer

- Não copiar HTML do Elementor. O conteúdo já está extraído na SPEC.
- Não usar `localStorage`/`sessionStorage` desnecessariamente.
- Não instalar UI kits inteiros (Material, Chakra) — Tailwind dá conta.
- Não criar rotas além da home. É single-page com âncoras.
- Não commitar segredos. URL do webhook do CRM vai em `.env.local` (e `.env.example`).
