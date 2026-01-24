import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { RefObject } from "react";

import { AppShell } from "../../components/layout/AppShell";
import { Step } from "../../components/ui/Step";
import { CalendarPicker } from "../../components/ui/CalendarPicker";

import * as ServicosApi from "../../api/servicos";
import { listarHorariosDisponiveis } from "../../api/horarios";
import * as AdminAgendamentosApi from "../../api/adminAgendamentos";
import { listarClientesAdmin, type ClienteAdmin } from "../../api/adminClientes";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// util: data "YYYY-MM-DD" é hoje?
function isHoje(data: string) {
  if (!data) return false;
  const [yyyy, mm, dd] = data.split("-").map(Number);
  const now = new Date();
  return (
    yyyy === now.getFullYear() && mm === now.getMonth() + 1 && dd === now.getDate()
  );
}

// util: filtra horários passados se a data selecionada for hoje
function filtrarHorariosPassadosHoje(
  data: string,
  horarios: string[],
  toleranciaMin = 0
) {
  if (!isHoje(data)) return horarios;

  const now = new Date();
  const nowWithTol = new Date(now.getTime() + toleranciaMin * 60 * 1000);

  return horarios.filter((h) => {
    const [hh, min] = h.split(":").map(Number);
    const dt = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hh,
      min,
      0,
      0
    );
    return dt >= nowWithTol;
  });
}

