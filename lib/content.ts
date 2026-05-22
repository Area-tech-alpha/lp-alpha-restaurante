export const content = {
  hero: {
    headline: {
      line1: "SEU RESTAURANTE PRECISA DA",
      line2: "MAIOR ASSESSORIA DE MARKETING GASTRONÔMICO",
      line3: "DA",
      line4: "AMÉRICA LATINA!",
    },
    subtitle: "Somos a engrenagem invisível dos maiores restaurantes do Brasil.",
    cta: "Quero mais informações",
  },

  marquee: {
    text: "+600 CLIENTES ATIVOS • +500M EM VENDAS PARA OS NOSSOS CLIENTES • +5 ANOS DE EXPERIÊNCIA •",
  },

  form: {
    sectionLabel: "AVISO",
    title:
      "NÃO SAIA AGORA! FALTAM POUCOS SEGUNDOS PARA SEU RESTAURANTE MUDAR.",
    steps: [
      {
        number: 1,
        title: "Complete o formulário",
        description:
          "Forneça suas informações no formulário ao lado. Garantimos a segurança total de seus dados. Serão usados apenas para contato.",
      },
      {
        number: 2,
        title: "Receba uma ligação personalizada",
        description:
          "Em um prazo de até 5 minutos em horário comercial, um dos nossos especialistas entrará em contato diretamente para agendar a reunião mais importante com você.",
      },
    ],
    fields: {
      nome: { label: "Nome", placeholder: "Seu nome" },
      email: { label: "E-mail", placeholder: "Seu melhor e-mail" },
      telefone: { label: "Telefone", placeholder: "Telefone" },
      empresa: { label: "Empresa", placeholder: "Nome da empresa" },
      cnpj: { label: "CNPJ", placeholder: "Seu CNPJ" },
      segmento: {
        label: "Segmento",
        placeholder: "Selecionar segmento",
        options: [
          "Pizzarias",
          "Hamburguerias",
          "Restaurante comida brasileira",
          "Churrascaria steakhouse",
          "Restaurante japonês",
          "Restaurante massas italiano",
          "Restaurante comida árabe",
          "Açaí / sorveteria",
          "Cafeteria",
          "Doceria",
          "Gastrobar",
          "Outros",
        ],
      },
      faturamento: {
        label: "Faturamento mensal",
        placeholder: "Selecionar faturamento",
        options: [
          "Até 30 mil",
          "30 mil até 50 mil",
          "50 mil até 80 mil",
          "80 mil até 100 mil",
          "100 mil até 150 mil",
          "150 mil até 250 mil",
          "250 mil até 400 mil",
          "400 mil até 600 mil",
          "600 mil até 1 milhão",
          "Mais de 1 milhão",
        ],
      },
      investiria: {
        label: "Você investiria R$4.000,00 por mês para vender mais?",
        options: ["Sim", "Não"],
      },
    },
    submitLabel: "Receber mais informações",
    successMessage:
      "Recebemos! Em até 5 min entramos em contato.",
  },

  testimonials: {
    sectionLabel: "DEPOIMENTOS",
    title: {
      prefix: "MAIS DE",
      highlight: "2.000",
      middle: "RESTAURANTES COM RESULTADOS.",
      suffix: "ISSO É",
      brand: "ALPHA.",
    },
    videos: [
      { videoId: "aoDx_HTLaWA" },
      { videoId: "5A264VtPKEs" },
      { videoId: "oSDQUXjzd7Y" },
    ],
  },

  about: {
    sectionLabel: "QUEM SOMOS",
    paragraphs: [
      "Na Alpha Assessoria, não somos apenas uma agência; somos a maior assessoria de marketing especializada em restaurantes da América Latina. Nascemos da paixão por transformar negócios gastronômicos, elevando-os a um novo patamar de sucesso e reconhecimento.",
      "Com uma estrutura 100% presencial e uma equipe de mais de 80 profissionais altamente qualificados, a Alpha Assessoria é a parceira estratégica que seu restaurante precisa.",
      "Nosso time multidisciplinar, composto por gestores de tráfego, designers e especialistas em marketing digital, trabalha em sinergia para garantir que cada aspecto da sua presença online e offline seja otimizado.",
    ],
    // TODO: substituir por fotos reais fornecidas pelo cliente
    polaroids: [
      { label: "TIME ALPHA", alt: "Time Alpha" },
      { label: "ESCRITÓRIO", alt: "Escritório Alpha" },
      { label: "NOSSA CULTURA", alt: "Nossa Cultura Alpha" },
    ],
  },

  method: {
    sectionLabel: "O MÉTODO ALPHA",
    subtitle:
      "Se você seguir, irá manter seu negócio faturando todos os dias.",
    labels: ["Engajamento", "Retenção", "Ativação", "Aquisição", "Indicação"],
    badge: "Monetização",
    // TODO: confirmar com cliente se vídeo (.mp4 loop) ou animação SVG
  },

  services: {
    sectionLabel: "O QUE FAZEMOS?",
    cards: [
      {
        title: "Cardápio Digital",
        bullets: [
          "Estruturamos todo o seu cardápio digital, desde o layout até os itens",
          "Aumentamos seu ticket médio para ter maior margem de lucro, utilizando uma estratégia validada",
          "Maior conversão de clientes através de hierarquia visual, produtos âncora e campanhas sazonais",
        ],
      },
      {
        title: "Disparo de Mensagens Inteligente",
        bullets: [
          "Campanhas automáticas de vendas: promoções, combos e novidades direto no WhatsApp do seu cliente",
          "Reativação de clientes antigos: trazemos de volta quem já comprou e parou de pedir",
        ],
      },
      {
        title: "Gestão e Atendimento",
        bullets: [], // TODO: extrair bullets da LP original (navegar carrossel)
      },
      {
        title: "Mídia Paga",
        bullets: [], // TODO: extrair bullets da LP original
      },
      {
        title: "Soluções Comerciais",
        bullets: [], // TODO: extrair bullets da LP original
      },
      {
        title: "Vídeos",
        bullets: [], // TODO: extrair bullets da LP original
      },
      {
        title: "Acompanhamento",
        bullets: [], // TODO: extrair bullets da LP original
      },
    ],
  },

  plans: {
    sectionLabel: "PLANOS PERSONALIZADOS",
    paragraph:
      "Oferecemos nossos serviços por planos flexíveis. Você escolhe conforme sua condição atual. O mais importante é continuar apostando em estratégias que trazem resultado.",
  },

  teamCta: {
    sectionLabel: "RECEBA UM TIME EXCLUSIVO",
    paragraph:
      "Tenha um time de especialistas ao seu lado ou terceirize totalmente seu marketing e setor comercial com a Alpha. Sem dor de cabeça com contratações, gestão de equipe, riscos trabalhistas ou burocracias — você foca no seu restaurante, e a gente foca em fazer ele crescer.",
    cta: "Quero mais informações",
    onlineIndicator: "Especialistas online agora",
  },

  faq: {
    title: "PERGUNTAS FREQUENTES",
    subtitle:
      "Ficou com alguma dúvida sobre a Alpha? Talvez ela esteja aqui.",
    items: [
      {
        question: "O que exatamente a Alpha faz?",
        answer:
          "Somos uma assessoria especializada em marketing gastronômico. Ajudamos restaurantes, pizzarias, hamburguerias e negócios de alimentação a vender mais por meio de estratégias como tráfego pago, gestão de iFood, disparo de mensagens, criação de criativos e estruturação do comercial.",
      },
      {
        question: "Posso cancelar quando quiser?",
        answer:
          "Sim, você pode cancelar sua assinatura a qualquer momento.",
      },
      {
        question: "Em quanto tempo vou ver resultados?",
        answer:
          "Depende do estágio atual do seu negócio, estrutura interna e investimento. Mas, na maioria dos casos, nossos clientes começam a sentir o impacto positivo nas vendas em 30 a 60 dias.",
      },
      {
        question: "Vocês atendem qualquer tipo de restaurante?",
        answer:
          "Atendemos desde pequenas operações até grandes redes, desde que estejam dispostas a seguir um plano estratégico de crescimento. Inclusive, temos um núcleo especializado para negócios que faturam acima de R$200 mil/mês: o Alpha X.",
      },
      {
        question: "A Alpha cuida do meu Instagram e redes sociais?",
        answer:
          "Sim, mas com foco em performance. Não somos uma empresa de 'post bonitinho'. Nosso objetivo é transformar conteúdo e anúncios em vendas reais. Se não gerar resultado, não faz sentido estar ali.",
      },
    ],
  },

  footer: {
    copyright: "2025 © Assessoria Alpha. CNPJ: 48.684.183/0001-38",
    socials: {
      instagram: "https://www.instagram.com/assessorialpha/",
      tiktok: "", // TODO: confirmar URL com cliente
      linkedin: "https://www.linkedin.com/company/assessoria-alpha/",
    },
  },
} as const;
