type PeriodoTipo = "HOJE" | "SEMANA" | "MES" | "DIA_ESPECIFICO" | "INTERVALO";

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

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none " +
  "focus:border-[#d9a441]/40 focus:ring-2 focus:ring-[#d9a441]/20 transition";

const labelClass = "block text-xs text-white/60 mb-1";

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
    <div className="card mb-4 animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className={labelClass}>Período</label>
          <select
            className={inputClass}
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

        <div>
          <label className={labelClass}>Status</label>
          <select
            className={inputClass}
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="AGENDADO">Agendado</option>
            <option value="CONCLUIDO">Concluído</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Cliente</label>
          <input
            className={inputClass}
            placeholder="Buscar por nome"
            value={clienteBusca}
            onChange={(e) => onClienteBuscaChange(e.target.value)}
          />
        </div>

        {periodo === "DIA_ESPECIFICO" && (
          <div className="sm:col-span-2 lg:col-span-2">
            <label className={labelClass}>Data</label>
            <input
              type="date"
              className={inputClass}
              value={dataUnica}
              onChange={(e) => onDataUnicaChange(e.target.value)}
            />
          </div>
        )}

        {periodo === "INTERVALO" && (
          <>
            <div>
              <label className={labelClass}>Início</label>
              <input
                type="date"
                className={inputClass}
                value={inicio}
                onChange={(e) => onInicioChange(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Fim</label>
              <input
                type="date"
                className={inputClass}
                value={fim}
                onChange={(e) => onFimChange(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <button onClick={onAplicar} className="btn-gold flex-1 justify-center">
          Aplicar
        </button>
        <button onClick={onLimpar} className="btn-outline flex-1 justify-center">
          Limpar
        </button>
      </div>
    </div>
  );
}
