import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";

import type { Agendamento } from "../../api/agendamentos";
import * as AdminAgendamentosApi from "../../api/adminAgendamentos";

// RECHARTS
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type PeriodoTipo = "DIA" | "INTERVALO" | "MES";

function hojeYYYYMMDD() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function rangeDoMes(refYYYYMMDD: string) {
  const [yStr, mStr] = refYYYYMMDD.split("-");
  const y = Number(yStr);
  const m = Number(mStr);

  const first = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0);

  const inicio = first.toISOString().split("T")[0];
  const fim = last.toISOString().split("T")[0];
  return { inicio, fim };
}

function hhmm(h?: string) {
  if (!h) return "";
  return h.length >= 5 ? h.substring(0, 5) : h;
}

/* =========================
   THEME dos gráficos (dark)
========================= */

const CHART_PALETTE = [
  "var(--gold)",
  "var(--gold-2)",
  "#60A5FA", // azul
  "#34D399", // verde
  "#A78BFA", // roxo
  "#F87171", // vermelho
  "#22D3EE", // ciano
  "#FB7185", // rosa
];

const CHART_AXIS_TICK = { fill: "rgba(255,255,255,0.70)", fontSize: 12 };
const CHART_GRID_STROKE = "rgba(255,255,255,0.12)";

const tooltipStyle = {
  contentStyle: {
    background: "rgba(10,10,10,0.92)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
    color: "rgba(255,255,255,0.92)",
  },
  itemStyle: { color: "rgba(255,255,255,0.92)" },
  labelStyle: { color: "rgba(255,255,255,0.75)" },
};

// Garante 1 cor diferente para cada "key" dentro do conjunto atual (Top N)
function buildUniqueColorMap(keys: string[]) {
  const unique = Array.from(new Set(keys)).sort((a, b) => a.localeCompare(b));
  const map: Record<string, string> = {};
  unique.forEach((k, idx) => {
    map[k] = CHART_PALETTE[idx % CHART_PALETTE.length];
  });
  return map;
}

// (opcional) hash para outras áreas; aqui usamos mais nos gráficos de pagamento (se quiser)
function colorForKey(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return CHART_PALETTE[hash % CHART_PALETTE.length];
}

