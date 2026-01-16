import React, { useMemo, useState } from "react";

type Props = {
  value: string;               // "YYYY-MM-DD"
  onChange: (value: string) => void;
  minDate?: Date;              // datas anteriores ficam desabilitadas
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
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
    ];
    return `${meses[viewMonth]} ${viewYear}`;
  }, [viewMonth, viewYear]);

  const days = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const last = new Date(viewYear, viewMonth + 1, 0);

    // domingo=0 ... sábado=6
    const startWeekDay = first.getDay();
    const totalDays = last.getDate();

    // grid de 6 semanas (42 células) para não “pular” layout
    const cells: Array<{ date: Date | null; ymd?: string }> = [];

    // espaços antes do dia 1
    for (let i = 0; i < startWeekDay; i++) cells.push({ date: null });

    // dias do mês
    for (let day = 1; day <= totalDays; day++) {
      const d = startOfDay(new Date(viewYear, viewMonth, day));
      cells.push({ date: d, ymd: toYmd(d) });
    }

    // completa até 42
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
    <div className="border rounded-xl p-3 bg-white">
      <div className="flex items-center justify-between gap-2 mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
        >
          {"<"}
        </button>

        <div className="text-sm font-semibold">{monthLabel}</div>

        <button
          type="button"
          onClick={nextMonth}
          className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
        >
          {">"}
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((w) => (
          <div key={w} className="text-xs text-gray-500 text-center py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((cell, idx) => {
          if (!cell.date) {
            return <div key={idx} className="h-10" />;
          }

          const d = cell.date;
          const disabled = d.getTime() < min.getTime();
          const isSelected = selected ? sameDay(d, selected) : false;
          const isToday = sameDay(d, today);

          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => cell.ymd && onChange(cell.ymd)}
              className={[
                "h-10 rounded-lg text-sm border transition-colors",
                disabled
                  ? "border-gray-100 text-gray-300 cursor-not-allowed"
                  : "border-gray-200 hover:bg-gray-50",
                isSelected ? "border-black bg-gray-50 font-semibold" : "",
                isToday && !isSelected ? "ring-1 ring-gray-200" : "",
              ].join(" ")}
              title={cell.ymd}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      {value && (
        <p className="text-xs text-gray-500 mt-3">
          Data selecionada: <span className="font-medium text-gray-700">{value}</span>
        </p>
      )}
    </div>
  );
}
