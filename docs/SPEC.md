# SPEC.md — Especificação da Landing Page Alpha

Fonte de verdade do que construir. Conteúdo extraído da LP original; design extraído
de screenshots da versão renderizada. Construa contra esta spec, na ordem definida em
TASKS.md.

---

## Design System

### Cores (definir como CSS vars / tokens do Tailwind)

> ⚠️ **PENDENTE — valores provisórios.** Os hex abaixo são ESTIMATIVAS visuais a partir
> de screenshots, não as cores reais da marca. NÃO trate como definitivos. Antes do
> go-live, substituir pelos valores exatos extraídos do CSS da LP original (paleta
> global do Elementor / inspeção dos elementos). Centralize tudo em CSS vars para que a
> troca seja feita num único lugar.

| Token            | Valor aprox. | Uso                                                |
|------------------|--------------|----------------------------------------------------|
| `--bg`           | `#0A0A0A`    | Fundo padrão (preto) da maioria das seções         |
| `--bg-card`      | `#1A1A1A`    | Cards escuros (form, serviços, FAQ)                 |
| `--accent`       | `#F5A623`    | Laranja/âmbar — destaques, labels, ícones          |
| `--accent-hi`    | `#FFB800`    | Âmbar mais claro para gradientes                   |
| `--brand-orange` | `#FFA500`    | Laranja vivo de fundo (Hero e seção "Time")        |
| `--cta`          | `#3DF000`    | Verde-limão dos botões CTA                         |
| `--cta-hover`    | `#34D400`    | Hover do CTA                                       |
| `--text`         | `#FFFFFF`    | Texto principal sobre fundo escuro                 |
| `--text-muted`   | `#A0A0A0`    | Texto secundário / parágrafos                      |
| `--text-on-light`| `#0A0A0A`    | Texto preto sobre fundos laranja                   |

> NOTA: reforçando — valores aproximados. Confirme amostrando as cores reais da LP
> original (`https://assessorialpha.com/00-lp/`) antes do go-live. Ver pendência #7.

### Tipografia (via next/font, auto-hospedada)

- **Display / títulos:** fonte grotesque bold condensada e MAIÚSCULA. Use **Anton**
  para os títulos de maior impacto (Hero) e **Oswald** (ou **Archivo** semi-condensed)
  para títulos de seção. Confirme contra a original — pode ser uma fonte custom; se
  for, a aproximação acima é fiel ao espírito.
- **Corpo:** sans-serif neutra e legível. **Archivo** ou **Figtree**. Evite Inter (já
  é genérica demais) a menos que a original use exatamente Inter.
- **Padrão de ênfase:** títulos misturam peso regular + bold na mesma frase para
  destacar palavras-chave (ex: "MAIOR ASSESSORIA DE" bold, "DA" regular). Palavras de
  destaque às vezes em `--accent`. Replique esse padrão (ver conteúdo de cada seção).

### Componentes recorrentes

- **Botão CTA:** fundo `--cta` verde, texto preto, peso bold, cantos bem arredondados
  (~9999px / pill), ícone de seta diagonal (↗) à direita. Glow sutil. Hover: leve
  scale + `--cta-hover`. Todos os CTAs ancoram para `#formulario`.
- **Label de seção:** texto pequeno, MAIÚSCULO, `--accent`, com tracking largo, acima
  do título (ex: "QUEM SOMOS", "O MÉTODO ALPHA", "PLANOS PERSONALIZADOS").
- **Checkmark item:** quadradinho âmbar com check, usado nas listas dos cards de serviço.

---

## Seções (na ordem da página)

### 1. Hero
- **Fundo:** laranja vivo (`--brand-orange`) com textura geométrica de chevrons/setas
  mais escuras ao fundo (decorativo). Texto preto.
- **Topo, centralizado:** logo "alpha" (wordmark branca + símbolo de setas duplas).
- **Headline** (centralizada, MAIÚSCULA, mix regular/bold):
  - linha 1 (regular): `SEU RESTAURANTE PRECISA DA`
  - linha 2-4 (bold): `MAIOR ASSESSORIA DE MARKETING GASTRONÔMICO` + (regular) `DA` + (bold) `AMÉRICA LATINA!`
- **Subtítulo** (preto, peso médio): `Somos a engrenagem invisível dos maiores restaurantes do Brasil.`
- **CTA:** botão verde `Quero mais informações ↗` → âncora `#formulario`.
- **Borda inferior:** faixa preta diagonal com marquee (ver seção 2) cruzando o rodapé do hero.
- `priority` na imagem do logo. Esta é a única seção above-the-fold.

