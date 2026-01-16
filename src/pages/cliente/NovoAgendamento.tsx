import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppShell } from "../../components/layout/AppShell";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Step } from "../../components/ui/Step";
import { CalendarPicker } from "../../components/ui/CalendarPicker";
import type { RefObject } from "react";

import { useAuth } from "../../auth/AuthContext";
import * as ServicosApi from "../../api/servicos";
import { listarHorariosDisponiveis } from "../../api/horarios";
import * as CriarAgendamentoApi from "../../api/criarAgendamento";
import * as PagamentosApi from "../../api/pagamentos";
import * as AgendamentosApi from "../../api/agendamentos";

type CheckoutStatus = "IDLE" | "REDIRECIONANDO" | "AGUARDANDO_PAGAMENTO" | "PAGO";

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

  // PAGAMENTO (seleção)
  const [pagamentoTipo, setPagamentoTipo] =
    useState<CriarAgendamentoApi.FormaPagamentoTipo>("PIX");
  const [pagamentoModo, setPagamentoModo] =
    useState<CriarAgendamentoApi.FormaPagamentoModo>("PAGAR_NA_HORA");

  // PAGAMENTO ONLINE real
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>("IDLE");
  const [pagamentoId, setPagamentoId] = useState<number | null>(null);
  const [pixQrBase64, setPixQrBase64] = useState<string | null>(null);
  const [pixCopiaCola, setPixCopiaCola] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const pollingRef = useRef<number | null>(null);

  // LEMBRETE
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

  // Auxiliares
  const [loadingServicos, setLoadingServicos] = useState(true);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Refs de scroll dos steps
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const step4Ref = useRef<HTMLDivElement>(null);
  const step5Ref = useRef<HTMLDivElement>(null);

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
    pararPolling();
  }

  function scrollToRef(ref: RefObject<HTMLDivElement | null>) {
  const el = ref.current;
  if (!el) return;

  window.setTimeout(() => {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 80);
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

  // Resets quando muda serviços ou data
  useEffect(() => {
    setHorarios([]);
    setHorarioSelecionado("");
    limparPagamentoUi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicosSelecionados, data]);

  useEffect(() => {
    limparPagamentoUi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagamentoTipo, pagamentoModo, horarioSelecionado]);

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
  const step4Done = step3Done;
  const step5Done = step4Done;

  const podeConfirmar =
    !!user && data && horarioSelecionado && servicosSelecionados.length > 0;

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

  // NOVO: buscar horários automaticamente quando tiver serviços + data
  useEffect(() => {
    async function carregarHorariosAuto() {
      if (!step2Done) return;

      const reqId = ++horariosReqIdRef.current;

      try {
        setErro(null);
        setLoadingHorarios(true);

        const resp = await listarHorariosDisponiveis(data, servicosSelecionados);

        // se já houve outra requisição depois, ignora
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

    // pequeno debounce pra evitar disparos múltiplos em mudanças rápidas
    const t = window.setTimeout(() => {
      carregarHorariosAuto();
    }, 180);

    return () => window.clearTimeout(t);
  }, [step2Done, data, servicosSelecionados]);

  async function confirmarAgendamentoPagarNaHora() {
    if (!podeConfirmar || !user) return;

    if (pagamentoModo === "ONLINE") {
      setErro("Para pagamento online, clique em 'Ir para pagamento'.");
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

      navigate("/cliente");
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

      const ag = await CriarAgendamentoApi.criarAgendamento({
        servicosIds: servicosSelecionados,
        data,
        horarioInicio: horarioSelecionado,
        formaPagamentoTipo: pagamentoTipo,
        formaPagamentoModo: "ONLINE",
        lembreteMinutos,
      });

      agendamentoCriadoId = ag.id;

      const estrategia: PagamentosApi.TipoPagamentoStrategy =
        pagamentoTipo === "PIX" ? "PIX_DIRECT" : "CHECKOUT_PRO";

      const tipoPagamento: "PIX" | "CARTAO" =
        pagamentoTipo === "PIX" ? "PIX" : "CARTAO";

      const pay = await PagamentosApi.criarPagamento({
        agendamentoId: ag.id,
        tipoPagamento,
        estrategia,
      });

      setPagamentoId(pay.pagamentoId);
      setPixQrBase64(pay.qrCodeBase64);
      setPixCopiaCola(pay.copiaCola);
      setCheckoutUrl(pay.checkoutUrl);
      setCheckoutStatus("AGUARDANDO_PAGAMENTO");

      if (pay.checkoutUrl) {
        window.open(pay.checkoutUrl, "_blank", "noopener,noreferrer");
      }

      pararPolling();
      pollingRef.current = window.setInterval(async () => {
        try {
          const st = await PagamentosApi.buscarPagamentoPorId(pay.pagamentoId);

          if (st.status === "PAGO") {
            setCheckoutStatus("PAGO");
            pararPolling();
            navigate("/cliente");
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
        navigate("/cliente");
      } else if (st.status === "CANCELADO" || st.status === "FALHOU") {
        setErro(`Pagamento ${st.status}.`);
        setCheckoutStatus("IDLE");
        pararPolling();
      } else {
        setErro(`Status atual: ${st.status}`);
      }
    } catch (e) {
      console.error(e);
      setErro("Não foi possível consultar o status agora.");
    }
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">Novo Agendamento</h1>
        <Button variant="secondary" onClick={() => navigate("/cliente")}>
          Voltar
        </Button>
      </div>

      {erro && (
        <div className="mb-4 bg-red-100 border border-red-300 p-3 rounded animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
          {erro}
        </div>
      )}

      <Card>
        <CardContent>
          {/* STEP 1 */}
          <Step
            step={1}
            title="Serviços"
            subtitle="Selecione um ou mais serviços."
            open={true}
            done={step1Done}
          >
            {loadingServicos ? (
              <p className="text-sm text-gray-600">Carregando...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {servicos.map((s) => {
                  const ativo = servicosSelecionados.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleServico(s.id)}
                      className={[
                        "border rounded-xl p-3 text-left transition-colors",
                        ativo
                          ? "border-black bg-gray-50"
                          : "border-gray-200 hover:bg-gray-50",
                      ].join(" ")}
                    >
                      <p className="font-medium">{s.nome}</p>
                      <p className="text-sm text-gray-600">
                        {s.duracaoMinutos} min • R$ {s.preco.toFixed(2)}
                      </p>
                      {ativo && <p className="text-xs text-gray-500 mt-2">Selecionado</p>}
                    </button>
                  );
                })}
              </div>
            )}

            {resumo.lista.length > 0 && (
              <div className="mt-3 text-sm">
                Total: <strong>R$ {resumo.total.toFixed(2)}</strong> • {resumo.duracao} min
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
            <CalendarPicker
              value={data}
              onChange={(v) => setData(v)}
              minDate={new Date()}
            />
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
                <p className="text-sm text-gray-600">
                  Selecionado: <strong>{horarioSelecionado}</strong>
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  Selecione um horário abaixo.
                </p>
              )}

              {loadingHorarios && (
                <p className="text-sm text-gray-500">Carregando horários...</p>
              )}
            </div>

            {!loadingHorarios && horarios.length === 0 && (
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
    <p className="text-sm font-medium">Sem horários disponíveis</p>
    <p className="text-sm text-gray-600 mt-1">
      Selecione outro dia para ver novos horários.
    </p>

    <div className="mt-3">
      <Button
        variant="secondary"
        onClick={() => {
          setData("");
          setHorarios([]);
          setHorarioSelecionado("");
        }}
      >
        Escolher outra data
      </Button>
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
                        "border rounded-lg px-2 py-2 text-sm transition-colors",
                        ativo
                          ? "border-black bg-gray-50 font-semibold"
                          : "border-gray-200 hover:bg-gray-50",
                      ].join(" ")}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            )}
          </Step>

          {/* STEP 4 */}
          <Step
            step={4}
            title="Pagamento"
            subtitle="Escolha tipo e se será online ou na hora."
            open={step3Done}
            done={step4Done}
            containerRef={step4Ref}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Tipo</label>
                <select
                  className="border rounded-lg px-3 py-2 w-full"
                  value={pagamentoTipo}
                  onChange={(e) =>
                    setPagamentoTipo(
                      e.target.value as CriarAgendamentoApi.FormaPagamentoTipo
                    )
                  }
                >
                  <option value="PIX">PIX</option>
                  <option value="CARTAO">Cartão</option>
                  <option value="DINHEIRO">Dinheiro</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500">Modo</label>
                <select
                  className="border rounded-lg px-3 py-2 w-full"
                  value={pagamentoModo}
                  onChange={(e) =>
                    setPagamentoModo(
                      e.target.value as CriarAgendamentoApi.FormaPagamentoModo
                    )
                  }
                >
                  <option value="PAGAR_NA_HORA">Pagar na hora</option>
                  <option value="ONLINE">Online</option>
                </select>
              </div>
            </div>

            {pagamentoModo === "ONLINE" && (
              <div className="mt-4">
                {checkoutStatus === "IDLE" && (
                  <Button
                    variant="primary"
                    onClick={iniciarPagamentoOnline}
                    disabled={!podeConfirmar}
                  >
                    Ir para pagamento
                  </Button>
                )}

                {checkoutStatus === "REDIRECIONANDO" && (
                  <p className="text-sm text-gray-600 mt-2">Preparando pagamento...</p>
                )}

                {checkoutStatus === "AGUARDANDO_PAGAMENTO" && (
                  <div className="mt-3 border rounded-xl p-3">
                    <p className="font-medium mb-2">Aguardando confirmação do pagamento...</p>

                    {checkoutUrl && (
                      <p className="text-sm text-gray-600">
                        Checkout aberto em nova aba. Volte aqui e aguarde.
                      </p>
                    )}

                    {pixQrBase64 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">PIX</p>

                        <div className="flex flex-col sm:flex-row gap-3 items-start">
                          <img
                            src={`data:image/png;base64,${pixQrBase64}`}
                            alt="QR Code PIX"
                            className="w-52 h-52 border rounded-lg"
                          />

                          {pixCopiaCola && (
                            <div className="w-full">
                              <p className="text-xs text-gray-600 mb-1">Copia e cola</p>
                              <textarea
                                className="border rounded-lg p-2 w-full text-xs"
                                rows={4}
                                value={pixCopiaCola}
                                readOnly
                              />
                              <div className="mt-2">
                                <Button
                                  variant="secondary"
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(pixCopiaCola);
                                    } catch {}
                                  }}
                                >
                                  Copiar código
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {pagamentoId && (
                      <p className="mt-2 text-xs text-gray-500">Pagamento #{pagamentoId}</p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={verificarStatusAgora}>
                        Verificar status
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => {
                          limparPagamentoUi();
                          setErro(null);
                        }}
                      >
                        Voltar
                      </Button>
                    </div>
                  </div>
                )}

                {checkoutStatus === "PAGO" && (
                  <div className="mt-3 border rounded-xl p-3">
                    <p className="font-medium">Pagamento confirmado. Redirecionando...</p>
                  </div>
                )}
              </div>
            )}
          </Step>

          {/* STEP 5 */}
          <Step
            step={5}
            title="Lembrete"
            subtitle="Defina se quer receber lembrete antes do horário."
            open={step4Done}
            done={step5Done}
            containerRef={step5Ref}
          >
            <select
              className="border rounded-lg px-3 py-2 w-full sm:max-w-sm"
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
              <div className="mt-3">
                <label className="block text-sm mb-1">Quantos minutos antes?</label>
                <input
                  type="number"
                  min={1}
                  className="border rounded-lg px-3 py-2 w-40"
                  value={lembreteMinutos}
                  onChange={(e) => setLembreteMinutos(Number(e.target.value))}
                />
              </div>
            )}

            <div className="mt-5">
              <Button
                variant="primary"
                onClick={confirmarAgendamentoPagarNaHora}
                disabled={!podeConfirmar || pagamentoModo === "ONLINE"}
              >
                Finalizar agendamento
              </Button>

              {pagamentoModo === "ONLINE" && (
                <p className="mt-2 text-sm text-gray-600">
                  Para pagamento online, use “Ir para pagamento”. O agendamento será confirmado
                  quando o pagamento for aprovado.
                </p>
              )}
            </div>
          </Step>
        </CardContent>
      </Card>
    </AppShell>
  );
}
