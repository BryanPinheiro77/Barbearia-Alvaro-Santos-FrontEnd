import React from "react";

type Props = {
  children: React.ReactNode;
};

export function AnimatedList({ children }: Props) {
  // aplica animação nos filhos diretos usando Tailwind arbitrary selectors
  return (
    <div
      className={[
        "space-y-3",
        // animação de entrada
        "[&>*]:opacity-0 [&>*]:translate-y-1",
        "[&>*]:animate-[fadeInUp_.22s_ease-out_forwards]",
        // pequenos delays em sequência (até 12 itens)
        "[&>*:nth-child(1)]:[animation-delay:0ms]",
        "[&>*:nth-child(2)]:[animation-delay:30ms]",
        "[&>*:nth-child(3)]:[animation-delay:60ms]",
        "[&>*:nth-child(4)]:[animation-delay:90ms]",
        "[&>*:nth-child(5)]:[animation-delay:120ms]",
        "[&>*:nth-child(6)]:[animation-delay:150ms]",
        "[&>*:nth-child(7)]:[animation-delay:180ms]",
        "[&>*:nth-child(8)]:[animation-delay:210ms]",
        "[&>*:nth-child(9)]:[animation-delay:240ms]",
        "[&>*:nth-child(10)]:[animation-delay:270ms]",
        "[&>*:nth-child(11)]:[animation-delay:300ms]",
        "[&>*:nth-child(12)]:[animation-delay:330ms]",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