### 2. Marquee (faixa rolante)
- Faixa diagonal preta, texto branco em movimento horizontal infinito.
- Conteúdo repetido: `+600 CLIENTES ATIVOS • +500M EM VENDAS PARA OS NOSSOS CLIENTES • +5 ANOS DE EXPERIÊNCIA •`
- Há duas faixas sobrepostas em ângulos/velocidades ligeiramente diferentes (uma preta, uma cinza/branca) criando profundidade.
- **Performance:** animação CSS pura (`@keyframes` + `transform: translateX`). Sem JS.
  Respeite `prefers-reduced-motion` (parar a animação).

### 3. Formulário (id="formulario") — PRIORIDADE MÁXIMA
- **Fundo:** preto.
- **Layout:** duas colunas no desktop, empilhado no mobile. Esquerda = copy, direita = form.
- **Coluna esquerda:**
  - Label âmbar: `AVISO`
  - Título (branco, bold, maiúsculo): `NÃO SAIA AGORA! FALTAM POUCOS SEGUNDOS PARA SEU RESTAURANTE MUDAR.` (palavras POUCOS, SEGUNDOS, MUDAR em bold mais forte)
  - Dois cards escuros numerados:
    1. **Complete o formulário** — "Forneça suas informações no formulário ao lado. Garantimos a segurança total de seus dados. Serão usados apenas para contato."
    2. **Receba uma ligação personalizada** — "Em um prazo de até 5 minutos em horário comercial, um dos nossos especialistas entrará em contato diretamente para agendar a reunião mais importante com você."
  - Os números (1, 2) em badge âmbar.
- **Coluna direita — campos (todos obrigatórios salvo nota):**
  1. `nome` — texto — placeholder "Seu nome"
  2. `email` — email — placeholder "Seu melhor e-mail"
  3. `telefone` — tel — com seletor de país (default Brasil 🇧🇷, máscara) — placeholder "Telefone"
  4. `empresa` — texto — placeholder "Nome da empresa"
  5. `segmento` — select — label "Selecionar segmento" — opções:
     Pizzarias, Hamburguerias, Restaurante comida brasileira, Churrascaria steakhouse,
     Restaurante japonês, Restaurante massas italiano, Restaurante comida árabe,
     Açaí / sorveteria, Cafeteria, Doceria, Gastrobar, Outros
  6. `faturamento` — select — label "Selecionar faturamento" — opções:
     Até 30 mil, 30 mil até 50 mil, 50 mil até 80 mil, 80 mil até 100 mil,
     100 mil até 150 mil, 150 mil até 250 mil, 250 mil até 400 mil,
     400 mil até 600 mil, 600 mil até 1 milhão, Mais de 1 milhão
  7. `cnpj` — texto — placeholder "Seu CNPJ" — com máscara de CNPJ
  8. `investiria` — select/radio — "Você investiria R$4.000,00 por mês para vender mais?" — opções: Sim, Não
  - **Botão submit:** verde `--cta`, texto preto bold "Receber mais informações".
- **Comportamento de envio (Server Action):**
  - Arquivo `app/actions/submit-lead.ts`, `"use server"`.
  - Valida os campos no servidor (use `zod`). Telefone e CNPJ com validação de formato.
  - Faz POST para `process.env.CRM_WEBHOOK_URL` com o payload em JSON. O endpoint é um
    webhook (n8n, a julgar pela URL) em
    `https://webhook3.assessorialpha.com/webhook/wordpress-geral`. Mapeie os campos para
    um payload limpo (chaves em snake_case). Como o webhook recebia dados do WordPress,
    confirme com o cliente se ele espera algum campo/nome específico; se sim, espelhe.
    Documente o formato no `.env.example`.
  - Trate erro de rede: se o webhook falhar, retorne erro amigável e logue no servidor.
  - Estados de UI no client: idle / enviando / sucesso / erro. Em sucesso, troque o
    form por uma mensagem de confirmação ("Recebemos! Em até 5 min entramos em contato.").
  - **Anti-spam:** honeypot field oculto + (opcional) rate limit simples.
- **Acessibilidade:** todo campo com `<label>` (pode ser sr-only), `aria-invalid` em erro,
  mensagens de erro associadas via `aria-describedby`.

### 4. Depoimentos
- **Fundo:** branco (contraste com as seções pretas).
- Label com ícone: `DEPOIMENTOS`
- Título (preto, bold): `MAIS DE` + (âmbar) `2.000` + `RESTAURANTES COM RESULTADOS.` + (preto) `ISSO É` + (âmbar) `ALPHA.`
- **3 cards de vídeo vertical** (formato story 9:16), cada um com badge "ads NN / Alpha
  Assessoria" no topo, botão de play vermelho central, e ícone de compartilhar embaixo.
- **Performance:** NÃO embutir os vídeos diretamente. Use thumbnail estático (poster) +
  play sob demanda (clique carrega o player). Os vídeos originais estão no WP — confirmar
  hospedagem final com o cliente. Por ora, estruture com poster + placeholder de player.

