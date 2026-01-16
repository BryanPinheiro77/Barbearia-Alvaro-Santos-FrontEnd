import { http } from "./http";

export type TipoPagamentoStrategy = "CHECKOUT_PRO" | "PIX_DIRECT";

export interface PagamentoCreateRequest {
  agendamentoId: number;
  tipoPagamento: "PIX" | "CARTAO"; // online só faz sentido para PIX/CARTAO
  estrategia: TipoPagamentoStrategy;
  servicosIds?: number[]; // opcional
}

export interface PagamentoCreateResponse {
  pagamentoId: number;
  tipoPagamento: string;
  status: string; // PENDENTE / PAGO / etc
  qrCodeBase64: string | null;
  copiaCola: string | null;
  checkoutUrl: string | null;
}

export interface PagamentoListDTO {
  id: number;
  status: string; // PENDENTE / PAGO / CANCELADO / FALHOU...
  metodo: string;
  valor: number;
  criadoEm: string;
  agendamentoId: number;
}

export function criarPagamento(payload: PagamentoCreateRequest) {
  return http<PagamentoCreateResponse>("/pagamentos/criar", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function buscarPagamentoPorId(id: number) {
  return http<PagamentoListDTO>(`/pagamentos/${id}`);
}
