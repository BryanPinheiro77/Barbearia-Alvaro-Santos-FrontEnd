import type { ReactNode } from "react";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

import { PageTransition } from "../ui/PageTransition"; // ajuste se necessário

type NavItem = {
  label: string;
  path: string;
};

function isActivePath(current: string, target: string) {
  // Regra especial: rota raiz do cliente/admin só é ativa no match exato
  if (target === "/cliente" || target === "/admin") {
    return current === target;
  }

  // Para o resto, aceita subrotas
  return current === target || current.startsWith(target + "/");
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.tipo === "ADMIN";

  const navItems: NavItem[] = useMemo(() => {
    if (isAdmin) {
      return [
        { label: "Agenda", path: "/admin/agendamentos" },
        { label: "Serviços", path: "/admin/servicos" },
        { label: "Dashboard", path: "/admin" },
        { label: "Horários", path: "/admin/horarios" },
        { label: "Relatórios", path: "/admin/relatorios" }, // criar depois
      ];
    }

    return [
      { label: "Agendamentos", path: "/cliente" },
      { label: "Novo", path: "/cliente/novo-agendamento" },
      { label: "Histórico", path: "/cliente/historico" },
      { label: "Conta", path: "/cliente/configuracoes" }, // criaremos depois
    ];
  }, [isAdmin]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  // Grid dinâmico para o mobile (4 para cliente, 5 para admin)
  const mobileColsClass = isAdmin ? "grid-cols-5" : "grid-cols-4";

  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="min-w-0">
            <p className="font-semibold truncate">Barbearia Alvaro Santos</p>
            <p className="text-xs text-gray-500 truncate">
              {isAdmin ? "Admin" : "Cliente"} • {user?.nome ?? ""}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="text-sm border px-3 py-2 rounded hover:bg-gray-50 active:scale-[0.99] transition"
          >
            Sair
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="mx-auto max-w-5xl px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6 flex gap-6">
        {/* SIDENAV (desktop) */}
        <aside className="hidden md:block w-56 shrink-0">
          <nav className="bg-white border rounded-xl p-2 sticky top-[76px]">
            {navItems.map((item) => {
              const active = isActivePath(location.pathname, item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={[
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition",
                    active ? "bg-black text-white" : "hover:bg-gray-50",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* CONTENT + TRANSIÇÃO DE ROTA */}
        <main className="flex-1 min-w-0">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      {/* BOTTOM NAV (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t bg-white">
        <div
          className={[
            "mx-auto max-w-5xl px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]",
            "grid gap-1",
            mobileColsClass,
          ].join(" ")}
        >
          {navItems.map((item) => {
            const active = isActivePath(location.pathname, item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={[
                  "px-2 py-2 rounded-lg text-xs transition",
                  active ? "bg-black text-white" : "hover:bg-gray-50",
                ].join(" ")}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
