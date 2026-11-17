// Fonte única das regras de agendamento: front e API leem daqui.
export const agendamentoConfig = {
  timezone: "America/Sao_Paulo",
  // Grade de 1 em 1 hora a partir do início de cada período (:00).
  slotMinutes: 60,
  meetingMinutes: 30,
  // Intervalos [início, fim): o último horário de cada período é fim − slotMinutes.
  // Os nomes exibidos ficam em content.agendamento.pagina.periodos (chave = id).
  periods: [
    { id: "manha", start: "08:00", end: "12:00" },
    { id: "tarde", start: "13:00", end: "19:00" },
  ],
  // Janela fixa: hoje (se for dia útil e ainda tiver horário) + este nº de próximos
  // dias úteis. Com 1: seg → SEG e TER; seg 19h → só TER; sáb → SÁB e SEG; dom → só SEG.
  // Nunca um terceiro dia, mesmo quando hoje já não tem horário.
  nextBusinessDays: 1,
  // Só aparece (e só é aceito no POST) horário que começa em >= agora + isso.
  minNoticeMinutes: 30,
  // 0 = domingo ... 6 = sábado (Date#getUTCDay). Seg a sáb; domingo (0) nunca entra.
  businessDays: [1, 2, 3, 4, 5, 6],
  // Dias bloqueados (YYYY-MM-DD). Vazio a pedido: feriado aparece como um dia normal.
  holidays: [] as readonly string[],
  // Teto de dias corridos para achar os `nextBusinessDays` dias úteis.
  maxLookaheadDays: 21,
  // "all" | "externalOnly" | "none": quem recebe o e-mail de convite do Google.
  sendUpdates: "all",
} as const;

export type AgendamentoConfig = typeof agendamentoConfig;
export type PeriodId = AgendamentoConfig["periods"][number]["id"];
