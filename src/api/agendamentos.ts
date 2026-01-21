import { http } from "./http";

export type StatusAgendamento = "AGENDADO" | "CANCELADO" | "CONCLUIDO";

export interface AgendamentoServico {
  id: number;
  nome: string;
  duracaoMinutos: number;
  preco: number; // pode vir number (recomendado). Se vier string, a UI converte com Number()
}

export interface Agendamento {
  id: number;
  clienteId: number;
  clienteNome: string;

  servicos: AgendamentoServico[];

  data: string; // "YYYY-MM-DD"
  horarioInicio: string; // "HH:mm:ss" ou "HH:mm"
  horarioFim: string;

  formaPagamentoTipo: string;
  formaPagamentoModo: string;
  lembreteMinutos: number;
  status: StatusAgendamento;

  pago: boolean;
}

// Cliente: listar meus agendamentos
export function listarMeusAgendamentos(): Promise<Agendamento[]> {
  return http("/agendamentos/meus", { method: "GET" });
}
// Cliente: cancelar agendamento
export function cancelarAgendamento(id: number) {
  return http(`/agendamentos/${id}/cancelar`, { method: "PATCH" });
}
