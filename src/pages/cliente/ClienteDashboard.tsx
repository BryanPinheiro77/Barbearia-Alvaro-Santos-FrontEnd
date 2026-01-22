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

function parseDateTimeLocal(yyyyMmDd?: string, hhMm?: string) {
  if (!yyyyMmDd || !hhMm) return null;
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  const [hh, mm] = hhMm.split(":").map(Number);
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return new Date(y, m - 1, d, hh, mm, 0, 0);
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

function getCancelamentoInfo(a: AgendamentoApi.Agendamento, limiteHoras: number) {
  if (a.status !== "AGENDADO") {
    return { pode: false, motivo: "Só é possível cancelar agendamentos com status AGENDADO." };
  }

  const dt = parseDateTimeLocal(a.data, a.horarioInicio);
  if (!dt) {
    return { pode: false, motivo: "Não foi possível validar a data/horário do agendamento." };
  }

  const agora = new Date();
  const limiteMs = limiteHoras * 60 * 60 * 1000;
  const diff = dt.getTime() - agora.getTime();

  if (diff <= 0) return { pode: false, motivo: "Este horário já passou." };

  if (diff < limiteMs) {
    return { pode: false, motivo: `Cancelamento permitido até ${limiteHoras} horas antes do horário.` };
  }

  return { pode: true, motivo: "" };
}

export default function ClienteDashboard() {
  const navigate = useNavigate();

  const [agendamentos, setAgendamentos] = useState<AgendamentoApi.Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  const [erro, setErro] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [cancelandoId, setCancelandoId] = useState<number | null>(null);
  const [removendoIds, setRemovendoIds] = useState<number[]>([]);

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

  async function cancelarAgendamento(ag: AgendamentoApi.Agendamento) {
    try {
      setErro(null);
      setInfo(null);

      setCancelandoId(ag.id);

      setRemovendoIds((prev) => (prev.includes(ag.id) ? prev : [...prev, ag.id]));
      await AgendamentoApi.cancelarAgendamento(ag.id);

      if (ag.pago) {
        setInfo("Agendamento cancelado. Entre em contato com o barbeiro para receber o reembolso.");
      }

      window.setTimeout(() => {
        setAgendamentos((prev) => prev.filter((a) => a.id !== ag.id));
        setRemovendoIds((prev) => prev.filter((x) => x !== ag.id));
      }, 180);
    } catch (e) {
      console.error(e);
      setRemovendoIds((prev) => prev.filter((x) => x !== ag.id));
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
            <h1 className="font-display text-3xl mt-3">Meus agendamentos</h1>
            <p className="text-white/70 mt-2">Gerencie seus horários e pagamentos.</p>
          </div>

          <button className="btn-gold" onClick={() => navigate("/cliente/novo-agendamento")}>
            Novo agendamento
          </button>
        </div>

        {erro && <div className="alert-error mb-4">{erro}</div>}

        {info && (
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/85">
            {info}
          </div>
        )}

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

        {!loading && agendamentosFuturos.length === 0 && (
          <div className="card animate-[fadeInUp_.22s_ease-out_forwards] opacity-0">
            <p className="text-white/70 text-sm">Você não possui agendamentos futuros.</p>
            <div className="mt-4">
              <button className="btn-outline" onClick={() => navigate("/cliente/novo-agendamento")}>
                Agendar agora
              </button>
            </div>
          </div>
        )}

        {!loading && agendamentosFuturos.length > 0 && (
          <AnimatedList>
            {agendamentosFuturos.map((a) => {
              const servicosLabel =
                a.servicos?.length ? a.servicos.map((s) => s.nome).join(" + ") : "Serviço";

              const total =
                a.servicos?.length ? a.servicos.reduce((acc, s) => acc + (s.preco ?? 0), 0) : 0;

              // regra: cancela até 5h antes, mesmo pago
              const { pode: podeCancelarPorRegra, motivo } = getCancelamentoInfo(a, 5);
              const podeCancelar = a.status !== "CANCELADO" && podeCancelarPorRegra;

              const estaCancelando = cancelandoId === a.id;
              const removendo = removendoIds.includes(a.id);

              const tooltipCancelar = !podeCancelarPorRegra
                ? motivo
                : a.pago
                ? "Agendamento pago: ao cancelar, entre em contato com o barbeiro para reembolso."
                : "Cancelar agendamento";

              return (
                <div
                  key={a.id}
                  className={[
                    "card transition-all duration-200 ease-out",
                    removendo ? "opacity-0 -translate-y-1 scale-[0.99]" : "opacity-100",
                  ].join(" ")}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{servicosLabel}</p>

                      <p className="text-sm text-white/70 mt-1">
                        {a.data} às {a.horarioInicio}
                      </p>

                      <p className="text-sm text-white/55 mt-1">Total: {brl(total)}</p>
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

                      <div className="mt-4" title={tooltipCancelar}>
                        <button
                          className={[
                            "btn-outline w-full justify-center",
                            !podeCancelar || estaCancelando
                              ? "opacity-60 pointer-events-none"
                              : "",
                          ].join(" ")}
                          onClick={() => cancelarAgendamento(a)}
                        >
                          {estaCancelando ? "Cancelando..." : "Cancelar"}
                        </button>
                      </div>

                      {!podeCancelarPorRegra && (
                        <p className="mt-2 text-xs text-white/55 max-w-[220px]">
                          {motivo}
                        </p>
                      )}
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
