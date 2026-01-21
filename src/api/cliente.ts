import { http } from "./http";

export type ClienteMeResponse = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  criadoEm: string;
};

export type ClienteUpdateRequest = {
  nome?: string;
  email?: string;
  telefone?: string;
};

export type ClienteChangePasswordRequest = {
  senhaAtual: string;
  novaSenha: string;
};

export function buscarMe(): Promise<ClienteMeResponse> {
  return http<ClienteMeResponse>("/clientes/me", { method: "GET" });
}

export function atualizarMe(payload: ClienteUpdateRequest): Promise<ClienteMeResponse> {
  return http<ClienteMeResponse>("/clientes/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function trocarSenha(payload: ClienteChangePasswordRequest): Promise<void> {
  return http<void>("/clientes/me/senha", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
