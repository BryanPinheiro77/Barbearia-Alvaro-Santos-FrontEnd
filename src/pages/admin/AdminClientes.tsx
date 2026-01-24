import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { listarClientesAdmin, type ClienteAdmin } from "../../api/adminClientes";

export default function AdminClientes() {
  const [clientes, setClientes] = useState<ClienteAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [busca, setBusca] = useState("");

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
          {clientesFiltrados.map((c) => (
            <Card
              key={c.id}
              className="animate-[fadeInUp_.18s_ease-out_forwards] opacity-0"
            >
              <CardContent className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate text-white/90">{c.nome}</p>
                  <p className="text-sm text-white/60 truncate">
                    {c.telefone || "Sem telefone"}
                  </p>
                </div>

                {c.telefone && (
                  <button
                    className="btn-outline px-3 py-2"
                    onClick={() => navigator.clipboard.writeText(c.telefone!)}
                    title="Copiar telefone"
                  >
                    Copiar
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
