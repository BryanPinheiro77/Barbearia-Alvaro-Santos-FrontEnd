import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppShell } from "../../components/layout/AppShell";
import * as AgendamentoApi from "../../api/agendamentos";

import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { AnimatedList } from "../../components/ui/AnimatedList";

export default function ClienteHistorico() {
  const navigate = useNavigate();

  const [agendamentos, setAgendamentos] = useState<AgendamentoApi.Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [cancelandoId, setCancelandoId] = useState<number | null>(null);

  async function carregar() {
    try {
      setErro(null);
      setLoading(true);
      const data = await AgendamentoApi.listarMeusAgendamentos();
      setAgendamentos(data);
    } catch (err) {
      console.error("Erro ao carregar histórico", err);
      setErro("Erro ao carregar seu histórico.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function parseDataLocal(yyyyMmDd: string) {
    const [y, m, d] = yyyyMmDd.split("-").map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }

  function inicioDeHoje() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  }

  const historicoOrdenado = useMemo(() => {
    return [...agendamentos].sort((a, b) => {
      const da = a.data ? parseDataLocal(a.data).getTime() : 0;
      const db = b.data ? parseDataLocal(b.data).getTime() : 0;
      if (da !== db) return db - da;

      const ha = a.horarioInicio ?? "";
      const hb = b.horarioInicio ?? "";
      return hb.localeCompare(ha);
    });
  }, [agendamentos]);

  async function cancelarAgendamento(id: number) {
    // Sem confirm: cancela direto (mas mantendo as regras)
    try {
      setErro(null);
      setCancelandoId(id);

      await AgendamentoApi.cancelarAgendamento(id);

      setAgendamentos((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "CANCELADO" } : a))
      );
    } catch (e) {
      console.error(e);
      setErro("Não foi possível cancelar o agendamento. Tente novamente.");
    } finally {
      setCancelandoId(null);
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h1 className="text-2xl font-bold">Histórico</h1>

        <Button variant="secondary" onClick={() => navigate("/cliente")}>
          Voltar
        </Button>
      </div>

      {erro && (
        <div className="mb-4 bg-red-100 border border-red-300 p-3 rounded">
          {erro}
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Card key={n}>
              <CardContent className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <Skeleton className="h-4 w-44 mb-2" />
                  <Skeleton className="h-3 w-56 mb-2" />
                  <Skeleton className="h-3 w-28" />
                </div>

                <div className="w-28 flex flex-col items-end gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-9 w-24 rounded-lg mt-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && historicoOrdenado.length === 0 && (
        <Card className="animate-[fadeInUp_.22s_ease-out_forwards] opacity-0">
          <CardContent>
            <p className="text-sm text-gray-700">Você ainda não possui agendamentos.</p>
            <div className="mt-3">
              <Button variant="primary" onClick={() => navigate("/cliente/novo-agendamento")}>
                Fazer um agendamento
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && historicoOrdenado.length > 0 && (
        <AnimatedList>
          {historicoOrdenado.map((a) => {
            const servicosLabel =
              a.servicos?.length ? a.servicos.map((s) => s.nome).join(" + ") : "Serviço";

            const total =
              a.servicos?.length ? a.servicos.reduce((acc, s) => acc + (s.preco ?? 0), 0) : 0;

            const hoje0 = inicioDeHoje();
            const dataAg = a.data ? parseDataLocal(a.data) : null;
            const naoPassou = dataAg ? dataAg.getTime() >= hoje0.getTime() : false;

            const podeCancelar = a.status !== "CANCELADO" && !a.pago && naoPassou;
            const estaCancelando = cancelandoId === a.id;

            const toneStatus: "neutral" | "danger" =
              a.status === "CANCELADO" ? "danger" : "neutral";

            const tonePago: "success" | "warning" = a.pago ? "success" : "warning";

            return (
              <Card key={a.id} className="overflow-hidden">
                <CardContent className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{servicosLabel}</p>

                    <p className="text-sm text-gray-700">
                      {a.data} às {a.horarioInicio}
                    </p>

                    <p className="text-sm text-gray-500">Total: R$ {total.toFixed(2)}</p>

                    {a.status === "CANCELADO" && (
                      <p className="text-xs text-red-700 mt-2">Agendamento cancelado</p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex flex-col items-end gap-1">
                      <Badge tone={toneStatus}>{a.status}</Badge>
                      <Badge tone={tonePago}>{a.pago ? "Pago" : "Não pago"}</Badge>
                    </div>

                    <div className="mt-3">
                      <Button
                        variant="danger"
                        onClick={() => cancelarAgendamento(a.id)}
                        disabled={!podeCancelar || estaCancelando}
                        loading={estaCancelando}
                        title={
                          a.pago
                            ? "Não é possível cancelar um agendamento pago."
                            : a.status === "CANCELADO"
                            ? "Agendamento já cancelado."
                            : !naoPassou
                            ? "Não é possível cancelar um agendamento passado."
                            : "Cancelar agendamento"
                        }
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </AnimatedList>
      )}
    </AppShell>
  );
}