### 5. Quem Somos
- **Fundo:** preto.
- **Layout:** duas colunas. Esquerda = 3 fotos estilo polaroid (com fita adesiva nas
  bordas), levemente rotacionadas e sobrepostas, legendas manuscritas:
  "TIME ALPHA", "ESCRITÓRIO", "NOSSA CULTURA". Direita = texto.
- **Direita:**
  - Label âmbar: `QUEM SOMOS`
  - Título: `LÍDER` + (regular) `EM` + (bold) `MARKETING GASTRONÔMICO` + (regular) `E` + `PARCEIRA DO` + (bold) `SEU SUCESSO.`
  - 3 parágrafos (texto-muted, com algumas palavras em branco/bold):
    1. "Na **Alpha Assessoria**, não somos apenas uma agência; somos a **maior assessoria de marketing especializada em restaurantes da América Latina**. Nascemos da paixão por transformar negócios gastronômicos, elevando-os a um novo patamar de sucesso e reconhecimento."
    2. "Com uma **estrutura 100% presencial** e uma **equipe de mais de 80 profissionais** altamente qualificados, a Alpha Assessoria é a parceira estratégica que seu restaurante precisa."
    3. "Nosso time multidisciplinar, composto por gestores de tráfego, designers e **especialistas em marketing digital**, trabalha em sinergia para garantir que cada aspecto da sua presença online e offline seja otimizado."
- Efeito polaroid: borda branca grossa, sombra, leve rotação, "fita" semi-transparente no topo.

### 6. O Método Alpha
- **Fundo:** preto.
- Label âmbar centralizado: `O MÉTODO ALPHA`
- Título centralizado: (regular) `EXISTE UM` + (bold) `MÉTODO COMPROVADO` + (regular) `PARA QUE SEU RESTAURANTE` + (bold) `NUNCA PARE` + (regular) `DE` + (bold) `VENDER`
- Subtítulo: "Se você seguir, irá manter seu negócio **faturando todos os dias**."
- **Visual central:** o símbolo de setas duplas da Alpha em dourado com efeito de fogo/energia,
  com labels conectados ao redor: Engajamento, Retenção, Ativação, Aquisição, Indicação, e
  um destaque inferior "Monetização" (em badge). Na original isto é um **vídeo .mp4 em loop**.
  - **Performance:** se mantiver vídeo, lazy-load + `poster` + `muted autoplay loop playsInline`
    SOMENTE quando entrar na viewport (IntersectionObserver). Idealmente substituir por
    animação CSS/SVG do símbolo se viável. Confirmar com cliente. Não hotlinkar do WP.

### 7. O Que Fazemos (carrossel de serviços)
- **Fundo:** preto.
- Label âmbar centralizado: `O QUE FAZEMOS?`
- Título centralizado: (regular) `A` + (bold) `ASSESSORIA ALPHA` + (regular) `ESTRUTURA O MARKETING DO SEU RESTAURANTE COM BASE NA SUA` + (bold) `NECESSIDADE`
- **Carrossel** de cards (setas ‹ › para navegar). Cada card = título + lista de bullets
  com checkmark âmbar + imagem ilustrativa. Cards identificados no conteúdo original:
  - **Cardápio Digital:** "Estruturamos todo o seu cardápio digital, desde o layout até os itens" / "Aumentamos seu ticket médio para ter maior margem de lucro, utilizando uma estratégia validada" / "Maior conversão de clientes através de hierarquia visual, produtos âncora e campanhas sazonais"
  - **Disparo de Mensagens Inteligente:** "Campanhas automáticas de vendas: promoções, combos e novidades direto no WhatsApp do seu cliente" / "Reativação de clientes antigos: trazemos de volta quem já comprou e parou de pedir"
  - **Gestão e Atendimento** (conteúdo de bullets a confirmar na original)
  - **Mídia Paga** (idem)
  - **Soluções Comerciais** (idem)
  - **Vídeos** (idem)
  - **Acompanhamento** (idem)
  > Alguns cards têm bullets que não apareceram nos screenshots. Marque como TODO e
  > extraia da LP original navegando o carrossel, ou peça ao cliente.
- **Performance:** carrossel client-side leve. Pode usar scroll-snap CSS + botões, sem lib.

### 8. Planos Personalizados
- **Fundo:** preto.
- **Layout:** duas colunas. Esquerda = texto, direita = gráfico decorativo (área dourada
  estilo "mountain chart" com ícones de plataformas: Meta, iFood, etc. flutuando nos picos).
