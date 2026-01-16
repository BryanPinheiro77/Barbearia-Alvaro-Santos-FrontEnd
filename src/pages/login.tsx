import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { loginRequest } from "../api/auth";

import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-4 animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
          <p className="text-sm text-gray-600">Bem-vindo(a) à</p>
          <h1 className="text-2xl font-bold">Barbearia Alvaro Santos</h1>
          <p className="text-sm text-gray-600 mt-1">
            Faça login para ver seus agendamentos.
          </p>
        </div>

        <Card className="animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-3">
              {erro && (
                <div className="bg-red-100 border border-red-300 p-3 rounded animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
                  <p className="text-sm text-red-800">{erro}</p>
                </div>
              )}

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
                    placeholder="Sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha((v) => !v)}
                    className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                    aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showSenha ? "Ocultar" : "Mostrar"}
                  </button>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <button
                    type="button"
                    className="text-xs text-gray-600 underline hover:text-gray-800"
                    onClick={() => setErro("Recuperação de senha: implementaremos nas Configurações.")}
                  >
                    Esqueci minha senha
                  </button>

                  <span className="text-xs text-gray-500">
                    {senha.length > 0 && senha.length < 6 ? "Senha curta" : ""}
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                type="submit"
                disabled={!podeEnviar}
                loading={loading}
                className="w-full"
              >
                Entrar
              </Button>

              <div className="pt-1">
                <Button
                  variant="secondary"
                  type="button"
                  className="w-full"
                  onClick={() => navigate("/register")}
                >
                  Criar conta
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
