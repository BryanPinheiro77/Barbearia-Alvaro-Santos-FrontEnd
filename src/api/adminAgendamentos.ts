import { http } from "./http";
import type { Agendamento } from "./agendamentos";

export interface FiltrosAgendamentoAdmin {
  status?: string;
  inicio?: string;
  fim?: string;
  clienteId?: number;
  data?: string;
}

export function listarAgendamentosAdmin(filtros?: FiltrosAgendamentoAdmin) {
  const params = new URLSearchParams();

  if (filtros?.status) params.append("status", filtros.status);
  if (filtros?.inicio) params.append("inicio", filtros.inicio);
  if (filtros?.fim) params.append("fim", filtros.fim);
  if (filtros?.clienteId) params.append("clienteId", String(filtros.clienteId));
  if (filtros?.data) params.append("data", filtros.data);

  const query = params.toString();
  const url = query ? `/admin/agendamentos?${query}` : `/admin/agendamentos`;

  return http<Agendamento[]>(url);
}

export function concluirAgendamentoAdmin(id: number) {
  return http<void>(`/admin/agendamentos/${id}/concluir`, { method: "PATCH" });
}

export function cancelarAgendamentoAdmin(id: number) {
  return http<void>(`/admin/agendamentos/${id}/cancelar`, { method: "PATCH" });
}
