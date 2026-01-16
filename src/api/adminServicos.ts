import { http } from "./http";

export interface ServicoDTO {
  id: number;
  nome: string;
  preco: number;
  duracaoMinutos: number;
  ativo: boolean;
}

export interface ServicoCreateDTO {
  nome: string;
  preco: number;
  duracaoMinutos: number;
}

export function listarServicosAdmin() {
  return http<ServicoDTO[]>("/servicos");
}

export function criarServicoAdmin(body: ServicoCreateDTO) {
  return http<ServicoDTO>("/servicos", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function atualizarServicoAdmin(id: number, body: ServicoCreateDTO) {
  return http<ServicoDTO>(`/servicos/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function desativarServicoAdmin(id: number) {
  return http<void>(`/servicos/${id}/desativar`, { method: "PATCH" });
}

export function ativarServicoAdmin(id: number) {
  return http<void>(`/servicos/${id}/ativar`, { method: "PATCH" });
}
