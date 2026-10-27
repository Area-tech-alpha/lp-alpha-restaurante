export const content = {
  hero: {
    logoAlt: "Alpha Assessoria",
    headlinePrefix: "Fazemos o seu restaurante vender ",
    headlineHighlight1: "15 reais",
    headlineMiddle: " a cada ",
    headlineHighlight2: "1 real investido",
    headlineSuffix: " em Tráfego Pago.",
    subtitle:
      "Agende uma chamada gratuita e descubra como podemos transformar seu marketing em uma máquina de vendas e novos pedidos.",
    subtitleBullets: ["Marketing focado em VENDAS", "Especialistas no ramo de food"],
    cta: "Quero vender mais",
    formTitle: "Quero vender mais",
    formSubtitle: "Preencha e um especialista da Alpha entra em contato.",
    successMessage:
      "Recebemos seus dados! Nosso time entra em contato em breve.",
  },

  form: {
    fields: {
      nome: { label: "Nome", placeholder: "Seu nome" },
      email: { label: "E-mail", placeholder: "Seu melhor e-mail" },
      telefone: { label: "Telefone", placeholder: "Telefone" },
      empresa: { label: "Empresa", placeholder: "Nome da empresa" },
      cnpj: { label: "CNPJ", placeholder: "00.000.000/0000-00" },
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
          "Pastelaria",
          "Açaí / sorveteria",
          "Cafeteria",
          "Doceria",
          "Gastrobar",
          "Outros",
        ],
      },
      faturamento: {
        label: "Faturamento atual",
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
        label: "Você investiria R$4.000 por mês para vender mais?",
        options: ["Sim", "Não"],
      },
    },
    submitLabel: "Quero vender mais",
  },

  testimonials: {
    sectionLabel: "Depoimentos",
    title: "Quem já investiu com a Alpha, fala por nós",
    subtitle:
      "Restaurantes reais, resultado real com tráfego pago gerido pela nossa equipe.",
    videos: [
      {
        videoId: "aoDx_HTLaWA",
        badgeIcon: "trending-up",
        badgeLabel: "Resultado real",
        name: "Depoimento de cliente Alpha",
        role: "Restaurante parceiro",
      },
      {
        videoId: "XJCYsQPZbCk",
        badgeIcon: "star",
        badgeLabel: "4.9 ★",
        name: "Depoimento de cliente Alpha",
        role: "Restaurante parceiro",
      },
      {
        videoId: "MktAB8hCzwQ",
        badgeIcon: "trending-up",
        badgeLabel: "+280%",
        name: "Depoimento de cliente Alpha",
        role: "Restaurante parceiro",
      },
    ],
  },

  palestrante: {
    sectionLabel: "Na prática",
    title: "Presente nos maiores eventos e salas de aula do food service",
    photos: [
      {
        src: "/lp-06/palestrante/foto-1.webp",
        width: 900,
        height: 1200,
        alt: "Palestrante da Universidade FFM em feira do setor de alimentação",
      },
      {
        src: "/lp-06/palestrante/foto-2.webp",
        width: 900,
        height: 1002,
        alt: "Palestrante conduzindo aula para empresários na Universidade FFM",
      },
      {
        src: "/lp-06/palestrante/foto-3.webp",
        width: 851,
        height: 1280,
        alt: "Palestrante falando ao público no palco da Burger Expo",
      },
    ],
  },

  universidade: {
    sectionLabel: "Universidade FFM",
    // Trecho entre *asteriscos* ganha o destaque dourado.
    title:
      "A única universidade da América Latina que reúne e ensina donos de deliveries, na *teoria e na prática*, o fast food em um só lugar.",
    subtitle:
      "Uma estrutura de ensino com cozinha profissional de alta performance, onde empresários aprendem métodos de gestão e produção e acompanham sua aplicação na prática, para levar soluções reais aos próprios restaurantes.",
    videoId: "elBUZwHueEE",
    videoTitle: "Conheça a Universidade Fast Food Milionário",
    videoRole: "Universidade FFM",
  },

  entregaveis: {
    sectionLabel: "O que você recebe",
    title:
      'Não vendemos "gestão de tráfego". Entregamos um sistema completo de vendas.',
    subtitle:
      "Cada real investido passa pela nossa equipe presencial, do criativo ao relatório de resultado.",
    cards: [
      {
        icon: "users",
        title: "Gestão e atendimento",
        description:
          "Um time da Alpha acompanha seu restaurante de perto, do primeiro contato ao suporte do dia a dia.",
      },
      {
        icon: "target",
        title: "Mídia paga",
        description:
          "Campanhas de Meta e Google Ads geridas e otimizadas pela nossa equipe, não por um robô.",
      },
      {
        icon: "store",
        title: "Soluções comerciais para restaurantes",
        description:
          "Estratégias pensadas pra aumentar ticket médio, recorrência e conversão de mesa, não só clique.",
      },
      {
        icon: "file-bar-chart",
        title: "Relatórios e acompanhamento",
        description:
          "Você acompanha quanto entrou, quanto voltou e o retorno real de cada real investido, sem letra miúda.",
      },
    ],
    roi: {
      label: "O resultado que buscamos em cada campanha",
      prefix: "R$1 investido ",
      highlight: "vira R$15",
      suffix: " em vendas",
    },
  },

  faq: {
    sectionLabel: "Perguntas frequentes",
    title: "Antes de falar com a gente",
    items: [
      {
        question: "Como assim 15 reais pra cada 1 investido?",
        answer:
          "É o retorno que buscamos em campanhas de tráfego pago geridas pela Alpha: pra cada R$1 investido em anúncios, o objetivo é gerar até R$15 em vendas pro seu restaurante, com gestão ativa e otimização constante da nossa equipe.",
      },
      {
        question: "Como funciona a gestão de tráfego pago da Alpha?",
        answer:
          "Nossa equipe presencial cuida de tudo: estratégia, criativos, configuração das campanhas em Meta e Google Ads, e otimização semanal com base em dados reais de venda, não só de clique.",
      },
      {
        question: "Em quanto tempo eu vejo resultado?",
        answer:
          "A maioria dos restaurantes começa a ver impacto real entre 30 e 60 dias após o início da parceria.",
      },
      {
        question: "Preciso ter equipe de marketing própria?",
        answer:
          "Não. A Alpha assume a operação de tráfego pago do zero, com sua própria equipe e estrutura.",
      },
      {
        question: "A Alpha atende qualquer segmento de restaurante?",
        answer:
          "Sim. Atendemos pizzarias, hamburguerias, churrascarias, restaurantes japoneses, cafeterias, doçarias e praticamente qualquer segmento gastronômico.",
      },
      {
        question: "Como sei se meu restaurante está pronto pra investir?",
        answer:
          "Como nosso trabalho é seletivo, o primeiro passo é conversar com nosso time. Preencha o formulário acima e agendamos um diagnóstico gratuito.",
      },
    ],
  },

  ctaFinal: {
    eyebrow: "Chega de deixar dinheiro na mesa",
    headlinePrefix: "Pronto pra fazer o seu restaurante vender ",
    headlineHighlight1: "15 reais",
    headlineMiddle: " a cada ",
    headlineHighlight2: "1 real investido",
    headlineSuffix: "?",
    paragraph:
      "Preencha o formulário e fale agora com um especialista da Alpha. Vaga limitada por região, por causa da nossa estrutura 100% presencial.",
    cta: "Quero vender mais",
  },

  floatCta: {
    cta: "Quero vender 15x mais",
  },

  // Variações com layout "agendamento" (lp-09): estrutura inspirada na LP da
  // Laquila, form -> escolha de horário -> evento no Google Agenda do closer.
  agendamento: {
    hero: {
      subtitle:
        "Somos a engrenagem invisível dos maiores restaurantes do Brasil. Fale com um especialista e descubra o método que a Alpha aplica todos os dias, dentro do food service.",
      cta: "Falar com um especialista",
      // TODO(design): foto definitiva do hero. Provisória: polaroids do time Alpha.
      image: {
        src: "/Imagem2-1.webp",
        width: 468,
        height: 1069,
        alt: "Time Alpha, escritório e cultura da Assessoria Alpha",
      },
    },
    // Números da LP original da Alpha (docs/SPEC.md §2).
    // TODO(marketing): confirmar se continuam atuais antes do go-live.
    marquee: [
      "+600 restaurantes atendidos",
      "+500M em vendas para os nossos clientes",
      "+5 anos de experiência",
    ],
    formBlock: {
      eyebrow: "Atenção",
      title: "Faltam poucos segundos para você mudar a realidade do seu restaurante",
      steps: [
        {
          title: "Complete o formulário",
          description:
            "Preencha suas informações ao lado. Seus dados ficam seguros e serão usados apenas para o nosso contato.",
        },
        {
          title: "Escolha o melhor horário",
          description:
            "Na próxima tela você escolhe o dia e a hora da sua sessão com um especialista em marketing gastronômico.",
        },
      ],
      formTitle: "Falar com um especialista",
      formSubtitle: "Leva menos de 1 minuto.",
      submitLabel: "Escolher meu horário",
      fields: {
        telefone: { label: "WhatsApp", placeholder: "WhatsApp" },
        // empresa vira o título da reunião no Google Agenda.
        empresa: { label: "Nome do restaurante", placeholder: "Nome do seu restaurante" },
      },
    },
    testimonials: {
      sectionLabel: "Depoimentos",
      title: "Restaurantes com resultado. Isso é Alpha.",
    },
    oQueFazemos: {
      sectionLabel: "O que fazemos",
      title: "A Alpha estrutura o marketing do seu restaurante a partir da sua necessidade",
    },
    pagina: {
      metaTitle: "Agendamento | Assessoria Alpha",
      brand: "Assessoria Alpha",
      pill: "Agendamento estratégico",
      title: "Escolha o melhor horário para conversar com a Alpha.",
      subtitle:
        "Agende uma sessão com um dos nossos especialistas e descubra o método criado dentro do food service, pensado para restaurantes que querem previsibilidade de vendas.",
      chips: [
        "Especialistas em marketing gastronômico",
        "Diagnóstico personalizado",
        "Próximos passos claros",
      ],
      cardTitle: "Escolha o melhor dia e hora",
      timezoneLabel: "Horário de Brasília",
      loading: "Carregando horários…",
      empty: "Nenhum horário disponível nos próximos dias. Nosso time vai entrar em contato com você.",
      selectedLabel: "Horário selecionado:",
      confirm: "Confirmar agendamento",
      confirming: "Confirmando…",
      successTitle: "Reunião confirmada!",
      successText:
        "Enviamos o convite com o link do Google Meet para o seu e-mail. Até lá!",
      alreadyScheduledTitle: "Você já tem uma reunião agendada",
      errors: {
        generic: "Não foi possível concluir o agendamento. Tente novamente.",
        load: "Não foi possível carregar os horários. Tente novamente.",
        slotTaken: "Esse horário acabou de ser preenchido, escolha outro.",
        leadNotFound: "Não encontramos o seu cadastro. Preencha o formulário novamente.",
        retry: "Tentar novamente",
      },
    },
  },

  footer: {
    logoAlt: "Alpha Assessoria",
    copyright: "Alpha Assessoria. Todos os direitos reservados.",
    // usados só no JSON-LD (Organization.sameAs) — o rodapé da nova LP não
    // exibe ícones sociais.
    socials: {
      instagram: "https://www.instagram.com/assessorialpha/",
      linkedin: "https://www.linkedin.com/company/assessoria-alpha/",
    },
  },
} as const;
