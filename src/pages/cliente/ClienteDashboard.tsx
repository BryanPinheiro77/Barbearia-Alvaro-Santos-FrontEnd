import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppShell } from "../../components/layout/AppShell";
import * as AgendamentoApi from "../../api/agendamentos";

import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { AnimatedList } from "../../components/ui/AnimatedList";

export default function ClienteDashboard() {
  const navigate = useNavigate();

  const [agendamentos, setAgendamentos] = useState<AgendamentoApi.Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [cancelandoId, setCancelandoId] = useState<number | null>(null);
  const [removendoIds, setRemovendoIds] = useState<number[]>([]); // para animação de saída

  async function carregar() {
    try {
      setErro(null);
      setLoading(true);
      const data = await AgendamentoApi.listarMeusAgendamentos();
      setAgendamentos(data);
    } catch (err) {
      console.error("Erro ao carregar agendamentos", err);
      setErro("Erro ao carregar seus agendamentos.");
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

  const agendamentosFuturos = useMemo(() => {
    const hoje0 = inicioDeHoje();

    return agendamentos
      .filter((a) => a.status !== "CANCELADO")
      .filter((a) => {
        if (!a.data) return false;
        const dt = parseDataLocal(a.data);
        return dt.getTime() >= hoje0.getTime();
      })
      .sort((a, b) => {
        const da = parseDataLocal(a.data).getTime();
        const db = parseDataLocal(b.data).getTime();
        if (da !== db) return da - db;

        const ha = a.horarioInicio ?? "";
        const hb = b.horarioInicio ?? "";
        return ha.localeCompare(hb);
      });
  }, [agendamentos]);

  async function cancelarAgendamento(id: number) {
    // Sem confirm: cancela direto
    try {
      setErro(null);
      setCancelandoId(id);

      // inicia animação de saída
      setRemovendoIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

      await AgendamentoApi.cancelarAgendamento(id);

      // espera o tempo da transição antes de remover do estado
      window.setTimeout(() => {
        setAgendamentos((prev) => prev.filter((a) => a.id !== id));
        setRemovendoIds((prev) => prev.filter((x) => x !== id));
      }, 180);
    } catch (e) {
      console.error(e);
      // se der erro, reverte animação
      setRemovendoIds((prev) => prev.filter((x) => x !== id));
      setErro("Não foi possível cancelar o agendamento. Tente novamente.");
    } finally {
      setCancelandoId(null);
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h1 className="text-2xl font-bold">Meus Agendamentos</h1>
      </div>

      {erro && (
        <div className="mb-4 bg-red-100 border border-red-300 p-3 rounded">
          {erro}
        </div>
      )}

      <div className="mb-6">
        <Button variant="primary" onClick={() => navigate("/cliente/novo-agendamento")}>
          Novo Agendamento
        </Button>
      </div>

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

      {!loading && agendamentosFuturos.length === 0 && (
        <Card className="animate-[fadeInUp_.22s_ease-out_forwards] opacity-0">
          <CardContent>
            <p className="text-sm text-gray-700">Você não possui agendamentos futuros.</p>
            <div className="mt-3">
              <Button
                variant="secondary"
                onClick={() => navigate("/cliente/novo-agendamento")}
              >
                Agendar agora
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && agendamentosFuturos.length > 0 && (
        <AnimatedList>
          {agendamentosFuturos.map((a) => {
            const servicosLabel =
              a.servicos?.length ? a.servicos.map((s) => s.nome).join(" + ") : "Serviço";

            const total =
              a.servicos?.length ? a.servicos.reduce((acc, s) => acc + (s.preco ?? 0), 0) : 0;

            const podeCancelar = a.status !== "CANCELADO" && !a.pago;
            const estaCancelando = cancelandoId === a.id;

            const toneStatus: "neutral" | "danger" =
              a.status === "CANCELADO" ? "danger" : "neutral";
            const tonePago: "success" | "warning" = a.pago ? "success" : "warning";

            const removendo = removendoIds.includes(a.id);

            return (
              <Card
                key={a.id}
                className={[
                  "overflow-hidden transition-all duration-200 ease-out",
                  removendo ? "opacity-0 -translate-y-1 scale-[0.99]" : "opacity-100",
                ].join(" ")}
              >
                <CardContent className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{servicosLabel}</p>

                    <p className="text-sm text-gray-700">
                      {a.data} às {a.horarioInicio}
                    </p>

                    <p className="text-sm text-gray-500">Total: R$ {total.toFixed(2)}</p>
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
