import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  listarClientesAdmin,
  atualizarClienteAdmin,
  excluirClienteAdmin,
  type ClienteAdmin,
} from "../../api/adminClientes";

export default function AdminClientes() {
  const [clientes, setClientes] = useState<ClienteAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [busca, setBusca] = useState("");

  // edição inline
  const [editId, setEditId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    try {
      setLoading(true);
      setErro(null);
      const data = await listarClientesAdmin();
      setClientes(data);
    } catch (e) {
      console.error(e);
      setErro("Erro ao carregar clientes.");
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return clientes;

    return clientes.filter((c) => {
      const nome = (c.nome || "").toLowerCase();
      const tel = (c.telefone || "").toLowerCase();
      return nome.includes(termo) || tel.includes(termo);
    });
  }, [clientes, busca]);

  function iniciarEdicao(c: ClienteAdmin) {
    setEditId(c.id);
    setEditNome(c.nome || "");
    setEditTelefone(c.telefone || "");
    setErro(null);
  }

  function cancelarEdicao() {
    setEditId(null);
    setEditNome("");
    setEditTelefone("");
  }

  async function salvarEdicao() {
    if (editId == null) return;

    const nome = editNome.trim();
    const telefone = editTelefone.trim();

    if (!nome) {
      setErro("Nome não pode ficar vazio.");
      return;
    }

    try {
      setSalvando(true);
      setErro(null);

      const atualizado = await atualizarClienteAdmin(editId, {
        nome,
        telefone: telefone ? telefone : null,
      });

      setClientes((prev) => prev.map((c) => (c.id === editId ? atualizado : c)));
      cancelarEdicao();
    } catch (e) {
      console.error(e);
      setErro("Erro ao salvar alterações do cliente.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: number) {
    const ok = window.confirm("Tem certeza que deseja excluir este cliente?");
    if (!ok) return;

    try {
      setErro(null);
      await excluirClienteAdmin(id);
      setClientes((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error(e);
      setErro("Erro ao excluir cliente.");
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted">Lista de clientes cadastrados.</p>
        </div>

        <Button variant="secondary" onClick={carregar} loading={loading}>
          Recarregar
        </Button>
      </div>

      {erro && <div className="alert-error mb-4">{erro}</div>}

      <Card className="mb-4">
        <CardContent className="flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
          <div className="flex-1">
            <label className="text-xs text-white/60">Buscar</label>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome ou telefone"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/20"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setBusca("")}
              disabled={!busca.trim()}
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent>
            <p className="text-sm text-muted">Carregando clientes...</p>
          </CardContent>
        </Card>
      )}

      {!loading && !erro && clientesFiltrados.length === 0 && (
        <Card className="animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
          <CardContent>
            <p className="text-sm text-muted">Nenhum cliente encontrado.</p>
          </CardContent>
        </Card>
      )}

      {!loading && clientesFiltrados.length > 0 && (
        <div className="space-y-3">
          {clientesFiltrados.map((c) => {
            const editando = editId === c.id;

            return (
              <Card
                key={c.id}
                className="animate-[fadeInUp_.18s_ease-out_forwards] opacity-0"
              >
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {!editando ? (
                      <>
                        <p className="font-semibold truncate text-white/90">{c.nome}</p>
                        <p className="text-sm text-white/60 truncate">
                          {c.telefone || "Sem telefone"}
                        </p>
                      </>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-white/60">Nome</label>
                          <input
                            className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/20"
                            value={editNome}
                            onChange={(e) => setEditNome(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-white/60">Telefone</label>
                          <input
                            className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/20"
                            value={editTelefone}
                            onChange={(e) => setEditTelefone(e.target.value)}
                            placeholder="Opcional"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {!editando ? (
                      <>
                        <button
                          className="btn-outline px-3 py-2"
                          onClick={() => iniciarEdicao(c)}
                          title="Editar"
                        >
                          Editar
                        </button>

                        <button
                          className="btn-outline px-3 py-2"
                          onClick={() => excluir(c.id)}
                          title="Excluir"
                        >
                          Excluir
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className={[
                            "btn-outline px-3 py-2",
                            salvando ? "opacity-60 pointer-events-none" : "",
                          ].join(" ")}
                          onClick={salvarEdicao}
                          title="Salvar"
                        >
                          {salvando ? "Salvando..." : "Salvar"}
                        </button>

                        <button
                          className="btn-outline px-3 py-2"
                          onClick={cancelarEdicao}
                          disabled={salvando}
                          title="Cancelar"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
