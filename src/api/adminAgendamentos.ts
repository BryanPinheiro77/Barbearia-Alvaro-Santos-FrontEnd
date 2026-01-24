import { http } from "./http";
import type { Agendamento } from "./agendamentos";

export interface FiltrosAgendamentoAdmin {
  status?: string;
  inicio?: string;
  fim?: string;
  clienteId?: number;
  data?: string;
}

export type FormaPagamentoTipo = "PIX" | "CARTAO" | "DINHEIRO";
export type FormaPagamentoModo = "PAGAR_NA_HORA"; // admin SEM ONLINE

export type AdminAgendamentoCreateRequest = {
  clienteId?: number | null;         // opcional (se tiver)
  clienteNome: string;               // obrigatório
  clienteTelefone?: string | null;   // opcional

  servicosIds: number[];
  data: string;                      // "YYYY-MM-DD"
  horarioInicio: string;             // "HH:mm"

  formaPagamentoTipo: FormaPagamentoTipo;
  formaPagamentoModo: FormaPagamentoModo; // sempre PAGAR_NA_HORA

  pago?: boolean | null;             // barbeiro marca
};

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

export function criarAgendamentoAdmin(payload: AdminAgendamentoCreateRequest) {
  // garantia: admin não usa online
  const body: AdminAgendamentoCreateRequest = {
    ...payload,
    formaPagamentoModo: "PAGAR_NA_HORA",
  };

  return http<Agendamento>(`/admin/agendamentos`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function concluirAgendamentoAdmin(id: number) {
  return http<void>(`/admin/agendamentos/${id}/concluir`, { method: "PATCH" });
}

export function cancelarAgendamentoAdmin(id: number) {
  return http<void>(`/admin/agendamentos/${id}/cancelar`, { method: "PATCH" });
}
