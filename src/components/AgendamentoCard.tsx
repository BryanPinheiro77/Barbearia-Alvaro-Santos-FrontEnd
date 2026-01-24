import type { Agendamento } from "../api/agendamentos";
import { Card, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

interface Props {
  agendamento: Agendamento;
  onConcluir?: (id: number) => void;
  onCancelar?: (id: number) => void;

  // ✅ novo: define regras de cancelamento
  modo?: "ADMIN" | "CLIENTE";

  // ✅ opcional: limite em horas para o cliente (default 2)
  limiteCancelamentoHoras?: number;
}

function formatarPagamento(ag: Agendamento) {
  const meio = ag.formaPagamentoTipo;
  const modo = ag.formaPagamentoModo;
  if (!meio || !modo) return "Não informado";
  const modoLabel = modo === "ONLINE" ? "Online" : "Presencial";
  return `${meio} (${modoLabel})`;
}

function parseDateTimeLocal(yyyyMmDd?: string, hhMm?: string) {
  if (!yyyyMmDd || !hhMm) return null;
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  const [hh, mm] = hhMm.split(":").map(Number);
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

function getCancelamentoInfo(ag: Agendamento, limiteHoras: number) {
  if (ag.status !== "AGENDADO") {
    return { pode: false, motivo: "Só é possível cancelar agendamentos com status AGENDADO." };
  }

  const dt = parseDateTimeLocal(ag.data, ag.horarioInicio);
  if (!dt) {
    return { pode: false, motivo: "Não foi possível validar a data/horário do agendamento." };
  }

  const agora = new Date();
  const limiteMs = limiteHoras * 60 * 60 * 1000;
  const diff = dt.getTime() - agora.getTime();

  if (diff <= 0) {
    return { pode: false, motivo: "Este horário já passou." };
  }

  if (diff < limiteMs) {
    return {
      pode: false,
      motivo: `Cancelamento permitido até ${limiteHoras} horas antes do horário.`,
    };
  }

  return { pode: true, motivo: "" };
}

export function AgendamentoCard({
  agendamento,
  onConcluir,
  onCancelar,
  modo = "ADMIN",
  limiteCancelamentoHoras = 2,
}: Props) {
  const servicosLabel =
    agendamento.servicos?.length
      ? agendamento.servicos.map((s) => s.nome).join(" + ")
      : "Serviço não informado";

  const total = agendamento.servicos?.length
    ? agendamento.servicos.reduce((acc, s) => acc + Number(s.preco ?? 0), 0)
    : 0;

  const toneStatus: "neutral" | "success" | "warning" | "danger" =
    agendamento.status === "CONCLUIDO"
      ? "success"
      : agendamento.status === "CANCELADO"
      ? "danger"
      : "warning";

  const tonePago: "success" | "warning" = agendamento.pago ? "success" : "warning";

  const podeAcao = (onConcluir || onCancelar) && agendamento.status !== "CANCELADO";

  // ✅ Regra do ADMIN: pode cancelar independente do horário (apenas respeita status)
  const podeCancelarAdmin = agendamento.status !== "CONCLUIDO" && agendamento.status !== "CANCELADO";

  // ✅ Regra do CLIENTE: aplica limite de tempo
  const { pode: podeCancelarPorHorario, motivo } = getCancelamentoInfo(
    agendamento,
    limiteCancelamentoHoras
  );
  const podeCancelarCliente = agendamento.status !== "CANCELADO" && podeCancelarPorHorario;

  const podeCancelar = !!onCancelar && (modo === "ADMIN" ? podeCancelarAdmin : podeCancelarCliente);

  const tooltipCancelar =
    modo === "ADMIN"
      ? agendamento.status === "CONCLUIDO"
        ? "Agendamento concluído não pode ser cancelado."
        : "Cancelar agendamento"
      : !podeCancelarPorHorario
      ? motivo
      : agendamento.pago
      ? "Agendamento pago: ao cancelar, entre em contato com o barbeiro para reembolso."
      : "Cancelar agendamento";

  return (
    <Card className="overflow-hidden animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <p className="font-semibold truncate text-white/90">
              {agendamento.clienteNome || "Cliente"}
            </p>
            <Badge tone={toneStatus}>{agendamento.status}</Badge>
            <Badge tone={tonePago}>{agendamento.pago ? "Pago" : "Não pago"}</Badge>
          </div>

          <p className="text-sm text-white/80 break-words">{servicosLabel}</p>

          <p className="text-sm text-white/60 mt-2">
            {agendamento.data} às {agendamento.horarioInicio}
          </p>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <p className="text-white/75">
              <span className="text-white/50">Pagamento:</span>{" "}
              {formatarPagamento(agendamento)}
            </p>

            <p className="text-white/75">
              <span className="text-white/50">Total:</span> R$ {total.toFixed(2)}
            </p>
          </div>
        </div>

        {podeAcao && (
          <div className="flex gap-2 sm:flex-col sm:items-stretch sm:min-w-[180px]">
            {onConcluir && agendamento.status === "AGENDADO" && (
              <Button variant="primary" onClick={() => onConcluir(agendamento.id)}>
                Concluir
              </Button>
            )}

            {onCancelar && (
              <div title={tooltipCancelar}>
                <Button
                  variant="danger"
                  onClick={() => onCancelar(agendamento.id)}
                  disabled={!podeCancelar}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
