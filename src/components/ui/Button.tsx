import React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
};

const variants: Record<Variant, string> = {
  // Dourado (principal)
  primary:
    "bg-[#d9a441] text-black border border-transparent hover:brightness-[1.03] hover:shadow-[0_18px_40px_rgba(217,164,65,0.22)]",

  // Outline dourado (secundário)
  secondary:
    "bg-white/5 text-white border border-[#d9a441]/55 hover:bg-[#d9a441]/10 hover:border-[#d9a441]/85",

  // Ghost escuro (ações leves)
  ghost:
    "bg-transparent text-white/85 border border-transparent hover:bg-white/10",

  // Danger
  danger:
    "bg-red-500/10 text-red-200 border border-red-500/30 hover:bg-red-500/15",
};

export function Button({
  variant = "secondary",
  loading = false,
  disabled,
  className = "",
  children,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold",
        "transition-all duration-150 active:scale-[0.99]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className,
      ].join(" ")}
      {...rest}
    >
      {loading ? "Carregando..." : children}
    </button>
  );
}
