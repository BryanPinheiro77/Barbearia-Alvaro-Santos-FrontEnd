import { useEffect, useMemo, useState } from "react";
import type { Agendamento } from "../../api/agendamentos";
import {
  listarAgendamentosAdmin,
  concluirAgendamentoAdmin,
  cancelarAgendamentoAdmin,
} from "../../api/adminAgendamentos";

import { AppShell } from "../../components/layout/AppShell";
import { AgendamentosFiltros } from "../../components/AgendamentosFiltros";
import { AgendamentoCard } from "../../components/AgendamentoCard";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

type PeriodoTipo = "HOJE" | "SEMANA" | "MES" | "DIA_ESPECIFICO" | "INTERVALO";

type FiltrosApi = {
  status?: string;
  inicio?: string;
  fim?: string;
};

function formatDateLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function AdminAgendamentos() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [periodo, setPeriodo] = useState<PeriodoTipo>("HOJE");
  const [status, setStatus] = useState("AGENDADO");
  const [clienteBusca, setClienteBusca] = useState("");

  const [dataUnica, setDataUnica] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");

  function calcularPeriodo(): { inicio?: string; fim?: string } {
    const hoje = new Date();

    if (periodo === "HOJE") {
      const d = formatDateLocal(hoje);
      return { inicio: d, fim: d };
    }

    if (periodo === "SEMANA") {
      const inicioSemana = new Date(hoje);
      // domingo = 0, segunda = 1...
      inicioSemana.setDate(hoje.getDate() - hoje.getDay());

      return {
        inicio: formatDateLocal(inicioSemana),
        fim: formatDateLocal(hoje),
      };
    }

    if (periodo === "MES") {
      const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      return {
        inicio: formatDateLocal(primeiroDia),
        fim: formatDateLocal(ultimoDia),
      };
    }

    if (periodo === "DIA_ESPECIFICO" && dataUnica) {
      return { inicio: dataUnica, fim: dataUnica };
    }

    if (periodo === "INTERVALO" && inicio && fim) {
      return { inicio, fim };
    }

    return {};
  }

  function montarFiltrosApi(): FiltrosApi {
    const p = calcularPeriodo();

    const filtros: FiltrosApi = {
      status: status || undefined,
      inicio: p.inicio,
      fim: p.fim,
    };

    if (!filtros.status) delete filtros.status;
    if (!filtros.inicio) delete filtros.inicio;
    if (!filtros.fim) delete filtros.fim;

    return filtros;
  }

  function ordenarAgenda(lista: Agendamento[]) {
    return [...lista].sort((a, b) => {
      const aKey = `${a.data} ${a.horarioInicio}`;
      const bKey = `${b.data} ${b.horarioInicio}`;
      return aKey.localeCompare(bKey);
    });
  }

  async function carregarAgendamentos() {
    try {
      setLoading(true);
      setErro(null);

      const filtros = montarFiltrosApi();
      const resp = await listarAgendamentosAdmin(filtros);

      setAgendamentos(ordenarAgenda(resp));
    } catch (e) {
      console.error(e);
      setErro("Erro ao carregar agendamentos");
      setAgendamentos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarAgendamentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function limparFiltros() {
    setPeriodo("HOJE");
    setStatus("");
    setClienteBusca("");
    setDataUnica("");
    setInicio("");
    setFim("");
    setTimeout(() => carregarAgendamentos(), 0);
  }

  async function concluir(id: number) {
    if (!window.confirm("Concluir este agendamento?")) return;
    await concluirAgendamentoAdmin(id);
    carregarAgendamentos();
  }

  async function cancelar(id: number) {
    if (!window.confirm("Cancelar este agendamento?")) return;
    await cancelarAgendamentoAdmin(id);
    carregarAgendamentos();
  }

  const agendamentosFiltrados = useMemo(() => {
    const termo = clienteBusca.trim().toLowerCase();
    if (!termo) return agendamentos;

    return agendamentos.filter((a) =>
      (a.clienteNome || "").toLowerCase().includes(termo)
    );
  }, [agendamentos, clienteBusca]);

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Agendamentos</h1>
          <p className="text-sm text-muted">
            Filtre por período, status e cliente.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={carregarAgendamentos}
          loading={loading}
        >
          Recarregar
        </Button>
      </div>

      {erro && <div className="alert-error mb-4">{erro}</div>}

      <AgendamentosFiltros
        periodo={periodo}
        status={status}
        clienteBusca={clienteBusca}
        dataUnica={dataUnica}
        inicio={inicio}
        fim={fim}
        onPeriodoChange={setPeriodo}
        onStatusChange={setStatus}
        onClienteBuscaChange={setClienteBusca}
        onDataUnicaChange={setDataUnica}
        onInicioChange={setInicio}
        onFimChange={setFim}
        onAplicar={carregarAgendamentos}
        onLimpar={limparFiltros}
      />

      {loading && (
        <Card>
          <CardContent>
            <p className="text-sm text-muted">Carregando agendamentos...</p>
          </CardContent>
        </Card>
      )}

      {!loading && !erro && agendamentosFiltrados.length === 0 && (
        <Card className="animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
          <CardContent>
            <p className="text-sm text-muted">Nenhum agendamento encontrado.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {agendamentosFiltrados.map((a) => (
          <AgendamentoCard
            key={a.id}
            agendamento={a}
            onConcluir={concluir}
            onCancelar={cancelar}
          />
        ))}
      </div>
    </AppShell>
  );
}
