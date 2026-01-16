import { http } from "./http";

interface HorariosDisponiveisResponse {
  data: string;
  horarios: string[];
}

export function listarHorariosDisponiveis(
  data: string,
  servicosIds: number[]
) {
  return http<HorariosDisponiveisResponse>("/agendamentos/horarios-disponiveis", {
    method: "POST",
    body: JSON.stringify({
      data,
      servicosIds,
    }),
  });
}
