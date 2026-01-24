import { http } from "./http";

export type ClienteAdmin = {
  id: number;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  criadoEm?: string | null;
};

export async function listarClientesAdmin(): Promise<ClienteAdmin[]> {
  return http<ClienteAdmin[]>("/clientes");
}

// ✅ editar só nome e telefone
export async function atualizarClienteAdmin(
  id: number,
  payload: { nome: string; telefone: string | null }
): Promise<ClienteAdmin> {
  return http<ClienteAdmin>(`/clientes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// ✅ excluir
export async function excluirClienteAdmin(id: number): Promise<void> {
  return http<void>(`/clientes/${id}`, { method: "DELETE" });
}
