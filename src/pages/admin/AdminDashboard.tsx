import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";

import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

import type { Agendamento } from "../../api/agendamentos";
import * as AdminAgendamentosApi from "../../api/adminAgendamentos";

/* =========================
  Helpers de data
========================= */
function hojeYYYYMMDD() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function addDays(yyyyMmDd: string, delta: number) {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return dt.toISOString().split("T")[0];
}

function rangeLastNDays(n: number) {
  const hoje = hojeYYYYMMDD();
  const inicio = addDays(hoje, -(n - 1));
  return { inicio, fim: hoje };
}

/* =========================
  Mini componentes de gráfico
========================= */
function LineChartMini({
  points,
  height = 120,
}: {
  points: { label: string; value: number }[];
  height?: number;
}) {
  const width = 520;
  const pad = 16;

  const max = Math.max(1, ...points.map((p) => p.value));
  const min = 0;

  const stepX = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0;

  const toXY = (idx: number, val: number) => {
    const x = pad + idx * stepX;
    const y =
      pad + (height - pad * 2) * (1 - (val - min) / (max - min || 1));
    return { x, y };
  };

  const d = points
    .map((p, i) => {
      const { x, y } = toXY(i, p.value);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <line
          x1={pad}
          y1={height - pad}
          x2={width - pad}
          y2={height - pad}
          stroke="currentColor"
          opacity="0.15"
        />
        <path d={d} fill="none" stroke="currentColor" strokeWidth="2" />
        {points.map((p, i) => {
          const { x, y } = toXY(i, p.value);
          return (
            <g key={p.label}>
              <circle cx={x} cy={y} r="3.5" fill="currentColor" />
              <text
                x={x}
                y={height - 4}
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
                opacity="0.55"
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function BarList({
  items,
}: {
  items: { label: string; value: number }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="space-y-2">
      {items.map((it) => {
        const pct = Math.round((it.value / max) * 100);
        return (
          <div key={it.label} className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted truncate">{it.label}</p>
              <p className="text-xs text-muted">{it.value}</p>
            </div>

            <div className="h-2 rounded bg-[rgba(255,255,255,0.08)] overflow-hidden">
              <div
                className="h-full"
                style={{
                  width: `${pct}%`,
                  background:
                    "linear-gradient(90deg, var(--gold), var(--gold-2), var(--gold))",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* =========================
  Dashboard
========================= */
export default function AdminDashboard() {
  const [dataFiltro, setDataFiltro] = useState<string>(hojeYYYYMMDD());
  const [statusFiltro, setStatusFiltro] = useState<string>("");

  const [resumo, setResumo] = useState<Agendamento[]>([]);
  const [insights, setInsights] = useState<Agendamento[]>([]);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    try {
      setLoading(true);
      setErro(null);

      const filtrosResumo: AdminAgendamentosApi.FiltrosAgendamentoAdmin = {};
      if (dataFiltro) filtrosResumo.data = dataFiltro;
      if (statusFiltro) filtrosResumo.status = statusFiltro;

      const r30 = rangeLastNDays(30);
      const filtrosInsights: AdminAgendamentosApi.FiltrosAgendamentoAdmin = {
        inicio: r30.inicio,
        fim: r30.fim,
      };

      const [respResumo, respInsights] = await Promise.all([
        AdminAgendamentosApi.listarAgendamentosAdmin(
          Object.keys(filtrosResumo).length ? filtrosResumo : undefined
        ),
        AdminAgendamentosApi.listarAgendamentosAdmin(filtrosInsights),
      ]);

      respResumo.sort((a, b) => {
        const aKey = `${a.data ?? ""} ${a.horarioInicio ?? ""}`;
        const bKey = `${b.data ?? ""} ${b.horarioInicio ?? ""}`;
        return aKey.localeCompare(bKey);
      });

      setResumo(respResumo);
      setInsights(respInsights);
    } catch (e) {
      console.error(e);
      setErro("Erro ao carregar o dashboard.");
      setResumo([]);
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function limparFiltros() {
    const hoje = hojeYYYYMMDD();
    setDataFiltro(hoje);
    setStatusFiltro("");
    setTimeout(() => carregar(), 0);
  }

  const kpis = useMemo(() => {
    const total = resumo.length;
    const agendado = resumo.filter((a) => a.status === "AGENDADO").length;
    const concluido = resumo.filter((a) => a.status === "CONCLUIDO").length;
    const cancelado = resumo.filter((a) => a.status === "CANCELADO").length;
    return { total, agendado, concluido, cancelado };
  }, [resumo]);

  const line14 = useMemo(() => {
    const r14 = rangeLastNDays(14);

    const map = new Map<string, number>();
    for (let i = 0; i < 14; i++) {
      const d = addDays(r14.inicio, i);
      map.set(d, 0);
    }

    insights.forEach((a) => {
      const d = a.data ?? "";
      if (d >= r14.inicio && d <= r14.fim) {
        map.set(d, (map.get(d) ?? 0) + 1);
      }
    });

    return Array.from(map.entries()).map(([date, value]) => {
      const dd = date.slice(8, 10);
      const mm = date.slice(5, 7);
      return { label: `${dd}/${mm}`, value };
    });
  }, [insights]);

  const topServicos = useMemo(() => {
    const freq = new Map<string, number>();
    insights.forEach((a) => {
      (a.servicos ?? []).forEach((s) => {
        const nome = s.nome ?? "Serviço";
        freq.set(nome, (freq.get(nome) ?? 0) + 1);
      });
    });

    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value]) => ({ label, value }));
  }, [insights]);

  const topPagamentos = useMemo(() => {
    const freq = new Map<string, number>();

    insights.forEach((a: any) => {
      const tipo = a.formaPagamentoTipo ?? "Não informado";
      const modo = a.formaPagamentoModo
        ? a.formaPagamentoModo === "ONLINE"
          ? "Online"
          : "Presencial"
        : "";
      const label = modo ? `${tipo} (${modo})` : String(tipo);
      freq.set(label, (freq.get(label) ?? 0) + 1);
    });

    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));
  }, [insights]);

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard (Admin)</h1>
          <p className="text-sm text-muted">
            Visão rápida (últimos 14/30 dias). Detalhes e filtros avançados ficam
            em “Relatórios”.
          </p>
        </div>
      </div>

      {erro && <div className="alert-error mb-4">{erro}</div>}

      <Card className="mb-4 animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <p className="font-semibold">Resumo (por filtro)</p>
              <p className="text-sm text-muted">
                Por padrão, inicia em <strong>hoje</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:max-w-xl">
              <div>
                <label className="label-dark">Dia</label>
                <input
                  type="date"
                  className="input-dark"
                  value={dataFiltro}
                  onChange={(e) => setDataFiltro(e.target.value)}
                />
              </div>

              <div>
                <label className="label-dark">Status</label>
                <select
                  className="select-dark"
                  value={statusFiltro}
                  onChange={(e) => setStatusFiltro(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="AGENDADO">Agendado</option>
                  <option value="CONCLUIDO">Concluído</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>

              <div className="flex gap-2 items-end">
                <Button
                  variant="primary"
                  onClick={carregar}
                  loading={loading}
                  className="w-full"
                >
                  Aplicar
                </Button>
                <Button
                  variant="secondary"
                  onClick={limparFiltros}
                  className="w-full"
                >
                  Limpar
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <Card className="animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
              <CardContent>
                <p className="text-xs text-muted">Total</p>
                <p className="text-2xl font-bold">{kpis.total}</p>
              </CardContent>
            </Card>

            <Card className="animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
              <CardContent>
                <p className="text-xs text-muted">Agendados</p>
                <p className="text-2xl font-bold">{kpis.agendado}</p>
              </CardContent>
            </Card>

            <Card className="animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
              <CardContent>
                <p className="text-xs text-muted">Concluídos</p>
                <p className="text-2xl font-bold">{kpis.concluido}</p>
              </CardContent>
            </Card>

            <Card className="animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
              <CardContent>
                <p className="text-xs text-muted">Cancelados</p>
                <p className="text-2xl font-bold">{kpis.cancelado}</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold">Agendamentos por dia</p>
              <p className="text-xs text-muted">últimos 14 dias</p>
            </div>

            {loading ? (
              <p className="text-sm text-muted">Carregando gráfico...</p>
            ) : (
              <LineChartMini points={line14} />
            )}
          </CardContent>
        </Card>

        <Card className="animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold">Serviços mais vendidos</p>
              <p className="text-xs text-muted">últimos 30 dias</p>
            </div>

            {topServicos.length === 0 ? (
              <p className="text-sm text-muted">Sem serviços no período.</p>
            ) : (
              <BarList items={topServicos} />
            )}
          </CardContent>
        </Card>

        <Card className="animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold">Formas de pagamento</p>
              <p className="text-xs text-muted">últimos 30 dias</p>
            </div>

            {topPagamentos.length === 0 ? (
              <p className="text-sm text-muted">Sem dados de pagamento.</p>
            ) : (
              <BarList items={topPagamentos} />
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
