import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppShell } from "../../components/layout/AppShell";
import * as AgendamentoApi from "../../api/agendamentos";

import { Skeleton } from "../../components/ui/Skeleton";
import { AnimatedList } from "../../components/ui/AnimatedList";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseDataLocal(yyyyMmDd: string) {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function inicioDeHoje() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

function statusPill(status: string) {
  if (status === "CANCELADO") return "border-red-500/25 bg-red-500/10 text-red-200";
  return "border-white/10 bg-white/5 text-white/80";
}

function pagoPill(pago: boolean) {
  return pago
    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
    : "border-amber-500/25 bg-amber-500/10 text-amber-200";
}

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
      <div className="container-page py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <span className="tag">Cliente</span>
            <h1 className="font-display text-3xl mt-3">Histórico</h1>
            <p className="text-white/70 mt-2">Todos os seus agendamentos, incluindo cancelados.</p>
          </div>

          <button className="btn-outline" onClick={() => navigate("/cliente")}>
            Voltar
          </button>
        </div>

        {erro && <div className="alert-error mb-4">{erro}</div>}

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="card">
                <div className="flex justify-between items-start gap-4">
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
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && historicoOrdenado.length === 0 && (
          <div className="card animate-[fadeInUp_.22s_ease-out_forwards] opacity-0">
            <p className="text-white/70 text-sm">Você ainda não possui agendamentos.</p>
            <div className="mt-4">
              <button className="btn-gold" onClick={() => navigate("/cliente/novo-agendamento")}>
                Fazer um agendamento
              </button>
            </div>
          </div>
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

              return (
                <div key={a.id} className="card">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{servicosLabel}</p>

                      <p className="text-sm text-white/70 mt-1">
                        {a.data} às {a.horarioInicio}
                      </p>

                      <p className="text-sm text-white/55 mt-1">Total: {brl(total)}</p>

                      {a.status === "CANCELADO" && (
                        <p className="text-xs text-red-300 mt-3">Agendamento cancelado</p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={[
                            "text-xs px-3 py-1 rounded-full border",
                            statusPill(a.status),
                          ].join(" ")}
                        >
                          {a.status}
                        </span>

                        <span
                          className={[
                            "text-xs px-3 py-1 rounded-full border",
                            pagoPill(!!a.pago),
                          ].join(" ")}
                        >
                          {a.pago ? "Pago" : "Não pago"}
                        </span>
                      </div>

                      <div className="mt-4">
                        <button
                          className={[
                            "btn-outline w-full justify-center",
                            !podeCancelar || estaCancelando ? "opacity-60 pointer-events-none" : "",
                          ].join(" ")}
                          onClick={() => cancelarAgendamento(a.id)}
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
                          {estaCancelando ? "Cancelando..." : "Cancelar"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </AnimatedList>
        )}
      </div>
    </AppShell>
  );
}
