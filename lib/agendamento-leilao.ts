import { findLeadEvent } from "@/lib/google-calendar";
import type { LeadAgendamento } from "@/lib/agendamento-token";

// Lead "Agendamento automático" (13/11/2026): o lead qualificado da lp-09 que marca a reunião vai
// ao leilão do Growth Hub, e o franqueado que comprar recebe o lead com a reunião. Diferenças do
// fluxo antigo (SDR da Matriz direto):
// - o envio do form NÃO manda o lead ao CRM. Ele só vai depois de agendar
//   (POST /external/leads/lp/scheduled) ou, se não agendar em 5 min, pelo caminho normal das outras
//   LPs (POST /external/leads/lp, no follow-up do QStash);
// - a reunião nasce na conta genérica AGENDA_ORGANIZER_EMAIL, sem SDR. Quem fica com o lead
//   (comprador ou SDR da fila, se ninguém comprar) recebe o evento na própria agenda pelo Dashcom.
// Liga com AGENDAMENTO_LEILAO_ENABLED=true e exige AGENDA_ORGANIZER_EMAIL. Token emitido antes de
// ligar não tem `flow` e segue o fluxo antigo até expirar (7 dias).

export function leilaoOrganizerEmail(): string | null {
  return process.env.AGENDA_ORGANIZER_EMAIL?.trim() || null;
}

export function isAgendamentoLeilaoEnabled() {
  return process.env.AGENDAMENTO_LEILAO_ENABLED === "true" && !!leilaoOrganizerEmail();
}

export function isLeilaoLead(lead: Pick<LeadAgendamento, "flow">) {
  return lead.flow === "auction";
}

// Reunião do lead na conta genérica. Evento cancelado conta como "já agendou": é o Dashcom que
// tira o evento de lá ao levar a reunião para a agenda do comprador (ou do SDR). `start` vem null
// quando o Google não devolve o horário do evento removido.
export async function findLeilaoLeadEvent(leadKey: string) {
  const organizer = leilaoOrganizerEmail();
  if (!organizer) throw new Error("AGENDA_ORGANIZER_EMAIL não definida");
  return findLeadEvent(organizer, leadKey, { includeCancelled: true });
}
