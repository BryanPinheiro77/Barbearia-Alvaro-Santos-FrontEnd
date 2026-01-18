import type { Agendamento } from "../api/agendamentos";
import { Card, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

interface Props {
  agendamento: Agendamento;
  onConcluir?: (id: number) => void;
  onCancelar?: (id: number) => void;
}

function formatarPagamento(ag: Agendamento) {
  const meio = ag.formaPagamentoTipo;
  const modo = ag.formaPagamentoModo;
  if (!meio || !modo) return "Não informado";
  const modoLabel = modo === "ONLINE" ? "Online" : "Presencial";
  return `${meio} (${modoLabel})`;
}

export function AgendamentoCard({ agendamento, onConcluir, onCancelar }: Props) {
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
  const podeAcao = agendamento.status === "AGENDADO" && (onConcluir || onCancelar);

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
            {onConcluir && (
              <Button variant="primary" onClick={() => onConcluir(agendamento.id)}>
                Concluir
              </Button>
            )}

            {onCancelar && (
              <Button variant="danger" onClick={() => onCancelar(agendamento.id)}>
                Cancelar
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
