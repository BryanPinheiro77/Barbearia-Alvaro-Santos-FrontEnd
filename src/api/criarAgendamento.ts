import { http } from "./http";

export type FormaPagamentoTipo = "PIX" | "CARTAO" | "DINHEIRO";
export type FormaPagamentoModo = "ONLINE" | "PAGAR_NA_HORA";

export interface CriarAgendamentoRequest {
  servicosIds: number[];
  data: string;
  horarioInicio: string;
  formaPagamentoTipo: FormaPagamentoTipo;
  formaPagamentoModo: FormaPagamentoModo;
  lembreteMinutos: number;
}

export interface CriarAgendamentoResponse {
  id: number;
}

export function criarAgendamento(payload: CriarAgendamentoRequest) {
  return http<CriarAgendamentoResponse>("/agendamentos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
