import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { PageTransition } from "../ui/PageTransition";
import { Scissors, LogOut, X } from "lucide-react";

type NavItem = { label: string; path: string };

function isActivePath(current: string, target: string) {
  if (target === "/cliente" || target === "/admin") return current === target;
  return current === target || current.startsWith(target + "/");
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.tipo === "ADMIN";
  const [moreOpen, setMoreOpen] = useState(false);

  // ============================
  // NAV DEFINITIONS
  // ============================

  // Admin: desktop (tudo)
  const adminNavDesktop: NavItem[] = useMemo(
    () => [
      { label: "Agenda", path: "/admin/agendamentos" },
      { label: "Serviços", path: "/admin/servicos" },
      { label: "Dashboard", path: "/admin" },
      { label: "Horários", path: "/admin/horarios" },
      { label: "Relatórios", path: "/admin/relatorios" },
      { label: "Clientes", path: "/admin/clientes" },
      { label: "Novo", path: "/admin/agendamentos/novo" },
    ],
    []
  );

  // Admin: mobile fixo (4) + "Mais"
  const adminNavMobilePrimary: NavItem[] = useMemo(
    () => [
      { label: "Agenda", path: "/admin/agendamentos" },
      { label: "Dashboard", path: "/admin" },
      { label: "Agendamento", path: "/admin/agendamentos/novo" },
      { label: "Serviços", path: "/admin/servicos" },
    ],
    []
  );

  // Admin: itens dentro do "Mais" (mobile)
  const adminNavMobileMore: NavItem[] = useMemo(
    () => [
      { label: "Relatórios", path: "/admin/relatorios" },
      { label: "Clientes", path: "/admin/clientes" },
      { label: "Horários", path: "/admin/horarios" },
    ],
    []
  );

  // Cliente (já cabe no mobile, mantém simples)
  const clienteNav: NavItem[] = useMemo(
    () => [
      { label: "Agendamentos", path: "/cliente" },
      { label: "Novo", path: "/cliente/novo-agendamento" },
      { label: "Histórico", path: "/cliente/historico" },
      { label: "Conta", path: "/cliente/configuracoes" },
    ],
    []
  );

  const navItemsDesktop: NavItem[] = isAdmin ? adminNavDesktop : clienteNav;

  // mobile: para admin a gente usa os primary; para cliente usa tudo
  const navItemsMobile: NavItem[] = isAdmin ? adminNavMobilePrimary : clienteNav;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function goTo(path: string) {
    setMoreOpen(false);
    navigate(path);
  }

  // grid cols no mobile
  // admin: 5 (4 itens + Mais)
  // cliente: 4
  const mobileColsClass = isAdmin ? "grid-cols-5" : "grid-cols-4";

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="container-page h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 grid place-items-center">
              <Scissors className="h-4 w-4 text-[#d9a441]" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-lg truncate">Barbearia Álvaro Santos</p>
              <p className="text-xs text-white/60 truncate">
                {isAdmin ? "Admin" : "Cliente"} • {user?.nome ?? ""}
              </p>
            </div>
          </Link>

          <button onClick={handleLogout} className="btn-outline px-4 py-2">
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="container-page pt-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-10">
        <div className="flex gap-6">
          {/* SIDENAV (desktop) */}
          <aside className="hidden md:block w-64 shrink-0">
            <nav className="card p-3 sticky top-[88px]">
              <div className="text-xs tracking-[0.16em] uppercase text-white/50 px-2 pb-2">
                Menu
              </div>

              <div className="flex flex-col gap-2">
                {navItemsDesktop.map((item) => {
                  const active = isActivePath(location.pathname, item.path);

                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={[
                        "w-full text-left px-3 py-2 rounded-xl text-sm transition",
                        active
                          ? "bg-[#d9a441] text-black font-semibold"
                          : "bg-white/5 border border-white/10 text-white/85 hover:bg-white/10",
                      ].join(" ")}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </nav>
          </aside>

          {/* CONTENT */}
          <main className="flex-1 min-w-0">
            <div className="relative">
              <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,164,65,0.10),transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.05),transparent_60%)]" />
              </div>

              <PageTransition>{children}</PageTransition>
            </div>
          </main>
        </div>
      </div>

      {/* BOTTOM NAV (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-black/70 backdrop-blur">
        <div
          className={[
            "container-page",
            "pt-3",
            "pb-[calc(env(safe-area-inset-bottom)+12px)]",
          ].join(" ")}
        >
          <div className={["grid gap-2", mobileColsClass].join(" ")}>
            {navItemsMobile.map((item) => {
              const active = isActivePath(location.pathname, item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={[
                    "h-12",
                    "w-full min-w-0",
                    "flex items-center justify-center",
                    "whitespace-nowrap",
                    "text-[11px] leading-tight",
                    "px-2 rounded-2xl transition border",
                    active
                      ? "bg-[#d9a441] text-black border-transparent font-semibold"
                      : "bg-white/5 text-white/80 border-white/10",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}

            {/* ✅ "Mais" só para admin */}
            {isAdmin && (
              <button
                onClick={() => setMoreOpen(true)}
                className={[
                  "h-12",
                  "w-full min-w-0",
                  "flex items-center justify-center",
                  "whitespace-nowrap",
                  "text-[11px] leading-tight",
                  "px-2 rounded-2xl transition border",
                  moreOpen
                    ? "bg-[#d9a441] text-black border-transparent font-semibold"
                    : "bg-white/5 text-white/80 border-white/10",
                ].join(" ")}
              >
                Mais
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ✅ Drawer/BottomSheet do "Mais" (mobile admin) */}
      {isAdmin && moreOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          {/* backdrop */}
          <button
            className="absolute inset-0 bg-black/60"
            onClick={() => setMoreOpen(false)}
            aria-label="Fechar menu"
          />

          {/* sheet */}
          <div className="absolute left-0 right-0 bottom-0 rounded-t-3xl border border-white/10 bg-black/90 backdrop-blur p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/80">Mais opções</p>
              <button
                onClick={() => setMoreOpen(false)}
                className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 grid place-items-center"
              >
                <X className="h-4 w-4 text-white/80" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {adminNavMobileMore.map((item) => {
                const active = isActivePath(location.pathname, item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => goTo(item.path)}
                    className={[
                      "w-full text-left px-4 py-3 rounded-2xl border transition",
                      active
                        ? "bg-[#d9a441] text-black border-transparent font-semibold"
                        : "bg-white/5 border-white/10 text-white/85 hover:bg-white/10",
                    ].join(" ")}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pb-[calc(env(safe-area-inset-bottom)+8px)]">
              <button
                onClick={() => setMoreOpen(false)}
                className="btn-outline w-full justify-center"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
