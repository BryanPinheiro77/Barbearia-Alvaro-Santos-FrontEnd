import React from "react";

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "warning" | "danger";
};

const tones = {
  neutral: "bg-white/5 text-white/75 border-white/10",
  success: "bg-emerald-500/10 text-emerald-200 border-emerald-500/25",
  warning: "bg-[#d9a441]/12 text-[#f3d27a] border-[#d9a441]/25",
  danger: "bg-red-500/10 text-red-200 border-red-500/25",
};

export function Badge({ tone = "neutral", className = "", ...props }: Props) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide",
        tones[tone],
        className,
      ].join(" ")}
      {...props}
    />
  );
}
