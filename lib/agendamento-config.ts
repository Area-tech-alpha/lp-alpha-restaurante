// Fonte única das regras de agendamento. Trocar slotMinutes para 60 basta para
// a grade virar de hora em hora (08:30, 09:30, ...): front e API leem daqui.
export const agendamentoConfig = {
  timezone: "America/Sao_Paulo",
  slotMinutes: 30,
  meetingMinutes: 30,
  firstSlot: "08:30",
  // Último INÍCIO de reunião, não o fim do expediente.
  lastSlotStart: "18:00",
  daysToShow: 3,
  // 0 = domingo ... 6 = sábado (Date#getUTCDay).
  businessDays: [1, 2, 3, 4, 5],
  // Feriados nacionais (YYYY-MM-DD) que caem em dia útil. Manter atualizado
  // anualmente — o freebusy não enxerga feriado se o closer não bloquear a agenda.
  holidays: ["2026-11-02", "2026-11-20", "2026-12-25", "2027-01-01"] as readonly string[],
  // Teto de dias corridos para achar `daysToShow` dias com horário livre
  // (agenda lotada não pode fazer a busca rodar para sempre).
  maxLookaheadDays: 21,
  // "all" | "externalOnly" | "none": quem recebe o e-mail de convite do Google.
  sendUpdates: "all",
} as const;

export type AgendamentoConfig = typeof agendamentoConfig;
