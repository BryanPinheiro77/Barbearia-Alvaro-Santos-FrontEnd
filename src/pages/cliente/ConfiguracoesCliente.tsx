import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    nome: "",
    email: "",
    telefone: "",
  });

  // Guardar valores originais para detectar mudança
  const originalRef = useRef<{ email: string; telefone: string } | null>(null);

  // senha para confirmar mudança de email/telefone
  const [senhaConfirmacao, setSenhaConfirmacao] = useState("");

  // senha (troca)
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [okSenha, setOkSenha] = useState<string | null>(null);

  const podeSalvar = useMemo(() => {
    return form.nome.trim() && form.email.trim() && form.telefone.trim();
  }, [form]);

  const precisaSenhaParaDados = useMemo(() => {
    const orig = originalRef.current;
    if (!orig) return false;

    const emailMudou = form.email.trim() !== (orig.email ?? "");
    const telMudou = form.telefone.trim() !== (orig.telefone ?? "");
    return emailMudou || telMudou;
  }, [form.email, form.telefone]);

  useEffect(() => {
    (async () => {
      try {
        setErro(null);
        setLoading(true);

        const me = await ClienteApi.buscarMe();

        const email = me.email ?? "";
        const telefone = me.telefone ?? "";

        originalRef.current = { email, telefone };

        setForm({
          nome: me.nome ?? "",
          email,
          telefone,
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

    // Se mudou email/telefone, exige senha
    if (precisaSenhaParaDados && !senhaConfirmacao.trim()) {
      setErro("Para alterar e-mail ou telefone, informe sua senha atual.");
      return;
    }

    try {
      setOkMsg(null);
      setErro(null);
      setSalvando(true);

      const orig = originalRef.current;
      const emailAntes = orig?.email ?? "";

      const atualizado = await ClienteApi.atualizarMe({
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim(),
        senhaAtual: precisaSenhaParaDados ? senhaConfirmacao : undefined,
      });

      // Atualiza original após salvar com sucesso
      originalRef.current = {
        email: atualizado.email ?? form.email.trim(),
        telefone: atualizado.telefone ?? form.telefone.trim(),
      };

      // Se o email mudou, token antigo fica inválido -> força login de novo
      const emailDepois = (atualizado.email ?? "").trim();
      const emailMudouDeVerdade = emailDepois && emailDepois !== emailAntes;

      if (emailMudouDeVerdade) {
        setOkMsg("E-mail alterado. Faça login novamente.");
        logout();
        navigate("/login", { replace: true });
        return;
      }

      // Atualiza AuthContext para refletir o nome na UI
      login({
        ...user,
        nome: atualizado.nome,
      });

      setSenhaConfirmacao("");
      setOkMsg("Dados atualizados com sucesso.");
    } catch (e: any) {
      console.error(e);

      const msg = String(e?.message || "");

      if (msg.includes("HTTP 401")) {
        setErro("Senha atual incorreta.");
      } else if (msg.includes("HTTP 409")) {
        setErro("Este e-mail já está em uso.");
      } else {
        setErro("Não foi possível salvar. Verifique os dados e tente novamente.");
      }
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
        senhaAtual,
        novaSenha,
      });

      setSenhaAtual("");
      setNovaSenha("");
      setOkSenha("Senha atualizada com sucesso.");
    } catch (e: any) {
      console.error(e);

      const msg = String(e?.message || "");
      if (msg.includes("HTTP 401")) {
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

                {precisaSenhaParaDados && (
                  <div className="sm:col-span-2">
                    <label className="label-dark">
                      Senha atual (obrigatória para alterar e-mail/telefone)
                    </label>
                    <input
                      className="input-dark"
                      type="password"
                      value={senhaConfirmacao}
                      onChange={(e) => setSenhaConfirmacao(e.target.value)}
                      placeholder="Digite sua senha atual"
                    />
                    <p className="text-xs text-white/55 mt-2">
                      Você só precisa preencher isso se tiver mudado e-mail ou telefone.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  className={[
                    "btn-gold",
                    (!podeSalvar || salvando) ? "opacity-60 pointer-events-none" : "",
                  ].join(" ")}
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
                <p className="text-white/70 mt-1 text-sm">
                  Informe sua senha atual e defina uma nova.
                </p>

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
                    className={[
                      "btn-gold",
                      salvandoSenha ? "opacity-60 pointer-events-none" : "",
                    ].join(" ")}
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
