import type { ReactNode, RefObject } from "react";

type StepProps = {
  step: number;
  title: string;
  subtitle?: string;
  open: boolean;
  done?: boolean;
  children: ReactNode;

  containerRef?: RefObject<HTMLDivElement | null>;
};

export function Step({
  step,
  title,
  subtitle,
  open,
  done,
  children,
  containerRef,
}: StepProps) {
  return (
    <div ref={containerRef} className="py-4 border-b last:border-b-0">
      {/* Cabeçalho do step */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {step}. {title}{" "}
            {done ? <span className="text-xs text-gray-500">(ok)</span> : null}
          </p>
          {subtitle ? <p className="text-xs text-gray-500">{subtitle}</p> : null}
        </div>
      </div>

      {/* Conteúdo com animação leve */}
      {open && (
        <div className="mt-3 animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
          {children}
        </div>
      )}
    </div>
  );
}
