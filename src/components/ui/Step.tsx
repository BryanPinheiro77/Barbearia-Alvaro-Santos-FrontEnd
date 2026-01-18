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
    <div ref={containerRef} className="py-5 border-b border-white/10 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white/90">
            {step}. {title}{" "}
            {done ? <span className="text-xs text-white/50">(ok)</span> : null}
          </p>
          {subtitle ? (
            <p className="text-xs text-white/55 mt-1">{subtitle}</p>
          ) : null}
        </div>
      </div>

      {open && (
        <div className="mt-4 animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
          {children}
        </div>
      )}
    </div>
  );
}