- **Esquerda:**
  - Label âmbar: `PLANOS PERSONALIZADOS`
  - Título: `VOCÊ` + (bold) `ESCOLHE` + (regular) `A` + (bold) `SOLUÇÃO CERTA` + (regular) `PARA A FASE QUE SEU RESTAURANTE` + (bold) `VIVE HOJE.`
  - Parágrafo: "Oferecemos nossos serviços por **planos flexíveis**. Você escolhe **conforme sua condição atual**. O mais importante é continuar apostando em estratégias que trazem resultado."
- Gráfico da direita: pode ser imagem otimizada ou SVG. Decorativo (`alt=""`).

### 9. CTA — Time Exclusivo
- **Fundo:** laranja vivo (`--brand-orange`), texto preto. Centralizado.
- Label (branco, bold): `RECEBA UM TIME EXCLUSIVO`
- Título (preto, mix): `A` + (bold) `ASSESSORIA ALPHA` + (regular) `ESTRUTURA O MARKETING DO SEU RESTAURANTE COM BASE NA SUA` + (bold) `NECESSIDADE`
- Parágrafo (preto): "Tenha um time de especialistas ao seu lado ou terceirize totalmente seu marketing e setor comercial com a Alpha. Sem dor de cabeça com contratações, gestão de equipe, riscos trabalhistas ou burocracias você foca no seu restaurante, e a gente foca em fazer ele crescer."
- CTA verde `Quero mais informações ↗` → `#formulario`.
- Ao lado do CTA: indicador "● Especialistas online agora" (bolinha verde pulsante).

### 10. FAQ
- **Fundo:** preto.
- **Layout:** duas colunas. Esquerda = título, direita = accordion.
- **Esquerda:**
  - Título (branco, bold): `PERGUNTAS FREQUENTES`
  - Subtítulo (muted): "Ficou com alguma dúvida sobre a Alpha? Talvez ela esteja aqui."
- **Direita — accordion** (cada item: badge "?" âmbar + pergunta + seta ↓; expande resposta):
  1. **O que exatamente a Alpha faz?** — "Somos uma assessoria especializada em marketing gastronômico. Ajudamos restaurantes, pizzarias, hamburguerias e negócios de alimentação a vender mais por meio de estratégias como tráfego pago, gestão de iFood, disparo de mensagens, criação de criativos e estruturação do comercial."
  2. **Posso cancelar quando quiser?** — "Sim, você pode cancelar sua assinatura a qualquer momento."
  3. **Em quanto tempo vou ver resultados?** — "Depende do estágio atual do seu negócio, estrutura interna e investimento. Mas, na maioria dos casos, nossos clientes começam a sentir o impacto positivo nas vendas em 30 a 60 dias."
  4. **Vocês atendem qualquer tipo de restaurante?** — "Atendemos desde pequenas operações até grandes redes, desde que estejam dispostas a seguir um plano estratégico de crescimento. Inclusive, temos um núcleo especializado para negócios que faturam acima de R$200 mil/mês: o Alpha X."
  5. **A Alpha cuida do meu Instagram e redes sociais?** — "Sim, mas com foco em performance. Não somos uma empresa de 'post bonitinho'. Nosso objetivo é transformar conteúdo e anúncios em vendas reais. Se não gerar resultado, não faz sentido estar ali."
- **Acessibilidade:** accordion com `<button aria-expanded>`, painel com `role="region"`.
  Animação de abrir/fechar suave (grid-template-rows ou max-height). Respeitar reduced-motion.

### 11. Footer
- **Fundo:** preto.
- Logo "alpha" à esquerda.
- Ícones sociais (centro): Instagram (`https://www.instagram.com/assessorialpha/`),
  TikTok (URL a confirmar), LinkedIn (`https://www.linkedin.com/company/assessoria-alpha/`).
- Direita (muted): `2025 © Assessoria Alpha. CNPJ: 48.684.183/0001-38`
- Linha divisória sutil acima do footer.

---

## Metadata / SEO

- `title`: "Assessoria Alpha — Marketing Gastronômico para Restaurantes"
- `description`: algo como "A maior assessoria de marketing gastronômico da América Latina. +600 clientes ativos, +500M em vendas geradas. Estruture o marketing do seu restaurante."
- OG image: usar o logo/hero. lang pt-BR.

## Assets a coletar (TODO do cliente / extração)

- Logo Alpha (wordmark + símbolo) em SVG de preferência.
- Imagens reais: fotos polaroid (time/escritório/cultura), foto do atendente (card serviços),
  mockup do cardápio digital, gráfico de planos, símbolo dourado do método.
- Vídeos: método (loop) + 3 depoimentos. Definir hospedagem (Mux/Cloudflare Stream/Vimeo
  recomendados — NÃO WordPress).
- Confirmar fontes reais da marca (pode haver fonte custom).
- Webhook do CRM: **URL definida** → `https://webhook3.assessorialpha.com/webhook/wordpress-geral`.
  Falta confirmar o **formato de payload** que o webhook espera (nomes de campos).
