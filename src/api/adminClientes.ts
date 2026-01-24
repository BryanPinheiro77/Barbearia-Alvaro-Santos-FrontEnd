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