export default function AdminNovoAgendamento() {
  const navigate = useNavigate();

  // =========================
  // CLIENTE (autocomplete)
  // =========================
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");

  const [clientesDb, setClientesDb] = useState<ClienteAdmin[]>([]);
  const [clientesLoading, setClientesLoading] = useState(false);

  const [clienteIdSelecionado, setClienteIdSelecionado] = useState<number | null>(
    null
  );
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  // =========================
  // SERVIÇOS
  // =========================
  const [servicos, setServicos] = useState<ServicosApi.Servico[]>([]);
  const [servicosSelecionados, setServicosSelecionados] = useState<number[]>([]);

  // =========================
  // DATA / HORÁRIO
  // =========================
  const [data, setData] = useState("");
  const [horarios, setHorarios] = useState<string[]>([]);
  const [horarioSelecionado, setHorarioSelecionado] = useState("");

  // =========================
  // PAGAMENTO (ADMIN: sem ONLINE)
  // =========================
  const [pagamentoTipo, setPagamentoTipo] =
    useState<AdminAgendamentosApi.FormaPagamentoTipo>("PIX");
  const [pago, setPago] = useState<boolean>(false);

  // =========================
  // Auxiliares
  // =========================
  const [loadingServicos, setLoadingServicos] = useState(true);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Refs de scroll dos steps
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const step4Ref = useRef<HTMLDivElement>(null);
  const step5Ref = useRef<HTMLDivElement>(null);

  // Para evitar corrida de requisições de horários
  const horariosReqIdRef = useRef(0);

  function scrollToRef(ref: RefObject<HTMLDivElement | null>) {
    const el = ref.current;
    if (!el) return;

    window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  // =========================
  // Carregar serviços
  // =========================
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

  // =========================
  // Carregar clientes (autocomplete)
  // =========================
  useEffect(() => {
    (async () => {
      try {
        setClientesLoading(true);
        const lista = await listarClientesAdmin();
        setClientesDb(lista);
      } catch (e) {
        console.error(e);
        // não trava o fluxo; apenas sem autocomplete
      } finally {
        setClientesLoading(false);
      }
    })();
  }, []);

  // Se o admin mexer no nome depois de selecionar um cliente, desfaz o vínculo
  useEffect(() => {
    if (clienteIdSelecionado == null) return;

    const atual = clientesDb.find((x) => x.id === clienteIdSelecionado);
    if (!atual) return;

    // se o nome digitado divergir do nome do cliente selecionado, solta o vínculo
    if (clienteNome.trim() !== (atual.nome || "").trim()) {
      setClienteIdSelecionado(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteNome]);

  const sugestoes = useMemo(() => {
    const t = clienteNome.trim().toLowerCase();
    if (t.length < 2) return [];

    return clientesDb
      .filter((c) => {
        const nome = (c.nome || "").toLowerCase();
        const tel = (c.telefone || "").toLowerCase();
        return nome.includes(t) || tel.includes(t);
      })
      .slice(0, 8);
  }, [clientesDb, clienteNome]);

  function selecionarCliente(c: ClienteAdmin) {
    setClienteIdSelecionado(c.id);
    setClienteNome(c.nome || "");
    setClienteTelefone(c.telefone || "");
    setMostrarSugestoes(false);
    setErro(null);
  }

  // =========================
  // Resets quando muda serviços ou data
  // =========================
  useEffect(() => {
    setHorarios([]);
    setHorarioSelecionado("");
  }, [servicosSelecionados, data]);

  // =========================
  // Resumo
  // =========================
  const resumo = useMemo(() => {
    const lista = servicos.filter((s) => servicosSelecionados.includes(s.id));
    return {
      lista,
      total: lista.reduce((acc, s) => acc + s.preco, 0),
      duracao: lista.reduce((acc, s) => acc + s.duracaoMinutos, 0),
    };
  }, [servicos, servicosSelecionados]);

  // =========================
  // Steps
  // =========================
  const step1Done = clienteNome.trim().length > 0;
  const step2Done = step1Done && servicosSelecionados.length > 0;
  const step3Done = step2Done && !!data;
  const step4Done = step3Done && !!horarioSelecionado;
  const step5Done = step4Done;

  const podeConfirmar =
    step4Done &&
    servicosSelecionados.length > 0 &&
    !!data &&
    !!horarioSelecionado &&
    !salvando;

  // Auto-scroll quando os steps liberarem
  const prevStep1Done = useRef(false);
  const prevStep2Done = useRef(false);
  const prevStep3Done = useRef(false);
  const prevStep4Done = useRef(false);

  useEffect(() => {
    if (step1Done && !prevStep1Done.current) scrollToRef(step1Ref);
    prevStep1Done.current = step1Done;
  }, [step1Done]);

  useEffect(() => {
    if (step2Done && !prevStep2Done.current) scrollToRef(step2Ref);
    prevStep2Done.current = step2Done;
  }, [step2Done]);

  useEffect(() => {
    if (step3Done && !prevStep3Done.current) scrollToRef(step3Ref);
    prevStep3Done.current = step3Done;
  }, [step3Done]);

  useEffect(() => {
    if (step4Done && !prevStep4Done.current) scrollToRef(step4Ref);
    prevStep4Done.current = step4Done;
  }, [step4Done]);

  function toggleServico(id: number) {
    setServicosSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // =========================
  // buscar horários automaticamente quando tiver serviços + data
  // =========================
  useEffect(() => {
    async function carregarHorariosAuto() {
      if (!step3Done) return;

      const reqId = ++horariosReqIdRef.current;

      try {
        setErro(null);
        setLoadingHorarios(true);

        const resp = await listarHorariosDisponiveis(data, servicosSelecionados);
        if (reqId !== horariosReqIdRef.current) return;

        const lista = filtrarHorariosPassadosHoje(data, resp.horarios || [], 0);
        setHorarios(lista);

        if (horarioSelecionado && !lista.includes(horarioSelecionado)) {
          setHorarioSelecionado("");
        }
      } catch (e) {
        console.error(e);
        if (reqId !== horariosReqIdRef.current) return;

        setHorarios([]);
        setErro("Erro ao carregar horários.");
      } finally {
        if (reqId === horariosReqIdRef.current) setLoadingHorarios(false);
      }
    }

    const t = window.setTimeout(() => {
      carregarHorariosAuto();
    }, 180);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step3Done, data, servicosSelecionados]);

  // =========================
  // Submit
  // =========================
  async function confirmarAdmin() {
    if (!podeConfirmar) return;

    const nome = clienteNome.trim();
    if (!nome) {
      setErro("Informe o nome do cliente.");
      return;
    }

    try {
      setErro(null);
      setSalvando(true);

      await AdminAgendamentosApi.criarAgendamentoAdmin({
        // ✅ se selecionou no autocomplete, manda o id para evitar homônimos
        clienteId: clienteIdSelecionado,

        // mantém nome/telefone também (se não selecionar, o service cria/resolve)
        clienteNome: nome,
        clienteTelefone: clienteTelefone.trim() ? clienteTelefone.trim() : null,

        servicosIds: servicosSelecionados,
        data,
        horarioInicio: horarioSelecionado,

        formaPagamentoTipo: pagamentoTipo,
        formaPagamentoModo: "PAGAR_NA_HORA",

        pago,
      });

      navigate("/admin", { replace: true });
    } catch (e) {
      console.error(e);
      setErro("Erro ao criar agendamento.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <AppShell>
      <div className="container-page py-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <span className="tag">Admin</span>
            <h1 className="font-display text-3xl mt-3">Novo agendamento</h1>
            <p className="text-white/70 mt-2">
              Informe o cliente, selecione serviços, data, horário e pagamento.
            </p>
          </div>

          <button className="btn-outline" onClick={() => navigate("/admin")}>
            Voltar
          </button>
        </div>

        {erro && (
          <div className="alert-error mb-4 animate-[fadeInUp_.18s_ease-out_forwards] opacity-0">
            {erro}
          </div>
        )}

        <div className="card">
          {/* STEP 1 - CLIENTE */}
          <Step
            step={1}
            title="Cliente"
            subtitle="Digite o nome (vai sugerir clientes cadastrados). Telefone é opcional."
            open={true}
            done={step1Done}
            containerRef={step1Ref}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <label className="label-dark">Nome do cliente</label>

                <input
                  className="input-dark"
                  value={clienteNome}
                  onChange={(e) => {
                    setClienteNome(e.target.value);
                    setMostrarSugestoes(true);
                  }}
                  onFocus={() => setMostrarSugestoes(true)}
                  onBlur={() => {
                    // fecha depois de um pequeno delay para permitir clique na sugestão
                    window.setTimeout(() => setMostrarSugestoes(false), 120);
                  }}
                  placeholder="Ex: João Silva"
                />

                {mostrarSugestoes && sugestoes.length > 0 && (
                  <div className="absolute z-20 mt-2 w-full rounded-2xl border border-white/10 bg-black/95 backdrop-blur p-2">
                    <div className="text-xs text-white/60 px-2 py-1">
                      Selecione um cliente (evita homônimos)
                    </div>

                    <div className="flex flex-col gap-1">
                      {sugestoes.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()} // evita blur antes do click
                          onClick={() => selecionarCliente(c)}
                          className="w-full text-left px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-white/90 truncate">
                              {c.nome}
                            </p>
                            <p className="text-xs text-white/60 shrink-0">
                              {c.telefone || "sem telefone"} • #{c.id}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>

                    {clientesLoading && (
                      <div className="text-xs text-white/50 px-2 py-2">
                        Carregando...
                      </div>
                    )}
                  </div>
                )}

                {clienteIdSelecionado && (
                  <p className="text-xs text-white/55 mt-2">
                    Cliente selecionado:{" "}
                    <strong className="text-white/80">#{clienteIdSelecionado}</strong>
                  </p>
                )}
              </div>

              <div>
                <label className="label-dark">Telefone (opcional)</label>
                <input
                  className="input-dark"
                  value={clienteTelefone}
                  onChange={(e) => setClienteTelefone(e.target.value)}
                  placeholder="Ex: 11999999999"
                />
                <p className="text-xs text-white/55 mt-2">
                  Se você selecionou um cliente acima, este telefone será preenchido
                  automaticamente (pode ajustar).
                </p>
              </div>
            </div>

            <p className="text-xs text-white/55 mt-3">
              Dica: se houver homônimo, selecione pelo telefone/ID na lista.
            </p>
          </Step>

          {/* STEP 2 - SERVIÇOS */}
          <Step
            step={2}
            title="Serviços"
            subtitle="Selecione um ou mais serviços."
            open={step1Done}
            done={step2Done}
            containerRef={step2Ref}
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
                      {ativo && (
                        <p className="text-xs text-[#d9a441] mt-3">Selecionado</p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {resumo.lista.length > 0 && (
              <div className="mt-4 text-sm text-white/75">
                Total:{" "}
                <strong className="text-white">{brl(resumo.total)}</strong> •{" "}
                {resumo.duracao} min
              </div>
            )}
          </Step>

          {/* STEP 3 - DATA */}
          <Step
            step={3}
            title="Data"
            subtitle="Escolha a data no calendário."
            open={step2Done}
            done={step3Done}
            containerRef={step3Ref}
          >
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <CalendarPicker
                value={data}
                onChange={(v) => setData(v)}
                minDate={new Date()}
              />
            </div>
          </Step>

          {/* STEP 4 - HORÁRIO */}
          <Step
            step={4}
            title="Horário"
            subtitle="Os horários disponíveis aparecem automaticamente após escolher a data."
            open={step3Done}
            done={step4Done}
            containerRef={step4Ref}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              {horarioSelecionado ? (
                <p className="text-sm text-white/70">
                  Selecionado:{" "}
                  <strong className="text-white">{horarioSelecionado}</strong>
                </p>
              ) : (
                <p className="text-sm text-white/70">Selecione um horário abaixo.</p>
              )}

              {loadingHorarios && (
                <p className="text-sm text-white/55">Carregando horários...</p>
              )}
            </div>

            {!loadingHorarios && horarios.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-white/90">
                  Sem horários disponíveis
                </p>
                <p className="text-sm text-white/65 mt-2">
                  Selecione outro dia para ver novos horários.
                </p>

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

          {/* STEP 5 - PAGAMENTO */}
          <Step
            step={5}
            title="Pagamento"
            subtitle="Defina o tipo e se já está pago."
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
                    setPagamentoTipo(
                      e.target.value as AdminAgendamentosApi.FormaPagamentoTipo
                    )
                  }
                >
                  <option value="PIX">PIX</option>
                  <option value="CARTAO">Cartão</option>
                  <option value="DINHEIRO">Dinheiro</option>
                </select>

                <p className="text-xs text-white/55 mt-2">Modo: pagar na hora.</p>
              </div>

              <div>
                <label className="label-dark">Situação</label>

                <button
                  type="button"
                  onClick={() => setPago((v) => !v)}
                  className={[
                    "rounded-2xl border px-4 py-3 text-left transition w-full",
                    pago
                      ? "border-[#2bd576]/40 bg-[#2bd576]/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10",
                  ].join(" ")}
                >
                  <p className="font-medium text-white/90">
                    {pago ? "Pago" : "Pendente"}
                  </p>
                  <p className="text-sm text-white/65 mt-1">
                    {pago
                      ? "Agendamento será criado como pago."
                      : "Agendamento será criado como pendente."}
                  </p>
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                className={[
                  "btn-gold",
                  !podeConfirmar ? "opacity-60 pointer-events-none" : "",
                ].join(" ")}
                disabled={!podeConfirmar}
                onClick={confirmarAdmin}
              >
                {salvando ? "Salvando..." : "Confirmar agendamento"}
              </button>

              <button
                className="btn-outline"
                onClick={() => {
                  setErro(null);

                  // cliente
                  setClienteNome("");
                  setClienteTelefone("");
                  setClienteIdSelecionado(null);
                  setMostrarSugestoes(false);

                  // agendamento
                  setServicosSelecionados([]);
                  setData("");
                  setHorarios([]);
                  setHorarioSelecionado("");

                  // pagamento
                  setPagamentoTipo("PIX");
                  setPago(false);
                }}
                type="button"
              >
                Limpar
              </button>
            </div>

            <p className="mt-3 text-sm text-white/70">
              Ao confirmar, o agendamento será criado e você será redirecionado
              para o painel do admin.
            </p>
          </Step>
        </div>
      </div>
    </AppShell>
  );
}
