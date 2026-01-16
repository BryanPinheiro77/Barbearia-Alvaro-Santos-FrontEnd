import { http } from "./http";

export interface Servico {
  id: number;
  nome: string;
  duracaoMinutos: number;
  preco: number;
}

export function listarServicosAtivos() {
  return http<Servico[]>("/servicos/ativos");
}

export function listarTodosServicos() {
  return http<Servico[]>("/servicos");
}
