import { useMemo, useState } from "react";

type Props = {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  minDate?: Date;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYmd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

export function CalendarPicker({ value, onChange, minDate }: Props) {
  const today = startOfDay(new Date());
  const min = minDate ? startOfDay(minDate) : today;

  const selected = useMemo(() => {
    if (!value) return null;
    const [y, m, d] = value.split("-").map(Number);
    return startOfDay(new Date(y, m - 1, d));
  }, [value]);

  const initialMonth = selected ?? today;
  const [viewYear, setViewYear] = useState(initialMonth.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialMonth.getMonth()); // 0..11

  const monthLabel = useMemo(() => {
    const meses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    return `${meses[viewMonth]} ${viewYear}`;
  }, [viewMonth, viewYear]);

  const days = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const last = new Date(viewYear, viewMonth + 1, 0);

    const startWeekDay = first.getDay();
    const totalDays = last.getDate();

    const cells: Array<{ date: Date | null; ymd?: string }> = [];
    for (let i = 0; i < startWeekDay; i++) cells.push({ date: null });

    for (let day = 1; day <= totalDays; day++) {
      const d = startOfDay(new Date(viewYear, viewMonth, day));
      cells.push({ date: d, ymd: toYmd(d) });
    }

    while (cells.length < 42) cells.push({ date: null });

    return cells;
  }, [viewYear, viewMonth]);

  function prevMonth() {
    const d = new Date(viewYear, viewMonth, 1);
    d.setMonth(d.getMonth() - 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  function nextMonth() {
    const d = new Date(viewYear, viewMonth, 1);
    d.setMonth(d.getMonth() + 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10 transition"
        >
          {"<"}
        </button>

        <div className="text-sm font-semibold text-white/90">{monthLabel}</div>

        <button
          type="button"
          onClick={nextMonth}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10 transition"
        >
          {">"}
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((w) => (
          <div
            key={w}
            className={[
              "text-xs text-center py-1",
              w === "Dom" ? "text-white/25" : "text-white/55",
            ].join(" ")}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((cell, idx) => {
          if (!cell.date) return <div key={idx} className="h-10" />;

          const d = cell.date;

          const isSunday = d.getDay() === 0; // 0 = Domingo
          const disabled = d.getTime() < min.getTime() || isSunday;

          const isSelected = selected ? sameDay(d, selected) : false;
          const isToday = sameDay(d, today);

          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => cell.ymd && onChange(cell.ymd)}
              className={[
                "h-10 rounded-xl text-sm border transition-all",
                disabled
                  ? "border-white/5 bg-white/0 text-white/20 cursor-not-allowed"
                  : "border-white/10 bg-white/5 text-white/85 hover:bg-white/10 hover:border-[#d9a441]/25",
                isSelected
                  ? "border-[#d9a441]/60 bg-[#d9a441]/15 text-[#f3d27a] font-semibold"
                  : "",
                isToday && !isSelected ? "ring-1 ring-white/10" : "",
              ].join(" ")}
              title={cell.ymd + (isSunday ? " (Domingo indisponível)" : "")}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      {value && (
        <p className="text-xs text-white/55 mt-3">
          Data selecionada:{" "}
          <span className="font-semibold text-white/85">{value}</span>
        </p>
      )}
    </div>
  );
}
