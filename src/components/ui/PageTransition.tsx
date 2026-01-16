import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

type Props = {
  children: React.ReactNode;
};

export function PageTransition({ children }: Props) {
  const location = useLocation();
  const [active, setActive] = useState(false);

  // Toda vez que mudar a rota, reativa a animação
  useEffect(() => {
    setActive(false);
    const t = window.setTimeout(() => setActive(true), 10);
    return () => window.clearTimeout(t);
  }, [location.pathname]);

  return (
    <div
      className={[
        "transition-all duration-200 ease-out will-change-transform",
        active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
