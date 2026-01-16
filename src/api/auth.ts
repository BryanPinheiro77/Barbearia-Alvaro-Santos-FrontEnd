import { http } from "./http";

export type LoginResponse = {
  id: number;
  token: string;
  nome: string;
  tipo: "ADMIN" | "CLIENTE";
};

export async function loginRequest(email: string, senha: string) {
  return http<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, senha }),
  });
}

// ===============================
// REGISTER (CLIENTE)
// ===============================
export type RegisterRequest = {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
};

export type RegisterResponse = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  criadoEm: string; // LocalDateTime vem como string
};

export async function registerRequest(payload: RegisterRequest) {
  return http<RegisterResponse>("/clientes/registrar", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}