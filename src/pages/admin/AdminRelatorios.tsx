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
  // refYYYYMMDD: "2026-01-16" -> mês 01/2026
  const [yStr, mStr] = refYYYYMMDD.split("-");
  const y = Number(yStr);
  const m = Number(mStr); // 1..12

  const first = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0); // último dia do mês

  const inicio = first.toISOString().split("T")[0];
  const fim = last.toISOString().split("T")[0];
  return { inicio, fim };
}

// Helpers (gráficos)
function hhmm(h?: string) {
  if (!h) return "";
  return h.length >= 5 ? h.substring(0, 5) : h;
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

      // Monta filtros para o BACK (admin)
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

      // Filtro local por nome (não temos endpoint para “like” no back)
      const termo = clienteBusca.trim().toLowerCase();
      let filtrado = data;

      if (termo) {
        filtrado = filtrado.filter((a) =>
          (a.clienteNome || "").toLowerCase().includes(termo)
        );
      }

      // Ordena por data + horário
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

  /* =========================
     GRÁFICOS (datasets)
  ========================= */

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
      // depende de o teu Agendamento retornar `servicos`
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

  // 4) Barras: formas de pagamento mais usadas (top 10)
  const chartFormasPagamento = useMemo(() => {
    const map = new Map<string, number>();

    for (const a of agendamentos) {
      // depende de o teu Agendamento retornar esses campos
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
          <p className="text-sm text-gray-600">
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

      {erro && (
        <div className="mb-4 bg-red-100 border border-red-300 p-3 rounded animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
          {erro}
        </div>
      )}

      {/* Filtros */}
      <Card className="mb-4 animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
        <CardContent>
          <p className="font-semibold mb-3">Filtros</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Período</label>
              <select
                className="border rounded-lg px-3 py-2 w-full"
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
                <label className="text-xs text-gray-500 mb-1 block">
                  {periodo === "DIA" ? "Data" : "Referência do mês"}
                </label>
                <input
                  type="date"
                  className="border rounded-lg px-3 py-2 w-full"
                  value={dia}
                  onChange={(e) => setDia(e.target.value)}
                />
              </div>
            )}

            {periodo === "INTERVALO" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Início</label>
                  <input
                    type="date"
                    className="border rounded-lg px-3 py-2 w-full"
                    value={inicio}
                    onChange={(e) => setInicio(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Fim</label>
                  <input
                    type="date"
                    className="border rounded-lg px-3 py-2 w-full"
                    value={fim}
                    onChange={(e) => setFim(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Status</label>
              <select
                className="border rounded-lg px-3 py-2 w-full"
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
              <label className="text-xs text-gray-500 mb-1 block">Cliente</label>
              <input
                className="border rounded-lg px-3 py-2 w-full"
                placeholder="Buscar por nome..."
                value={clienteBusca}
                onChange={(e) => setClienteBusca(e.target.value)}
              />
            </div>

            <div className="md:col-span-3">
              <p className="text-[11px] text-gray-500">
                Nota: “Cliente” é filtro local (front). Período/Status são filtros no back (quando possível).
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
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-2xl font-bold">{kpis.total}</p>
            </CardContent>
          </Card>

          <Card className="animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
            <CardContent>
              <p className="text-xs text-gray-500">Agendados</p>
              <p className="text-2xl font-bold">{kpis.agendado}</p>
            </CardContent>
          </Card>

          <Card className="animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
            <CardContent>
              <p className="text-xs text-gray-500">Concluídos</p>
              <p className="text-2xl font-bold">{kpis.concluido}</p>
            </CardContent>
          </Card>

          <Card className="animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
            <CardContent>
              <p className="text-xs text-gray-500">Cancelados</p>
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

          {loading && <p className="text-sm text-gray-700">Gerando relatório...</p>}

          {!loading && agendamentos.length === 0 && (
            <p className="text-sm text-gray-700">Aplique os filtros para ver resultados.</p>
          )}

          {!loading && agendamentos.length > 0 && (
            <div className="space-y-2">
              {agendamentos.map((a) => (
                <div
                  key={a.id}
                  className="border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{a.clienteNome}</p>
                    <p className="text-sm text-gray-700">
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
              <p className="text-sm text-gray-700">
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
                    <p className="text-sm text-gray-600">Sem dados para gerar gráfico.</p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartAgendamentosPorDia}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="count"
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
                    <p className="text-sm text-gray-600">Sem dados para gerar gráfico.</p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartHorariosMaisUsados}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="hour" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" />
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
                    <p className="text-sm text-gray-600">
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
                            {chartServicosMaisUsados.map((_, idx) => (
                              <Cell key={idx} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
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
                    <p className="text-sm text-gray-600">
                      Sem dados. (Precisa o endpoint devolver “formaPagamentoTipo/Modo”.)
                    </p>
                  ) : (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartFormasPagamento} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" allowDecimals={false} />
                          <YAxis type="category" dataKey="name" width={140} />
                          <Tooltip />
                          <Bar dataKey="value" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="mt-1">
              <p className="text-xs text-gray-500">
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
