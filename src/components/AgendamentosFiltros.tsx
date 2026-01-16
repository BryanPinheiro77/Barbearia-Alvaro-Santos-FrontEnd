type PeriodoTipo =
  | "HOJE"
  | "SEMANA"
  | "MES"
  | "DIA_ESPECIFICO"
  | "INTERVALO";

type Props = {
  periodo: PeriodoTipo;
  status: string;
  clienteBusca: string;

  dataUnica: string;
  inicio: string;
  fim: string;

  onPeriodoChange: (v: PeriodoTipo) => void;
  onStatusChange: (v: string) => void;
  onClienteBuscaChange: (v: string) => void;
  onDataUnicaChange: (v: string) => void;
  onInicioChange: (v: string) => void;
  onFimChange: (v: string) => void;

  onAplicar: () => void;
  onLimpar: () => void;
};

export function AgendamentosFiltros({
  periodo,
  status,
  clienteBusca,
  dataUnica,
  inicio,
  fim,
  onPeriodoChange,
  onStatusChange,
  onClienteBuscaChange,
  onDataUnicaChange,
  onInicioChange,
  onFimChange,
  onAplicar,
  onLimpar,
}: Props) {
  return (
    <div className="bg-white border rounded-2xl p-4 mb-4 animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* PERÍODO */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Período</label>
          <select
            className="border rounded-lg px-3 py-2 w-full"
            value={periodo}
            onChange={(e) => onPeriodoChange(e.target.value as PeriodoTipo)}
          >
            <option value="HOJE">Hoje</option>
            <option value="SEMANA">Esta semana</option>
            <option value="MES">Este mês</option>
            <option value="DIA_ESPECIFICO">Dia específico</option>
            <option value="INTERVALO">Intervalo</option>
          </select>
        </div>

        {/* STATUS */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select
            className="border rounded-lg px-3 py-2 w-full"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="AGENDADO">Agendado</option>
            <option value="CONCLUIDO">Concluído</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>

        {/* CLIENTE */}
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Cliente</label>
          <input
            className="border rounded-lg px-3 py-2 w-full"
            placeholder="Buscar por nome"
            value={clienteBusca}
            onChange={(e) => onClienteBuscaChange(e.target.value)}
          />
        </div>

        {/* DIA ESPECÍFICO */}
        {periodo === "DIA_ESPECIFICO" && (
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Data</label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2 w-full"
              value={dataUnica}
              onChange={(e) => onDataUnicaChange(e.target.value)}
            />
          </div>
        )}

        {/* INTERVALO */}
        {periodo === "INTERVALO" && (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Início</label>
              <input
                type="date"
                className="border rounded-lg px-3 py-2 w-full"
                value={inicio}
                onChange={(e) => onInicioChange(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Fim</label>
              <input
                type="date"
                className="border rounded-lg px-3 py-2 w-full"
                value={fim}
                onChange={(e) => onFimChange(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <button
          onClick={onAplicar}
          className="bg-black text-white px-4 py-2 rounded-lg flex-1 hover:opacity-95 active:scale-[0.99]"
        >
          Aplicar
        </button>
        <button
          onClick={onLimpar}
          className="border px-4 py-2 rounded-lg flex-1 hover:bg-gray-50 active:scale-[0.99]"
        >
          Limpar
        </button>
      </div>
    </div>
  );
}
