import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { RefObject } from "react";

import { AppShell } from "../../components/layout/AppShell";
import { Step } from "../../components/ui/Step";
import { CalendarPicker } from "../../components/ui/CalendarPicker";

import { useAuth } from "../../auth/AuthContext";
import * as ServicosApi from "../../api/servicos";
import { listarHorariosDisponiveis } from "../../api/horarios";
import * as CriarAgendamentoApi from "../../api/criarAgendamento";
import * as PagamentosApi from "../../api/pagamentos";
import * as AgendamentosApi from "../../api/agendamentos";

type CheckoutStatus = "IDLE" | "REDIRECIONANDO" | "AGUARDANDO_PAGAMENTO" | "PAGO";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(ua);
}

export default function NovoAgendamento() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // SERVIÇOS
  const [servicos, setServicos] = useState<ServicosApi.Servico[]>([]);
  const [servicosSelecionados, setServicosSelecionados] = useState<number[]>([]);

  // DATA / HORÁRIO
  const [data, setData] = useState("");
  const [horarios, setHorarios] = useState<string[]>([]);
  const [horarioSelecionado, setHorarioSelecionado] = useState("");

  // LEMBRETE (AGORA É O STEP 4)
  const lembretesPreDefinidos = [
    { label: "Sem lembrete", value: 0 },
    { label: "15 minutos antes", value: 15 },
    { label: "30 minutos antes", value: 30 },
    { label: "1 hora antes", value: 60 },
    { label: "2 horas antes", value: 120 },
    { label: "1 dia antes", value: 1440 },
  ];
  const [lembreteMinutos, setLembreteMinutos] = useState<number>(30);
  const [lembretePersonalizado, setLembretePersonalizado] = useState(false);

  // PAGAMENTO (AGORA É O STEP 5)
  const [pagamentoTipo, setPagamentoTipo] =
    useState<CriarAgendamentoApi.FormaPagamentoTipo>("PIX");
  const [pagamentoModo, setPagamentoModo] =
    useState<CriarAgendamentoApi.FormaPagamentoModo>("PAGAR_NA_HORA");

  // PAGAMENTO ONLINE (estado)
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>("IDLE");
  const [pagamentoId, setPagamentoId] = useState<number | null>(null);
  const [pixQrBase64, setPixQrBase64] = useState<string | null>(null);
  const [pixCopiaCola, setPixCopiaCola] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [, setAgendamentoOnlineId] = useState<number | null>(null);
  const pollingRef = useRef<number | null>(null);

  // Auxiliares
  const [loadingServicos, setLoadingServicos] = useState(true);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Refs de scroll dos steps
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const step4Ref = useRef<HTMLDivElement>(null); // Lembrete
  const step5Ref = useRef<HTMLDivElement>(null); // Pagamento

  // Para evitar corrida de requisições de horários
  const horariosReqIdRef = useRef(0);

  function pararPolling() {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  function limparPagamentoUi() {
    setCheckoutStatus("IDLE");
    setPagamentoId(null);
    setPixQrBase64(null);
    setPixCopiaCola(null);
    setCheckoutUrl(null);
    setAgendamentoOnlineId(null);
    pararPolling();
  }

  function scrollToRef(ref: RefObject<HTMLDivElement | null>) {
    const el = ref.current;
    if (!el) return;

    window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function limparPersistenciaPagamento() {
    localStorage.removeItem("ultimoPagamentoId");
    localStorage.removeItem("ultimoAgendamentoId");
    localStorage.removeItem("novoAgendamentoDraft"); // caso exista de versões antigas
  }

  // Carregar serviços
  useEffect(() => {
    (async () => {
      try {
        setLoadingServicos(true);
        const lista = await ServicosApi.listarServicosAtivos();
        setServicos(lista);
      } catch (e) {
        console.error(e);
        setErro("Não foi possível carregar os serviços.");
      } finally {
        setLoadingServicos(false);
      }
    })();
  }, []);

  // Resets quando muda serviços ou data (muda tudo do fluxo)
  useEffect(() => {
    setHorarios([]);
    setHorarioSelecionado("");
    limparPagamentoUi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicosSelecionados, data]);

  // Resets quando muda horário (pode mudar total/agenda e invalida pagamento anterior)
  useEffect(() => {
    if (checkoutStatus === "PAGO") return;
    limparPagamentoUi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horarioSelecionado]);

  // Resets quando muda lembrete (evita pagar e depois alterar regra do lembrete do mesmo agendamento)
  useEffect(() => {
    if (checkoutStatus === "IDLE") return;
    if (checkoutStatus === "PAGO") return;
    limparPagamentoUi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lembreteMinutos, lembretePersonalizado]);

  useEffect(() => {
    return () => pararPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derivados
  const resumo = useMemo(() => {
    const lista = servicos.filter((s) => servicosSelecionados.includes(s.id));
    return {
      lista,
      total: lista.reduce((acc, s) => acc + s.preco, 0),
      duracao: lista.reduce((acc, s) => acc + s.duracaoMinutos, 0),
    };
  }, [servicos, servicosSelecionados]);

  const step1Done = servicosSelecionados.length > 0;
  const step2Done = step1Done && !!data;
  const step3Done = step2Done && !!horarioSelecionado;

  // lembrete tem default, então basta ter horário
  const step4Done = step3Done;

  // pagamento é o final
  const step5Done = step4Done;

  const podeConfirmar = !!user && data && horarioSelecionado && servicosSelecionados.length > 0;

  // Auto-scroll quando os steps liberarem
  const prevStep1Done = useRef(false);
  const prevStep2Done = useRef(false);
  const prevStep3Done = useRef(false);
  const prevStep4Done = useRef(false);

  useEffect(() => {
    if (step1Done && !prevStep1Done.current) scrollToRef(step2Ref);
    prevStep1Done.current = step1Done;
  }, [step1Done]);

  useEffect(() => {
    if (step2Done && !prevStep2Done.current) scrollToRef(step3Ref);
    prevStep2Done.current = step2Done;
  }, [step2Done]);

  useEffect(() => {
    if (step3Done && !prevStep3Done.current) scrollToRef(step4Ref);
    prevStep3Done.current = step3Done;
  }, [step3Done]);

  useEffect(() => {
    if (step4Done && !prevStep4Done.current) scrollToRef(step5Ref);
    prevStep4Done.current = step4Done;
  }, [step4Done]);

  function toggleServico(id: number) {
    setServicosSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // buscar horários automaticamente quando tiver serviços + data
  useEffect(() => {
    async function carregarHorariosAuto() {
      if (!step2Done) return;

      const reqId = ++horariosReqIdRef.current;

      try {
        setErro(null);
        setLoadingHorarios(true);

        const resp = await listarHorariosDisponiveis(data, servicosSelecionados);

        if (reqId !== horariosReqIdRef.current) return;

        setHorarios(resp.horarios || []);
      } catch (e) {
        console.error(e);
        if (reqId !== horariosReqIdRef.current) return;

        setHorarios([]);
        setErro("Erro ao carregar horários.");
      } finally {
        if (reqId === horariosReqIdRef.current) {
          setLoadingHorarios(false);
        }
      }
    }

    const t = window.setTimeout(() => {
      carregarHorariosAuto();
    }, 180);

    return () => window.clearTimeout(t);
  }, [step2Done, data, servicosSelecionados]);

  async function confirmarAgendamentoPagarNaHora() {
    if (!podeConfirmar || !user) return;

    if (pagamentoModo === "ONLINE") {
      setErro("Para pagamento online, use 'Ir para pagamento'.");
      return;
    }

    try {
      setErro(null);

      await CriarAgendamentoApi.criarAgendamento({
        servicosIds: servicosSelecionados,
        data,
        horarioInicio: horarioSelecionado,
        formaPagamentoTipo: pagamentoTipo,
        formaPagamentoModo: "PAGAR_NA_HORA",
        lembreteMinutos,
      });

      limparPersistenciaPagamento();
      navigate("/cliente", { replace: true });
    } catch (e) {
      console.error(e);
      setErro("Erro ao confirmar agendamento.");
    }
  }

  async function iniciarPagamentoOnline() {
    if (!user) return;

    if (pagamentoTipo === "DINHEIRO") {
      setErro("Pagamento ONLINE não é permitido para Dinheiro. Selecione PIX ou Cartão.");
      return;
    }

    if (!podeConfirmar) {
      setErro("Selecione serviços, data e horário antes de pagar.");
      return;
    }

    let agendamentoCriadoId: number | null = null;

    try {
      setErro(null);
      limparPagamentoUi();
      setCheckoutStatus("REDIRECIONANDO");

      // 1) cria o agendamento já com o lembrete escolhido (fica reservado)
      const ag = await CriarAgendamentoApi.criarAgendamento({
        servicosIds: servicosSelecionados,
        data,
        horarioInicio: horarioSelecionado,
        formaPagamentoTipo: pagamentoTipo,
        formaPagamentoModo: "ONLINE",
        lembreteMinutos,
      });

      agendamentoCriadoId = ag.id;

      // 2) cria pagamento
      const estrategia: PagamentosApi.TipoPagamentoStrategy =
        pagamentoTipo === "PIX" ? "PIX_DIRECT" : "CHECKOUT_PRO";

      const tipoPagamento: "PIX" | "CARTAO" =
        pagamentoTipo === "PIX" ? "PIX" : "CARTAO";

      const pay = await PagamentosApi.criarPagamento({
        agendamentoId: ag.id,
        tipoPagamento,
        estrategia,
      });

      setAgendamentoOnlineId(ag.id);
      setPagamentoId(pay.pagamentoId);
      setPixQrBase64(pay.qrCodeBase64);
      setPixCopiaCola(pay.copiaCola);
      setCheckoutUrl(pay.checkoutUrl);
      setCheckoutStatus("AGUARDANDO_PAGAMENTO");

      // Para a rota /pagamento/retorno
      localStorage.setItem("ultimoPagamentoId", String(pay.pagamentoId));
      localStorage.setItem("ultimoAgendamentoId", String(ag.id));

      // 3) Se vier checkoutUrl (cartão checkout / redirect), redireciona.
      //    Em mobile, sempre na mesma aba.
      if (pay.checkoutUrl) {
        const mobile = isMobileDevice();

        if (mobile) {
          window.location.assign(pay.checkoutUrl);
          return;
        }

        // desktop: tenta popup (melhor UX), mas cai no redirect se bloquear
        const popup = window.open("about:blank", "_blank", "noopener,noreferrer");
        if (popup) {
          popup.location.replace(pay.checkoutUrl);
        } else {
          window.location.assign(pay.checkoutUrl);
        }
        return;
      }

      // 4) Se NÃO tiver checkoutUrl (PIX Direct), fica na tela e faz polling até PAGO.
      pararPolling();
      pollingRef.current = window.setInterval(async () => {
        try {
          const st = await PagamentosApi.buscarPagamentoPorId(pay.pagamentoId);

          if (st.status === "PAGO") {
            setCheckoutStatus("PAGO");
            pararPolling();

            // fluxo termina aqui
            limparPersistenciaPagamento();
            navigate("/cliente", { replace: true });
            return;
          }

          if (st.status === "CANCELADO" || st.status === "FALHOU") {
            setErro(`Pagamento ${st.status}. Tente novamente.`);
            setCheckoutStatus("IDLE");
            pararPolling();
          }
        } catch {
          // silêncio
        }
      }, 4000);
    } catch (e) {
      console.error(e);

      // Se falhou antes de redirecionar, cancela o agendamento criado
      if (agendamentoCriadoId) {
        try {
          await AgendamentosApi.cancelarAgendamento(agendamentoCriadoId);
        } catch (errCancel) {
          console.error("Falha ao cancelar agendamento após erro no pagamento:", errCancel);
        }
      }

      setErro("Erro ao iniciar pagamento online.");
      setCheckoutStatus("IDLE");
      pararPolling();
    }
  }

  async function verificarStatusAgora() {
    if (!pagamentoId) return;

    try {
      const st = await PagamentosApi.buscarPagamentoPorId(pagamentoId);

      if (st.status === "PAGO") {
        setCheckoutStatus("PAGO");
        pararPolling();

        limparPersistenciaPagamento();
        navigate("/cliente", { replace: true });
        return;
      }

      if (st.status === "CANCELADO" || st.status === "FALHOU") {
        setErro(`Pagamento ${st.status}.`);
        setCheckoutStatus("IDLE");
        pararPolling();
        return;
      }

      setErro(`Status atual: ${st.status}`);
    } catch (e) {
      console.error(e);
      setErro("Não foi possível consultar o status agora.");
    }
  }

  return (
    <AppShell>
      <div className="container-page py-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <span className="tag">Cliente</span>
            <h1 className="font-display text-3xl mt-3">Novo agendamento</h1>
            <p className="text-white/70 mt-2">Selecione serviços, data, horário, lembrete e pagamento.</p>
          </div>

          <button className="btn-outline" onClick={() => navigate("/cliente")}>
            Voltar
          </button>
        </div>

        {erro && (
          <div className="alert-error mb-4 animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
            {erro}
          </div>
        )}

        <div className="card">
          {/* STEP 1 */}
          <Step
            step={1}
            title="Serviços"
            subtitle="Selecione um ou mais serviços."
            open={true}
            done={step1Done}
          >
            {loadingServicos ? (
              <p className="text-sm text-white/70">Carregando...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {servicos.map((s) => {
                  const ativo = servicosSelecionados.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleServico(s.id)}
                      className={[
                        "rounded-2xl border p-4 text-left transition",
                        ativo
                          ? "border-[#d9a441]/50 bg-[#d9a441]/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10",
                      ].join(" ")}
                    >
                      <p className="font-medium text-white/90">{s.nome}</p>
                      <p className="text-sm text-white/65 mt-1">
                        {s.duracaoMinutos} min • {brl(s.preco)}
                      </p>
                      {ativo && <p className="text-xs text-[#d9a441] mt-3">Selecionado</p>}
                    </button>
                  );
                })}
              </div>
            )}

            {resumo.lista.length > 0 && (
              <div className="mt-4 text-sm text-white/75">
                Total: <strong className="text-white">{brl(resumo.total)}</strong> • {resumo.duracao}{" "}
                min
              </div>
            )}
          </Step>

          {/* STEP 2 */}
          <Step
            step={2}
            title="Data"
            subtitle="Escolha a data no calendário."
            open={step1Done}
            done={step2Done}
            containerRef={step2Ref}
          >
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <CalendarPicker value={data} onChange={(v) => setData(v)} minDate={new Date()} />
            </div>
          </Step>

          {/* STEP 3 */}
          <Step
            step={3}
            title="Horário"
            subtitle="Os horários disponíveis aparecem automaticamente após escolher a data."
            open={step2Done}
            done={step3Done}
            containerRef={step3Ref}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              {horarioSelecionado ? (
                <p className="text-sm text-white/70">
                  Selecionado: <strong className="text-white">{horarioSelecionado}</strong>
                </p>
              ) : (
                <p className="text-sm text-white/70">Selecione um horário abaixo.</p>
              )}

              {loadingHorarios && <p className="text-sm text-white/55">Carregando horários...</p>}
            </div>

            {!loadingHorarios && horarios.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-white/90">Sem horários disponíveis</p>
                <p className="text-sm text-white/65 mt-2">Selecione outro dia para ver novos horários.</p>

                <div className="mt-4">
                  <button
                    className="btn-outline"
                    onClick={() => {
                      setData("");
                      setHorarios([]);
                      setHorarioSelecionado("");
                    }}
                  >
                    Escolher outra data
                  </button>
                </div>
              </div>
            )}

            {horarios.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {horarios.map((h) => {
                  const ativo = h === horarioSelecionado;
                  return (
                    <button
                      key={h}
                      onClick={() => setHorarioSelecionado(h)}
                      className={[
                        "rounded-xl border px-2 py-2 text-sm transition",
                        ativo
                          ? "border-[#d9a441]/55 bg-[#d9a441]/10 text-white font-semibold"
                          : "border-white/10 bg-white/5 hover:bg-white/10 text-white/85",
                      ].join(" ")}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            )}
          </Step>

          {/* STEP 4 (AGORA É LEMBRETE) */}
          <Step
            step={4}
            title="Lembrete"
            subtitle="Defina se quer receber lembrete antes do horário."
            open={step3Done}
            done={step4Done}
            containerRef={step4Ref}
          >
            <select
              className="select-dark sm:max-w-sm"
              value={lembretePersonalizado ? "PERSONALIZADO" : lembreteMinutos}
              onChange={(e) => {
                if (e.target.value === "PERSONALIZADO") {
                  setLembretePersonalizado(true);
                  setLembreteMinutos(30);
                } else {
                  setLembretePersonalizado(false);
                  setLembreteMinutos(Number(e.target.value));
                }
              }}
            >
              {lembretesPreDefinidos.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
              <option value="PERSONALIZADO">Personalizado</option>
            </select>

            {lembretePersonalizado && (
              <div className="mt-4">
                <label className="label-dark">Quantos minutos antes?</label>
                <input
                  type="number"
                  min={1}
                  className="input-dark w-40"
                  value={lembreteMinutos}
                  onChange={(e) => setLembreteMinutos(Number(e.target.value))}
                />
              </div>
            )}
          </Step>

          {/* STEP 5 (AGORA É PAGAMENTO) */}
          <Step
            step={5}
            title="Pagamento"
            subtitle="Escolha o tipo e se será online ou na hora."
            open={step4Done}
            done={step5Done}
            containerRef={step5Ref}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label-dark">Tipo</label>
                <select
                  className="select-dark"
                  value={pagamentoTipo}
                  onChange={(e) =>
                    setPagamentoTipo(e.target.value as CriarAgendamentoApi.FormaPagamentoTipo)
                  }
                >
                  <option value="PIX">PIX</option>
                  <option value="CARTAO">Cartão</option>
                  <option value="DINHEIRO">Dinheiro</option>
                </select>
              </div>

              <div>
                <label className="label-dark">Modo</label>
                <select
                  className="select-dark"
                  value={pagamentoModo}
                  onChange={(e) =>
                    setPagamentoModo(e.target.value as CriarAgendamentoApi.FormaPagamentoModo)
                  }
                >
                  <option value="PAGAR_NA_HORA">Pagar na hora</option>
                  <option value="ONLINE">Online</option>
                </select>
              </div>
            </div>

            {/* PAGAR NA HORA */}
            {pagamentoModo !== "ONLINE" && (
              <div className="mt-6">
                <button
                  className={["btn-gold", !podeConfirmar ? "opacity-60 pointer-events-none" : ""].join(" ")}
                  disabled={!podeConfirmar}
                  onClick={confirmarAgendamentoPagarNaHora}
                >
                  Confirmar agendamento
                </button>

                <p className="mt-3 text-sm text-white/70">
                  Você pagará no atendimento. O lembrete será aplicado conforme selecionado.
                </p>
              </div>
            )}

            {/* ONLINE */}
            {pagamentoModo === "ONLINE" && (
              <div className="mt-6">
                {checkoutStatus === "IDLE" && (
                  <button
                    className={["btn-gold", !podeConfirmar ? "opacity-60 pointer-events-none" : ""].join(" ")}
                    onClick={iniciarPagamentoOnline}
                    disabled={!podeConfirmar}
                  >
                    Ir para pagamento
                  </button>
                )}

                {checkoutStatus === "REDIRECIONANDO" && (
                  <p className="text-sm text-white/70 mt-2">Preparando pagamento...</p>
                )}

                {checkoutStatus === "AGUARDANDO_PAGAMENTO" && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="font-medium mb-2 text-white/90">Aguardando confirmação do pagamento...</p>

                    {checkoutUrl && (
                      <p className="text-sm text-white/65">
                        Checkout iniciado. Ao finalizar o pagamento, você será redirecionado.
                      </p>
                    )}

                    {pixQrBase64 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">PIX</p>

                        <div className="flex flex-col sm:flex-row gap-3 items-start">
                          <img
                            src={`data:image/png;base64,${pixQrBase64}`}
                            alt="QR Code PIX"
                            className="w-52 h-52 border border-white/10 rounded-2xl bg-white"
                          />

                          {pixCopiaCola && (
                            <div className="w-full">
                              <p className="text-xs text-white/60 mb-2">Copia e cola</p>
                              <textarea
                                className="w-full rounded-2xl border border-white/10 bg-black/40 p-3 text-xs text-white/85"
                                rows={4}
                                value={pixCopiaCola}
                                readOnly
                              />
                              <div className="mt-3">
                                <button
                                  className="btn-outline"
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(pixCopiaCola);
                                    } catch {}
                                  }}
                                >
                                  Copiar código
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {pagamentoId && (
                      <p className="mt-3 text-xs text-white/50">Pagamento #{pagamentoId}</p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {/* útil principalmente para PIX Direct */}
                      <button className="btn-outline" onClick={verificarStatusAgora}>
                        Verificar status
                      </button>

                      <button
                        className="btn-outline"
                        onClick={() => {
                          limparPagamentoUi();
                          setErro(null);
                        }}
                      >
                        Voltar
                      </button>
                    </div>
                  </div>
                )}

                {checkoutStatus === "PAGO" && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="font-medium text-white/90">
                      Pagamento confirmado. Redirecionando...
                    </p>
                  </div>
                )}

                <p className="mt-3 text-sm text-white/70">
                  No pagamento online, o agendamento é criado para reservar o horário e o sistema confirma após o pagamento.
                  Quando aprovado, você será levado para a área do cliente automaticamente.
                </p>
              </div>
            )}
          </Step>
        </div>
      </div>
    </AppShell>
  );
}
