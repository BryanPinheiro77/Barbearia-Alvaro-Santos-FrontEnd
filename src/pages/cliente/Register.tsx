import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerRequest } from "../../api/auth";
import { Scissors, Eye, EyeOff } from "lucide-react";

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

function formatTelefoneBR(raw: string) {
  const d = onlyDigits(raw).slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function Register() {
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  function validar(): string | null {
    if (!nome.trim()) return "Informe seu nome.";
    const telDigits = onlyDigits(telefone);
    if (!telDigits) return "Informe seu telefone.";
    if (telDigits.length < 10) return "Telefone inválido. Use DDD + número.";
    if (!email.trim()) return "Informe seu e-mail.";
    if (!isValidEmail(email)) return "Informe um e-mail válido.";
    if (!senha) return "Informe uma senha.";
    if (senha.length < 6) return "A senha deve ter pelo menos 6 caracteres.";
    if (senha !== confirmarSenha) return "As senhas não coincidem.";
    return null;
  }

  const podeEnviar = useMemo(() => {
    return (
      nome.trim().length >= 2 &&
      onlyDigits(telefone).length >= 10 &&
      isValidEmail(email) &&
      senha.length >= 6 &&
      senha === confirmarSenha &&
      !loading
    );
  }, [nome, telefone, email, senha, confirmarSenha, loading]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    const msg = validar();
    if (msg) {
      setErro(msg);
      return;
    }

    try {
      setErro(null);
      setLoading(true);

      await registerRequest({
        nome: nome.trim(),
        telefone: onlyDigits(telefone),
        email: email.trim().toLowerCase(),
        senha,
      });

      navigate("/login", { replace: true });
    } catch (err: any) {
      console.error(err);
      setErro(err?.message || "Não foi possível criar sua conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header padrão */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="container-page h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 grid place-items-center">
              <Scissors className="h-4 w-4 text-[#d9a441]" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg">Álvaro Santos</div>
              <div className="text-xs text-white/60">Barber Lounge</div>
            </div>
          </Link>

          <Link to="/login" className="text-sm text-white/70 hover:text-white">
            Já tenho conta
          </Link>
        </div>
      </header>

      {/* Fundo com glow */}
      <div className="relative">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,164,65,0.14),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.06),transparent_60%)]" />
        </div>

        <main className="relative">
          <div className="container-page py-14 md:py-20">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-6 animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
                <span className="tag">Cadastro</span>
                <h1 className="font-display text-3xl md:text-4xl mt-3 leading-tight">
                  Criar conta <span className="title-gradient">Cliente</span>
                </h1>
                <p className="text-white/70 mt-3">
                  Leva menos de 1 minuto. Depois é só agendar.
                </p>
              </div>

              <div className="card p-6 md:p-8 animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
                <form onSubmit={handleRegister} className="space-y-4">
                  {erro && <div className="alert-error">{erro}</div>}

                  <div>
                    <label className="label-dark">Nome</label>
                    <input
                      className="input-dark"
                      placeholder="Seu nome completo"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      autoComplete="name"
                    />
                  </div>

                  <div>
                    <label className="label-dark">Telefone (WhatsApp)</label>
                    <input
                      className="input-dark"
                      placeholder="(11) 99999-9999"
                      value={telefone}
                      onChange={(e) => setTelefone(formatTelefoneBR(e.target.value))}
                      inputMode="tel"
                      autoComplete="tel"
                    />
                    <p className="text-[11px] text-white/55 mt-2">
                      Usado para contato e confirmação do agendamento.
                    </p>
                  </div>

                  <div>
                    <label className="label-dark">E-mail</label>
                    <input
                      className="input-dark"
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <label className="label-dark">Senha</label>
                    <div className="flex gap-2">
                      <input
                        className="input-dark"
                        type={showSenha ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        autoComplete="new-password"
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
                  </div>

                  <div>
                    <label className="label-dark">Confirmar senha</label>
                    <div className="flex gap-2">
                      <input
                        className="input-dark"
                        type={showConfirmar ? "text" : "password"}
                        placeholder="Repita a senha"
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmar((v) => !v)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/80 hover:bg-white/10 transition"
                        aria-label={showConfirmar ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {confirmarSenha.length > 0 && senha !== confirmarSenha && (
                      <p className="text-[11px] text-red-300 mt-2">As senhas não coincidem.</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!podeEnviar}
                    className={[
                      "btn-gold w-full justify-center",
                      !podeEnviar ? "opacity-60 pointer-events-none" : "",
                    ].join(" ")}
                  >
                    {loading ? "Criando..." : "Criar conta"}
                  </button>

                  <Link to="/login" className="btn-outline w-full justify-center">
                    Voltar para login
                  </Link>
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
