import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerRequest } from "../../api/auth";

import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

function formatTelefoneBR(raw: string) {
  // Formata progressivo: (11) 99999-9999 ou (11) 9999-9999
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
        telefone: onlyDigits(telefone), // envia limpo pro back (melhor)
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-4 animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
          <p className="text-sm text-gray-600">Criar conta</p>
          <h1 className="text-2xl font-bold">Cliente</h1>
          <p className="text-sm text-gray-600 mt-1">
            Leva menos de 1 minuto. Depois é só agendar.
          </p>
        </div>

        <Card className="animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-3">
              {erro && (
                <div className="bg-red-100 border border-red-300 p-3 rounded animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
                  <p className="text-sm text-red-800">{erro}</p>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nome</label>
                <input
                  className="border rounded-lg px-3 py-2 w-full bg-white"
                  placeholder="Seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Telefone (WhatsApp)</label>
                <input
                  className="border rounded-lg px-3 py-2 w-full bg-white"
                  placeholder="(11) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(formatTelefoneBR(e.target.value))}
                  inputMode="tel"
                  autoComplete="tel"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Usado para contato e confirmação do agendamento.
                </p>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">E-mail</label>
                <input
                  className="border rounded-lg px-3 py-2 w-full bg-white"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Senha</label>
                <div className="flex gap-2">
                  <input
                    className="border rounded-lg px-3 py-2 w-full bg-white"
                    type={showSenha ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha((v) => !v)}
                    className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    {showSenha ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Confirmar senha</label>
                <div className="flex gap-2">
                  <input
                    className="border rounded-lg px-3 py-2 w-full bg-white"
                    type={showConfirmar ? "text" : "password"}
                    placeholder="Repita a senha"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmar((v) => !v)}
                    className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    {showConfirmar ? "Ocultar" : "Mostrar"}
                  </button>
                </div>

                {confirmarSenha.length > 0 && senha !== confirmarSenha && (
                  <p className="text-[11px] text-red-600 mt-1">
                    As senhas não coincidem.
                  </p>
                )}
              </div>

              <Button
                variant="primary"
                type="submit"
                className="w-full"
                loading={loading}
                disabled={!podeEnviar}
              >
                Criar conta
              </Button>

              <Button
                variant="secondary"
                type="button"
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Voltar para login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
