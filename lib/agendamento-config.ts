// Fonte única das regras de agendamento: front e API leem daqui.
export const agendamentoConfig = {
  timezone: "America/Sao_Paulo",
  // Grade de 30 em 30 min a partir do início de cada período (:00 e :30).
  slotMinutes: 30,
  meetingMinutes: 30,
  // Intervalos [início, fim): o último horário de cada período é fim − slotMinutes.
  // Os nomes exibidos ficam em content.agendamento.pagina.periodos (chave = id).
  periods: [
    { id: "manha", start: "08:00", end: "12:00" },
    { id: "tarde", start: "13:00", end: "18:00" },
    { id: "noite", start: "18:00", end: "22:00" },
  ],
  // Hoje conta como um dos dias mostrados (se ainda tiver horário).
  daysToShow: 3,
  // Só aparece (e só é aceito no POST) horário que começa em >= agora + isso.
  minNoticeMinutes: 30,
  // 0 = domingo ... 6 = sábado (Date#getUTCDay). Seg a sáb; domingo (0) nunca entra.
  businessDays: [1, 2, 3, 4, 5, 6],
  // Dias bloqueados (YYYY-MM-DD). Vazio a pedido: feriado aparece como um dia normal.
  holidays: [] as readonly string[],
  // Teto de dias corridos para achar `daysToShow` dias com horário.
  maxLookaheadDays: 21,
  // "all" | "externalOnly" | "none": quem recebe o e-mail de convite do Google.
  sendUpdates: "all",
} as const;

export type AgendamentoConfig = typeof agendamentoConfig;
export type PeriodId = AgendamentoConfig["periods"][number]["id"];
