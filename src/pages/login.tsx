import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { loginRequest } from "../api/auth";

import "../styles/Landing.css"; // reaproveita o estilo da landing
import { Scissors, Eye, EyeOff } from "lucide-react";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [showSenha, setShowSenha] = useState(false);

  const podeEnviar = useMemo(() => {
    return isValidEmail(email) && senha.length >= 1 && !loading;
  }, [email, senha, loading]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const eTrim = email.trim().toLowerCase();
    if (!isValidEmail(eTrim)) {
      setErro("Informe um e-mail válido.");
      return;
    }
    if (!senha) {
      setErro("Informe sua senha.");
      return;
    }

    try {
      setErro(null);
      setLoading(true);

      const response = await loginRequest(eTrim, senha);
      login(response);

      navigate(response.tipo === "ADMIN" ? "/admin" : "/cliente", { replace: true });
    } catch (err: any) {
      console.error(err);
      setErro(err?.message || "Não foi possível entrar. Verifique seus dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* topo igual landing */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="container-page h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 grid place-items-center">
              <Scissors className="h-4 w-4 text-[#d9a441]" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg">Barbearia Álvaro Santos</div>
              <div className="text-xs text-white/60">Faça o seu agendamento de forma fácil e rápida</div>
            </div>
          </Link>

          <Link to="/" className="text-sm text-white/70 hover:text-white">
            Voltar
          </Link>
        </div>
      </header>

      {/* fundo com glow semelhante à landing */}
      <div className="relative">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,164,65,0.14),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.06),transparent_60%)]" />
        </div>

        <main className="relative">
          <div className="container-page py-14 md:py-20">
            <div className="mx-auto w-full max-w-md">
              {/* Brand */}
              <div className="mb-6 animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
                <span className="tag">Acesso</span>
                <h1 className="font-display text-3xl md:text-4xl mt-3 leading-tight">
                  Entrar na <span className="title-gradient">Barbearia</span>
                </h1>
                <p className="text-white/70 mt-3">
                  Faça login para ver agendamentos e gerir a sua conta.
                </p>
              </div>

              <div className="card p-6 md:p-8 animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  {erro && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                      <p className="text-sm text-red-200">{erro}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-white/70 mb-1 block">E-mail</label>
                    <input
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#d9a441]/40 focus:ring-2 focus:ring-[#d9a441]/20 transition"
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/70 mb-1 block">Senha</label>
                    <div className="flex gap-2">
                      <input
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#d9a441]/40 focus:ring-2 focus:ring-[#d9a441]/20 transition"
                        type={showSenha ? "text" : "password"}
                        placeholder="Sua senha"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        autoComplete="current-password"
                      />

                      <button
                        type="button"
                        onClick={() => setShowSenha((v) => !v)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/80 hover:bg-white/10 transition"
                        aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <button
                        type="button"
                        className="text-xs text-white/65 underline hover:text-white"
                        onClick={() => setErro("Recuperação de senha: implementaremos nas Configurações.")}
                      >
                        Esqueci a senha
                      </button>

                      <span className="text-xs text-white/45">
                        {senha.length > 0 && senha.length < 6 ? "Senha curta" : ""}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!podeEnviar}
                    className={[
                      "btn-gold w-full justify-center",
                      (!podeEnviar ? "opacity-60 pointer-events-none" : ""),
                    ].join(" ")}
                  >
                    {loading ? "Entrando..." : "Entrar"}
                  </button>

                  <button
                    type="button"
                    className="btn-outline w-full justify-center"
                    onClick={() => navigate("/register")}
                  >
                    Criar conta
                  </button>

                  <div className="pt-2 text-center text-xs text-white/55">
                    Ao entrar, você concorda com o uso de cookies essenciais para autenticação.
                  </div>
                </form>
              </div>

              <div className="mt-6 text-center text-sm text-white/60">
                <Link to="/" className="hover:text-white underline">
                  Voltar para a página inicial
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