export default function AdminRelatorios() {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [periodo, setPeriodo] = useState<PeriodoTipo>("DIA");

  // DIA / referência do mês
  const [dia, setDia] = useState("");

  // INTERVALO
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");

  const [status, setStatus] = useState("");
  const [clienteBusca, setClienteBusca] = useState("");

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);

  useEffect(() => {
    setDia(hojeYYYYMMDD());
  }, []);

  async function aplicar() {
    try {
      setLoading(true);
      setErro(null);

      let filtros: AdminAgendamentosApi.FiltrosAgendamentoAdmin = {};

      if (status) filtros.status = status;

      if (periodo === "DIA") {
        if (!dia) {
          setErro("Selecione um dia.");
          setAgendamentos([]);
          return;
        }
        filtros.data = dia;
      }

      if (periodo === "MES") {
        if (!dia) {
          setErro("Selecione uma data de referência para o mês.");
          setAgendamentos([]);
          return;
        }
        const r = rangeDoMes(dia);
        filtros.inicio = r.inicio;
        filtros.fim = r.fim;
      }

      if (periodo === "INTERVALO") {
        if (!inicio || !fim) {
          setErro("Informe início e fim do intervalo.");
          setAgendamentos([]);
          return;
        }
        filtros.inicio = inicio;
        filtros.fim = fim;
      }

      const data = await AdminAgendamentosApi.listarAgendamentosAdmin(
        Object.keys(filtros).length ? filtros : undefined
      );

      // Filtro local por nome
      const termo = clienteBusca.trim().toLowerCase();
      let filtrado = data;

      if (termo) {
        filtrado = filtrado.filter((a) =>
          (a.clienteNome || "").toLowerCase().includes(termo)
        );
      }

      filtrado.sort((a, b) => {
        const aKey = `${a.data ?? ""} ${a.horarioInicio ?? ""}`;
        const bKey = `${b.data ?? ""} ${b.horarioInicio ?? ""}`;
        return aKey.localeCompare(bKey);
      });

      setAgendamentos(filtrado);
    } catch (e) {
      console.error(e);
      setErro("Erro ao gerar relatório.");
      setAgendamentos([]);
    } finally {
      setLoading(false);
    }
  }

  function limpar() {
    setPeriodo("DIA");
    setDia(hojeYYYYMMDD());
    setInicio("");
    setFim("");
    setStatus("");
    setClienteBusca("");
    setAgendamentos([]);
    setErro(null);
  }

  const kpis = useMemo(() => {
    const total = agendamentos.length;
    const agendado = agendamentos.filter((a) => a.status === "AGENDADO").length;
    const concluido = agendamentos.filter((a) => a.status === "CONCLUIDO").length;
    const cancelado = agendamentos.filter((a) => a.status === "CANCELADO").length;
    return { total, agendado, concluido, cancelado };
  }, [agendamentos]);

  function toneStatus(s?: string): "neutral" | "success" | "danger" | "warning" {
    if (s === "CONCLUIDO") return "success";
    if (s === "CANCELADO") return "danger";
    if (s === "AGENDADO") return "warning";
    return "neutral";
  }

  // 1) Linha: agendamentos por dia
  const chartAgendamentosPorDia = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of agendamentos) {
      const d = a.data ?? "";
      if (!d) continue;
      map.set(d, (map.get(d) ?? 0) + 1);
    }

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));
  }, [agendamentos]);

  // 2) Barras: horários mais usados (top 10)
  const chartHorariosMaisUsados = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of agendamentos) {
      const h = hhmm(a.horarioInicio);
      if (!h) continue;
      map.set(h, (map.get(h) ?? 0) + 1);
    }

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([hour, count]) => ({ hour, count }));
  }, [agendamentos]);

  // 3) Distribuição: serviços mais escolhidos (top 8)
  const chartServicosMaisUsados = useMemo(() => {
    const map = new Map<string, number>();

    for (const a of agendamentos) {
      const servs = (a as any).servicos ?? [];
      for (const s of servs) {
        const nome = (s?.nome ?? "").trim();
        if (!nome) continue;
        map.set(nome, (map.get(nome) ?? 0) + 1);
      }
    }

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [agendamentos]);

  // mapa de cores único para Serviços (sem colisão)
  const servicoColorMap = useMemo(() => {
    const keys = chartServicosMaisUsados.map((x) => x.name);
    return buildUniqueColorMap(keys);
  }, [chartServicosMaisUsados]);

  // 4) Barras: formas de pagamento mais usadas (top 10)
  const chartFormasPagamento = useMemo(() => {
    const map = new Map<string, number>();

    for (const a of agendamentos) {
      const tipo = (a as any).formaPagamentoTipo ?? "";
      const modo = (a as any).formaPagamentoModo ?? "";

      const labelTipo = tipo ? String(tipo) : "N/I";
      const labelModo =
        modo === "ONLINE" ? "Online" : modo ? "Presencial" : "N/I";

      const key = `${labelTipo} • ${labelModo}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [agendamentos]);

  const temDadosParaGraficos = agendamentos.length > 0;

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-sm text-muted">
            Filtros avançados + KPIs. Aqui entram gráficos e exportação.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={limpar}>
            Limpar
          </Button>
          <Button variant="primary" onClick={aplicar} loading={loading}>
            Aplicar
          </Button>
        </div>
      </div>

      {erro && <div className="alert-error mb-4">{erro}</div>}

      {/* Filtros */}
      <Card className="mb-4 animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
        <CardContent>
          <p className="font-semibold mb-3">Filtros</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="label-dark">Período</label>
              <select
                className="select-dark"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value as PeriodoTipo)}
              >
                <option value="DIA">Dia</option>
                <option value="MES">Mês</option>
                <option value="INTERVALO">Intervalo</option>
              </select>
            </div>

            {(periodo === "DIA" || periodo === "MES") && (
              <div>
                <label className="label-dark">
                  {periodo === "DIA" ? "Data" : "Referência do mês"}
                </label>
                <input
                  type="date"
                  className="input-dark"
                  value={dia}
                  onChange={(e) => setDia(e.target.value)}
                />
              </div>
            )}

            {periodo === "INTERVALO" && (
              <div className="grid grid-cols-2 gap-2 md:col-span-1">
                <div>
                  <label className="label-dark">Início</label>
                  <input
                    type="date"
                    className="input-dark"
                    value={inicio}
                    onChange={(e) => setInicio(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-dark">Fim</label>
                  <input
                    type="date"
                    className="input-dark"
                    value={fim}
                    onChange={(e) => setFim(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="label-dark">Status</label>
              <select
                className="select-dark"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="AGENDADO">Agendado</option>
                <option value="CONCLUIDO">Concluído</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="label-dark">Cliente</label>
              <input
                className="input-dark"
                placeholder="Buscar por nome..."
                value={clienteBusca}
                onChange={(e) => setClienteBusca(e.target.value)}
              />
            </div>

            <div className="md:col-span-3">
              <p className="text-[11px] text-muted">
                Nota: “Cliente” é filtro local (front). Período/Status são filtros no
                back (quando possível).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      {agendamentos.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
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
      )}

      {/* Resultados */}
      <Card className="animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
        <CardContent>
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="font-semibold">Resultados</p>
            {agendamentos.length > 0 && (
              <Badge tone="neutral">{agendamentos.length} itens</Badge>
            )}
          </div>

          {loading && <p className="text-sm text-muted">Gerando relatório...</p>}

          {!loading && agendamentos.length === 0 && (
            <p className="text-sm text-muted">
              Aplique os filtros para ver resultados.
            </p>
          )}

          {!loading && agendamentos.length > 0 && (
            <div className="space-y-2">
              {agendamentos.map((a) => (
                <div
                  key={a.id}
                  className="card p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  style={{ padding: 12 }}
                >
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{a.clienteNome}</p>
                    <p className="text-sm text-muted">
                      {a.data} às {hhmm(a.horarioInicio)}
                    </p>
                  </div>
                  <Badge tone={toneStatus(a.status)}>{a.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* GRÁFICOS */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold">Gráficos</p>
          <Badge tone="neutral">Relatórios</Badge>
        </div>

        {!temDadosParaGraficos && (
          <Card className="animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
            <CardContent>
              <p className="text-sm text-muted">
                Aplique os filtros para gerar os gráficos.
              </p>
            </CardContent>
          </Card>
        )}

        {temDadosParaGraficos && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Linha: agendamentos por dia */}
              <Card className="animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">Agendamentos por dia</p>
                    <Badge tone="neutral">Linha</Badge>
                  </div>

                  {chartAgendamentosPorDia.length === 0 ? (
                    <p className="text-sm text-muted">Sem dados para gerar gráfico.</p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartAgendamentosPorDia}>
                          <CartesianGrid
                            stroke={CHART_GRID_STROKE}
                            strokeDasharray="3 3"
                          />
                          <XAxis
                            dataKey="date"
                            tick={CHART_AXIS_TICK}
                            axisLine={{ stroke: CHART_GRID_STROKE }}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={CHART_AXIS_TICK}
                            axisLine={{ stroke: CHART_GRID_STROKE }}
                          />
                          <Tooltip {...tooltipStyle} />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="var(--gold)"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Barras: horários mais usados */}
              <Card className="animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">Horários mais usados (Top 10)</p>
                    <Badge tone="neutral">Barras</Badge>
                  </div>

                  {chartHorariosMaisUsados.length === 0 ? (
                    <p className="text-sm text-muted">Sem dados para gerar gráfico.</p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartHorariosMaisUsados}>
                          <CartesianGrid
                            stroke={CHART_GRID_STROKE}
                            strokeDasharray="3 3"
                          />
                          <XAxis
                            dataKey="hour"
                            tick={CHART_AXIS_TICK}
                            axisLine={{ stroke: CHART_GRID_STROKE }}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={CHART_AXIS_TICK}
                            axisLine={{ stroke: CHART_GRID_STROKE }}
                          />
                          <Tooltip {...tooltipStyle} />
                          <Bar
                            dataKey="count"
                            fill="var(--gold)"
                            radius={[10, 10, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Pizza: serviços mais usados */}
              <Card className="animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">Serviços mais escolhidos (Top 8)</p>
                    <Badge tone="neutral">Distribuição</Badge>
                  </div>

                  {chartServicosMaisUsados.length === 0 ? (
                    <p className="text-sm text-muted">
                      Sem dados. (Precisa o endpoint devolver “servicos” no agendamento.)
                    </p>
                  ) : (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartServicosMaisUsados}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={90}
                            label
                          >
                            {chartServicosMaisUsados.map((entry, idx) => (
                              <Cell
                                key={idx}
                                fill={servicoColorMap[entry.name] ?? "var(--gold)"}
                              />
                            ))}
                          </Pie>

                          <Tooltip {...tooltipStyle} />
                          <Legend wrapperStyle={{ color: "rgba(255,255,255,0.75)" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Barras: formas de pagamento */}
              <Card className="animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">Formas de pagamento (Top 10)</p>
                    <Badge tone="neutral">Barras</Badge>
                  </div>

                  {chartFormasPagamento.length === 0 ? (
                    <p className="text-sm text-muted">
                      Sem dados. (Precisa o endpoint devolver “formaPagamentoTipo/Modo”.)
                    </p>
                  ) : (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartFormasPagamento} layout="vertical">
                          <CartesianGrid
                            stroke={CHART_GRID_STROKE}
                            strokeDasharray="3 3"
                          />
                          <XAxis
                            type="number"
                            allowDecimals={false}
                            tick={CHART_AXIS_TICK}
                            axisLine={{ stroke: CHART_GRID_STROKE }}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={160}
                            tick={CHART_AXIS_TICK}
                            axisLine={{ stroke: CHART_GRID_STROKE }}
                          />
                          <Tooltip {...tooltipStyle} />

                          {/* barras coloridas por label */}
                          <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                            {chartFormasPagamento.map((entry, idx) => (
                              <Cell key={idx} fill={colorForKey(entry.name)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="mt-1">
              <p className="text-xs text-muted">
                Próximo passo: exportar CSV com os mesmos filtros (front) e, idealmente,
                criar endpoint de relatório no back para mês/intervalo com performance.
              </p>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
