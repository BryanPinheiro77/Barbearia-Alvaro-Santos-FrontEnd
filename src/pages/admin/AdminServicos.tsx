import { useEffect, useMemo, useState } from "react";
import {
  ativarServicoAdmin,
  criarServicoAdmin,
  desativarServicoAdmin,
  listarServicosAdmin,
  atualizarServicoAdmin,
  type ServicoDTO,
  type ServicoCreateDTO,
} from "../../api/adminServicos";

import { AppShell } from "../../components/layout/AppShell";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";

export default function AdminServicos() {
  const [lista, setLista] = useState<ServicoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [filtro, setFiltro] = useState("");
  const [mostrarInativos, setMostrarInativos] = useState(true);

  const [editId, setEditId] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [duracao, setDuracao] = useState("");

  async function carregar() {
    try {
      setLoading(true);
      setErro(null);
      const data = await listarServicosAdmin();
      setLista(data);
    } catch (e) {
      console.error(e);
      setErro("Erro ao carregar serviços");
      setLista([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function limparForm() {
    setEditId(null);
    setNome("");
    setPreco("");
    setDuracao("");
  }

  function validarPayload():
    | { ok: true; payload: ServicoCreateDTO }
    | { ok: false; msg: string } {
    const n = nome.trim();
    if (!n) return { ok: false, msg: "Nome é obrigatório" };

    const p = Number(preco);
    if (!Number.isFinite(p) || p <= 0) return { ok: false, msg: "Preço inválido" };

    const d = Number(duracao);
    if (!Number.isFinite(d) || d <= 0) return { ok: false, msg: "Duração inválida" };

    return { ok: true, payload: { nome: n, preco: p, duracaoMinutos: d } };
  }

  async function salvar() {
    const v = validarPayload();
    if (!v.ok) {
      setErro(v.msg);
      return;
    }

    try {
      setErro(null);
      if (editId) {
        await atualizarServicoAdmin(editId, v.payload);
      } else {
        await criarServicoAdmin(v.payload);
      }
      await carregar();
      limparForm();
    } catch (e) {
      console.error(e);
      setErro("Erro ao salvar serviço");
    }
  }

  function editarServico(s: ServicoDTO) {
    setEditId(s.id);
    setNome(s.nome);
    setPreco(String(s.preco));
    setDuracao(String(s.duracaoMinutos));
  }

  async function toggleAtivo(s: ServicoDTO) {
    try {
      setErro(null);
      if (s.ativo) {
        if (!window.confirm("Desativar este serviço?")) return;
        await desativarServicoAdmin(s.id);
      } else {
        await ativarServicoAdmin(s.id);
      }
      await carregar();
    } catch (e) {
      console.error(e);
      setErro("Erro ao alterar status do serviço");
    }
  }

  const listaFiltrada = useMemo(() => {
    const termo = filtro.trim().toLowerCase();
    return lista.filter((s) => {
      if (!mostrarInativos && !s.ativo) return false;
      if (!termo) return true;
      return s.nome.toLowerCase().includes(termo);
    });
  }, [lista, filtro, mostrarInativos]);

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Serviços</h1>
          <p className="text-sm text-muted">
            Cadastre serviços, ajuste preço/duração e controle ativos/inativos.
          </p>
        </div>

        <Button variant="secondary" onClick={carregar} loading={loading}>
          Recarregar
        </Button>
      </div>

      {erro && <div className="alert-error mb-4">{erro}</div>}

      {/* FORM */}
      <Card className="mb-6 animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <h2 className="font-semibold">
              {editId ? `Editar serviço #${editId}` : "Novo serviço"}
            </h2>

            {editId && <Badge tone="warning">Modo edição</Badge>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="label-dark">Nome</label>
              <input
                className="input-dark"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div>
              <label className="label-dark">Preço</label>
              <input
                className="input-dark"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="Ex: 35"
                inputMode="decimal"
              />
            </div>

            <div>
              <label className="label-dark">Duração (min)</label>
              <input
                className="input-dark"
                value={duracao}
                onChange={(e) => setDuracao(e.target.value)}
                placeholder="Ex: 30"
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button variant="primary" onClick={salvar}>
              {editId ? "Salvar alterações" : "Criar"}
            </Button>

            {editId && (
              <Button variant="secondary" onClick={limparForm}>
                Cancelar edição
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* FILTROS */}
      <Card className="mb-4 animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
        <CardContent className="flex flex-col md:flex-row gap-3 md:items-center">
          <input
            className="input-dark"
            placeholder="Buscar por nome..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />

          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={mostrarInativos}
              onChange={(e) => setMostrarInativos(e.target.checked)}
            />
            Mostrar inativos
          </label>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent>
            <p className="text-sm text-muted">Carregando serviços...</p>
          </CardContent>
        </Card>
      )}

      {!loading && listaFiltrada.length === 0 && (
        <Card className="animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
          <CardContent>
            <p className="text-sm text-muted">Nenhum serviço encontrado.</p>
          </CardContent>
        </Card>
      )}

      {/* LISTA */}
      <div className="space-y-3">
        {listaFiltrada.map((s) => (
          <Card
            key={s.id}
            className="overflow-hidden animate-[fadeInUp_.18s_ease-out_forwards] opacity-0"
          >
            <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold truncate">{s.nome}</p>
                  <Badge tone={s.ativo ? "success" : "danger"}>
                    {s.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <p className="text-sm text-muted mt-1">
                  R$ {Number(s.preco).toFixed(2)} • {s.duracaoMinutos} min
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => editarServico(s)}>
                  Editar
                </Button>

                <Button
                  variant={s.ativo ? "danger" : "primary"}
                  onClick={() => toggleAtivo(s)}
                >
                  {s.ativo ? "Desativar" : "Ativar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
