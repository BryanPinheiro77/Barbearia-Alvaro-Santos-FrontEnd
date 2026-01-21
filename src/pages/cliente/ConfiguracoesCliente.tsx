import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { useAuth } from "../../auth/AuthContext";
import * as ClienteApi from "../../api/cliente";

type FormState = {
  nome: string;
  email: string;
  telefone: string;
};

export default function ConfiguracoesCliente() {
  const { user, login, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    nome: "",
    email: "",
    telefone: "",
  });

  // senha
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [okSenha, setOkSenha] = useState<string | null>(null);

  const podeSalvar = useMemo(() => {
    return form.nome.trim() && form.email.trim() && form.telefone.trim();
  }, [form]);

  useEffect(() => {
    (async () => {
      try {
        setErro(null);
        setLoading(true);

        const me = await ClienteApi.buscarMe();
        setForm({
          nome: me.nome ?? "",
          email: me.email ?? "",
          telefone: me.telefone ?? "",
        });
      } catch (e) {
        console.error(e);
        setErro("Não foi possível carregar seus dados agora.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function salvarDados() {
    if (!user) return;

    try {
      setOkMsg(null);
      setErro(null);
      setSalvando(true);

      const atualizado = await ClienteApi.atualizarMe({
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim(),
      });

      // Atualiza AuthContext para refletir o nome na UI
      login({
        ...user,
        nome: atualizado.nome,
      });

      setOkMsg("Dados atualizados com sucesso.");
    } catch (e) {
      console.error(e);
      setErro("Não foi possível salvar. Verifique os dados e tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarSenha() {
    if (!senhaAtual.trim() || !novaSenha.trim()) {
      setErroSenha("Preencha a senha atual e a nova senha.");
      return;
    }

    try {
      setErroSenha(null);
      setOkSenha(null);
      setSalvandoSenha(true);

      await ClienteApi.trocarSenha({
        senhaAtual: senhaAtual,
        novaSenha: novaSenha,
      });

      setSenhaAtual("");
      setNovaSenha("");
      setOkSenha("Senha atualizada com sucesso.");
    } catch (e: any) {
      console.error(e);

      // seu back retorna 401 quando senha atual está errada
      if (e?.response?.status === 401) {
        setErroSenha("Senha atual incorreta.");
      } else {
        setErroSenha("Não foi possível atualizar a senha agora.");
      }
    } finally {
      setSalvandoSenha(false);
    }
  }

  return (
    <AppShell>
      <div className="container-page py-6">
        <div className="card">
          <h1 className="font-display text-2xl">Configurações</h1>
          <p className="text-white/70 mt-2">Atualize seus dados e sua senha.</p>

          {loading ? (
            <p className="text-sm text-white/70 mt-4">Carregando...</p>
          ) : (
            <>
              {erro && (
                <div className="alert-error mt-4 animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
                  {erro}
                </div>
              )}

              {okMsg && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/85">{okMsg}</p>
                </div>
              )}

              {/* Dados */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label-dark">Nome</label>
                  <input
                    className="input-dark"
                    value={form.nome}
                    onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                    placeholder="Seu nome"
                  />
                </div>

                <div>
                  <label className="label-dark">Telefone</label>
                  <input
                    className="input-dark"
                    value={form.telefone}
                    onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="label-dark">E-mail</label>
                  <input
                    className="input-dark"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="seuemail@exemplo.com"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  className={["btn-gold", (!podeSalvar || salvando) ? "opacity-60 pointer-events-none" : ""].join(" ")}
                  onClick={salvarDados}
                  disabled={!podeSalvar || salvando}
                >
                  {salvando ? "Salvando..." : "Salvar dados"}
                </button>

                <button className="btn-outline" onClick={() => logout()}>
                  Sair
                </button>
              </div>

              {/* Senha */}
              <div className="mt-8 border-t border-white/10 pt-6">
                <h2 className="font-display text-xl">Alterar senha</h2>
                <p className="text-white/70 mt-1 text-sm">Informe sua senha atual e defina uma nova.</p>

                {erroSenha && (
                  <div className="alert-error mt-4 animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
                    {erroSenha}
                  </div>
                )}

                {okSenha && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-white/85">{okSenha}</p>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label-dark">Senha atual</label>
                    <input
                      className="input-dark"
                      type="password"
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="label-dark">Nova senha</label>
                    <input
                      className="input-dark"
                      type="password"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <button
                    className={["btn-gold", salvandoSenha ? "opacity-60 pointer-events-none" : ""].join(" ")}
                    onClick={salvarSenha}
                    disabled={salvandoSenha}
                  >
                    {salvandoSenha ? "Salvando..." : "Atualizar senha"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
