import { useState } from "react";
import type { Horario } from "../api/adminHorarios";
import { Card, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

type Props = {
  item: Horario;
  onAtivar: (id: number) => void;
  onDesativar: (id: number) => void;
  onDeletar: (id: number) => void;
  onEditar: (id: number, novoHorario: string) => void;
};

function hhmm(h: string) {
  return h?.length >= 5 ? h.substring(0, 5) : h;
}

const timeInputClass =
  "rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none " +
  "focus:border-[#d9a441]/40 focus:ring-2 focus:ring-[#d9a441]/20 transition";

export function HorarioCard({ item, onAtivar, onDesativar, onDeletar, onEditar }: Props) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(hhmm(item.horario));

  function cancelarEdicao() {
    setValor(hhmm(item.horario));
    setEditando(false);
  }

  function salvar() {
    if (!valor) return;
    onEditar(item.id, valor);
    setEditando(false);
  }

  return (
    <Card className="overflow-hidden animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
      <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-white/90">{hhmm(item.horario)}</p>
            <Badge tone={item.ativo ? "success" : "danger"}>
              {item.ativo ? "Ativo" : "Inativo"}
            </Badge>
          </div>

          {!editando && (
            <p className="text-sm text-white/60 mt-1">
              Ajuste rapidamente o horário ou altere o status.
            </p>
          )}
        </div>

        {editando ? (
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto">
            <input
              type="time"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className={timeInputClass}
            />

            <div className="flex gap-2">
              <Button variant="primary" onClick={salvar}>
                Salvar
              </Button>
              <Button variant="secondary" onClick={cancelarEdicao}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setEditando(true)}>
              Editar
            </Button>

            {item.ativo ? (
              <Button variant="secondary" onClick={() => onDesativar(item.id)}>
                Desativar
              </Button>
            ) : (
              <Button variant="primary" onClick={() => onAtivar(item.id)}>
                Ativar
              </Button>
            )}

            <Button
              variant="danger"
              onClick={() => {
                if (!window.confirm("Excluir este horário?")) return;
                onDeletar(item.id);
              }}
            >
              Excluir
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
