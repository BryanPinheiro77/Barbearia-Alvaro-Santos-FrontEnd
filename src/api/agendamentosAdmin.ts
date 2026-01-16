// src/api/adminAgendamentos.ts
import { http } from "./http";
import type { Agendamento } from "./agendamentos";

export interface FiltrosAgendamentoAdmin {
  status?: string;
  inicio?: string;
  fim?: string;
  clienteId?: number;
  data?: string; // dia específico (YYYY-MM-DD)
}

function buildQuery(filtros?: FiltrosAgendamentoAdmin) {
  const params = new URLSearchParams();

  if (!filtros) return "";

  if (filtros.status) params.append("status", filtros.status);
  if (filtros.inicio) params.append("inicio", filtros.inicio);
  if (filtros.fim) params.append("fim", filtros.fim);
  if (typeof filtros.clienteId === "number") params.append("clienteId", String(filtros.clienteId));
  if (filtros.data) params.append("data", filtros.data);

  const q = params.toString();
  return q ? `?${q}` : "";
}

/**
 * Lista agendamentos no contexto ADMIN.
 * Endpoint: GET /admin/agendamentos (com query opcional)
 */
export function listarAgendamentosAdmin(filtros?: FiltrosAgendamentoAdmin) {
  const query = buildQuery(filtros);
  return http<Agendamento[]>(`/admin/agendamentos${query}`);
}

/**
 * Conveniências para o dashboard/admin (sem depender de endpoints públicos)
 */
export function listarAgendamentosPorDiaAdmin(data: string, status?: string) {
  return listarAgendamentosAdmin({ data, status });
}

export function listarAgendamentosPorStatusAdmin(status: string) {
  return listarAgendamentosAdmin({ status });
}

export function concluirAgendamentoAdmin(id: number) {
  return http<void>(`/admin/agendamentos/${id}/concluir`, { method: "PATCH" });
}

export function cancelarAgendamentoAdmin(id: number) {
  return http<void>(`/admin/agendamentos/${id}/cancelar`, { method: "PATCH" });
}
