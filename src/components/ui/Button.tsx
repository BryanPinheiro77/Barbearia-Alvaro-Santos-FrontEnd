import React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
};

const variants: Record<Variant, string> = {
  primary: "bg-black text-white hover:bg-gray-900",
  secondary: "bg-white text-black border hover:bg-gray-50",
  ghost: "bg-transparent text-black hover:bg-gray-100",
  danger: "bg-white text-red-700 border border-red-200 hover:bg-red-50",
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
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm",
        "transition-transform duration-150 active:scale-[0.99]",
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
