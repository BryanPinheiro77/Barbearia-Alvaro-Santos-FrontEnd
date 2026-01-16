import { useEffect, useMemo, useState } from "react";
import {
  ativarHorarioAdmin,
  atualizarHorarioAdmin,
  criarHorarioAdmin,
  deletarHorarioAdmin,
  desativarHorarioAdmin,
  listarHorariosAdmin,
  type Horario,
} from "../../api/adminHorarios";

import { AppShell } from "../../components/layout/AppShell";
import { HorarioCard } from "../../components/HorarioCard";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export default function AdminHorarios() {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [novoHorario, setNovoHorario] = useState("09:00");
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    try {
      setLoading(true);
      setErro(null);
      const resp = await listarHorariosAdmin();
      setHorarios(resp);
    } catch (e) {
      console.error(e);
      setErro("Erro ao carregar horários");
      setHorarios([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const horariosOrdenados = useMemo(() => {
    return [...horarios].sort((a, b) => {
      const ha = (a.horario || "").substring(0, 5);
      const hb = (b.horario || "").substring(0, 5);
      return ha.localeCompare(hb);
    });
  }, [horarios]);

  async function criar() {
    try {
      setSalvando(true);
      setErro(null);

      if (!novoHorario || novoHorario.length < 4) {
        setErro("Informe um horário válido");
        return;
      }

      const jaExiste = horarios.some(
        (h) => (h.horario || "").substring(0, 5) === novoHorario
      );
      if (jaExiste) {
        setErro("Esse horário já existe");
        return;
      }

      await criarHorarioAdmin({ horario: novoHorario });
      await carregar();
    } catch (e) {
      console.error(e);
      setErro("Erro ao criar horário");
    } finally {
      setSalvando(false);
    }
  }

  async function ativar(id: number) {
    try {
      setErro(null);
      await ativarHorarioAdmin(id);
      await carregar();
    } catch (e) {
      console.error(e);
      setErro("Erro ao ativar horário");
    }
  }

  async function desativar(id: number) {
    try {
      setErro(null);
      await desativarHorarioAdmin(id);
      await carregar();
    } catch (e) {
      console.error(e);
      setErro("Erro ao desativar horário");
    }
  }

  async function deletar(id: number) {
    try {
      setErro(null);
      await deletarHorarioAdmin(id);
      await carregar();
    } catch (e) {
      console.error(e);
      setErro("Erro ao excluir horário");
    }
  }

  async function editar(id: number, novo: string) {
    try {
      setErro(null);

      const jaExiste = horarios.some(
        (h) => h.id !== id && (h.horario || "").substring(0, 5) === novo
      );
      if (jaExiste) {
        setErro("Esse horário já existe");
        return;
      }

      await atualizarHorarioAdmin(id, { horario: novo });
      await carregar();
    } catch (e) {
      console.error(e);
      setErro("Erro ao editar horário");
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Horários</h1>
          <p className="text-sm text-gray-600">
            Crie, edite, ative/desative e organize os horários disponíveis.
          </p>
        </div>

        <Button variant="secondary" onClick={carregar} loading={loading}>
          Recarregar
        </Button>
      </div>

      {erro && (
        <div className="mb-4 bg-red-100 border border-red-300 p-3 rounded animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
          {erro}
        </div>
      )}

      {/* Criar novo horário */}
      <Card className="mb-4 animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
        <CardContent>
          <p className="font-semibold mb-3">Criar novo horário</p>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Horário</label>
              <input
                type="time"
                value={novoHorario}
                onChange={(e) => setNovoHorario(e.target.value)}
                className="border rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="primary" onClick={criar} loading={salvando}>
                Adicionar
              </Button>

              <Button variant="secondary" onClick={carregar}>
                Atualizar lista
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent>
            <p className="text-sm text-gray-700">Carregando horários...</p>
          </CardContent>
        </Card>
      )}

      {!loading && horariosOrdenados.length === 0 && (
        <Card className="animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
          <CardContent>
            <p className="text-sm text-gray-700">Nenhum horário cadastrado.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {horariosOrdenados.map((h) => (
          <HorarioCard
            key={h.id}
            item={h}
            onAtivar={ativar}
            onDesativar={desativar}
            onDeletar={(id) => {
              if (!window.confirm("Excluir este horário?")) return;
              deletar(id);
            }}
            onEditar={editar}
          />
        ))}
      </div>
    </AppShell>
  );
}
