import { http } from "./http";

export type Horario = {
  id: number;
  horario: string; // "HH:mm:ss" ou "HH:mm"
  ativo: boolean;
};

export type HorarioCreateRequest = {
  horario: string; // "HH:mm"
};

export function listarHorariosAdmin() {
  return http<Horario[]>("/admin/horarios");
}

export function criarHorarioAdmin(body: HorarioCreateRequest) {
  return http<Horario>("/admin/horarios", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function ativarHorarioAdmin(id: number) {
  return http<void>(`/admin/horarios/${id}/ativar`, { method: "PATCH" });
}

export function desativarHorarioAdmin(id: number) {
  return http<void>(`/admin/horarios/${id}/desativar`, { method: "PATCH" });
}

export function deletarHorarioAdmin(id: number) {
  return http<void>(`/admin/horarios/${id}`, { method: "DELETE" });
}

export function atualizarHorarioAdmin(id: number, body: HorarioCreateRequest) {
  return http<Horario>(`/admin/horarios/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

