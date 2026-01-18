import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import "../styles/Landing.css";
import {
  Scissors,
  Star,
  Clock,
  MapPin,
  Phone,
  Instagram,
  MessageCircle,
  Sparkles,
  Award,
} from "lucide-react";
import InstallAppCTA from "../components/InstallAppCTA";

import type { Servico } from "../api/servicos";
import { listarServicosAtivos } from "../api/servicos";
import { listarHorariosDisponiveis } from "../api/horarios";

// ======= DADOS FIXOS (os que você já colocou) =======
const ENDERECO = "Rua Itaquaquecetuba, 144";
const TELEFONE = "(11) 98898-6026";
const WHATSAPP_E164 = "5511988986026"; // Brasil + DDD + número, sem símbolos
const INSTAGRAM_URL = "https://instagram.com/barbeariaalvarosantos";

// ======= Helpers =======
function hojeISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function minutosParaTexto(min: number) {
  if (!min || min <= 0) return "";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

function pickIcon(nome: string) {
  const n = nome.toLowerCase();
  if (n.includes("barba")) return Sparkles;
  if (n.includes("sobrancelha")) return Star;
  if (n.includes("combo")) return Award;
  if (n.includes("hidrata")) return Sparkles;
  return Scissors;
}

// Easing seguro para TS (cubic-bezier semelhante a easeOut)
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Variants SEM função (evita o erro de Variants)
const fadeUpVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
} as const;

type ServiceCard = {
  id: number;
  title: string;
  desc: string;
  price: string;
  time: string;
  Icon: React.ComponentType<{ className?: string }>;
};

export default function Landing() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [horariosHoje, setHorariosHoje] = useState<string[]>([]);
  const [loadingServicos, setLoadingServicos] = useState(true);
  const [loadingHorarios, setLoadingHorarios] = useState(true);
  const [erroServicos, setErroServicos] = useState<string | null>(null);
  const [erroHorarios, setErroHorarios] = useState<string | null>(null);

  // 1) Carrega serviços reais
  useEffect(() => {
    let alive = true;

    async function loadServicos() {
      try {
        setLoadingServicos(true);
        setErroServicos(null);

        const list = await listarServicosAtivos();

        if (!alive) return;
        setServicos(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setErroServicos("Não foi possível carregar os serviços.");
      } finally {
        if (alive) setLoadingServicos(false);
      }
    }

    loadServicos();

    return () => {
      alive = false;
    };
  }, []);

  // 2) Carrega horários reais de HOJE (precisa de servicosIds)
  useEffect(() => {
    let alive = true;

    async function loadHorarios() {
      try {
        setLoadingHorarios(true);
        setErroHorarios(null);

        if (!servicos.length) {
          setHorariosHoje([]);
          return;
        }

        const data = hojeISO();

        // Padrão: usa os 2 primeiros serviços para calcular disponibilidade
        // (se preferir 1 só, troque para: const servicosIds = [servicos[0].id];
        const servicosIds = servicos.slice(0, 2).map((s) => s.id);

        const resp = await listarHorariosDisponiveis(data, servicosIds);

        if (!alive) return;

        const horarios = resp?.horarios ?? [];
        setHorariosHoje(horarios.slice(0, 6)); // mostra 6 na card
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setErroHorarios("Não foi possível carregar os horários de hoje.");
      } finally {
        if (alive) setLoadingHorarios(false);
      }
    }

    loadHorarios();

    return () => {
      alive = false;
    };
  }, [servicos]);

  // Cards a partir dos serviços reais
  const cards: ServiceCard[] = useMemo(() => {
    return servicos.map((s) => ({
      id: s.id,
      title: s.nome,
      desc: "Serviço premium com acabamento impecável.",
      price: formatBRL(s.preco),
      time: minutosParaTexto(s.duracaoMinutos),
      Icon: pickIcon(s.nome),
    }));
  }, [servicos]);

  return (
    <div className="min-h-screen">
      <Header />

      <main>
        <Hero horarios={horariosHoje} loading={loadingHorarios} erro={erroHorarios} />

        <section id="servicos" className="py-20">
          <div className="container-page">
            <motion.div
              variants={fadeUpVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: EASE_OUT }}
            >
              <div className="text-center mb-12">
                <span className="tag">Nossos serviços</span>
                <h2 className="font-display text-4xl md:text-5xl mt-4">
                  Serviços <span className="title-gradient">Premium</span>
                </h2>
                <p className="text-white/70 mt-4 max-w-2xl mx-auto">
                  Cada serviço é executado com precisão e dedicação, garantindo a melhor experiência.
                </p>
              </div>
            </motion.div>

            {loadingServicos ? (
              <div className="text-white/70">Carregando serviços...</div>
            ) : erroServicos ? (
              <div className="text-red-300">{erroServicos}</div>
            ) : cards.length === 0 ? (
              <div className="text-white/70">Nenhum serviço ativo encontrado.</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((s, i) => (
                  <motion.div
                    key={s.id}
                    variants={fadeUpVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: EASE_OUT, delay: i * 0.06 }}
                    className="card hover:translate-y-[-2px] transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 grid place-items-center rounded-xl bg-[#d9a441]/15 border border-[#d9a441]/20">
                          <s.Icon className="h-5 w-5 text-[#d9a441]" />
                        </div>
                        <div>
                          <h3 className="font-display text-xl">{s.title}</h3>
                          <p className="text-white/65 text-sm mt-1">{s.desc}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-[#d9a441] font-display text-2xl">{s.price}</div>
                      <div className="text-white/60 text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {s.time}
                      </div>
                    </div>

                    <div className="mt-6">
                      <Link to="/login" className="btn-outline w-full">
                        Agendar
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        <About />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur">
      <div className="container-page h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 grid place-items-center">
            <Scissors className="h-4 w-4 text-[#d9a441]" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg">Barbearia Álvaro Santos</div>
            <div className="text-xs text-white/60">Faça o seu agendamento de forma fácil e rápida</div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
          <a href="#servicos" className="hover:text-white">Serviços</a>
          <a href="#sobre" className="hover:text-white">Sobre</a>
          <a href="#app" className="hover:text-white">App</a>
        </nav>

        <Link to="/login" className="btn-gold">
          Agendar
        </Link>
      </div>
    </header>
  );
}

function Hero(props: { horarios: string[]; loading: boolean; erro: string | null }) {
  const { horarios, loading, erro } = props;

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,164,65,0.16),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.06),transparent_60%)]" />
      </div>

      <div className="container-page py-20 md:py-28 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.7, ease: EASE_OUT }}
          >
            <span className="tag">Tradição • Estilo • Pontualidade</span>
            <h1 className="font-display text-5xl md:text-6xl mt-5 leading-[1.05]">
              A experiência <span className="title-gradient">premium</span> que o teu corte merece
            </h1>
            <p className="text-white/70 mt-6 max-w-xl">
              Cortes clássicos e modernos, barba com toalha quente e acabamento de alto nível. Agende online
              em segundos.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/login" className="btn-gold">
                <Scissors className="h-4 w-4 mr-2" /> Agendar agora
              </Link>
              <a href="#servicos" className="btn-outline">
                Ver serviços
              </a>
            </div>

            <div className="mt-10 flex items-center gap-6 text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-[#d9a441]" />
                <span>5.0 avaliação</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#d9a441]" />
                <span>Atendimento pontual</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-[#d9a441]" />
                <span>10+ anos</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.1 }}
            className="relative"
          >
            <div className="card p-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display text-2xl">Horários hoje</div>
                  <div className="text-white/65 text-sm mt-1">
                    {erro ? "Não foi possível carregar horários." : "Escolha o melhor horário e agende."}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-[#d9a441]/15 border border-[#d9a441]/20 grid place-items-center">
                  <Clock className="h-5 w-5 text-[#d9a441]" />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-sm text-white/60"
                    >
                      ...
                    </div>
                  ))
                ) : erro ? (
                  <div className="text-red-300 text-sm col-span-3">{erro}</div>
                ) : horarios.length ? (
                  horarios.map((t) => (
                    <div
                      key={t}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-sm text-white/80"
                    >
                      {t}
                    </div>
                  ))
                ) : (
                  <div className="text-white/60 text-sm col-span-3">Sem horários disponíveis hoje.</div>
                )}
              </div>

              <div className="mt-6">
                <Link to="/login" className="btn-gold w-full">
                  Agendar com um clique
                </Link>
              </div>
            </div>

            <div className="absolute -z-10 -right-12 -top-12 h-56 w-56 rounded-full bg-[#d9a441]/10 blur-3xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="sobre" className="py-20 border-t border-white/10">
      <div className="container-page">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE_OUT }}
          >
            <span className="tag">Sobre</span>
            <h2 className="font-display text-4xl md:text-5xl mt-4">
              Conheça <span className="title-gradient">Álvaro Santos</span>
            </h2>
            <p className="text-white/70 mt-5 leading-relaxed">
              Mais do que um barbeiro, um profissional focado em detalhe, técnica e experiência. Cada atendimento
              é pensado para te deixar confiante e bem cuidado.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                { label: "Clientes", value: "500+" },
                { label: "Experiência", value: "10+ anos" },
                { label: "Avaliação", value: "5.0" },
                { label: "Pontualidade", value: "100%" },
              ].map((s) => (
                <div key={s.label} className="card py-4">
                  <div className="font-display text-2xl text-[#d9a441]">{s.value}</div>
                  <div className="text-white/70 text-sm mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE_OUT }}
            className="card"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#d9a441]/15 border border-[#d9a441]/20 grid place-items-center">
                <MapPin className="h-5 w-5 text-[#d9a441]" />
              </div>
              <div>
                <div className="font-display text-xl">Localização</div>
                <div className="text-white/70 text-sm">{ENDERECO}</div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 text-white/75 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#d9a441]" />
                Seg–Sáb: 09:00–19:00
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#d9a441]" />
                {TELEFONE}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <a
                className="btn-outline w-full"
                href={`https://wa.me/${WHATSAPP_E164}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="h-4 w-4 mr-2" /> Chamar no WhatsApp
              </a>

              <a
                className="btn-outline w-full"
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
              >
                <Instagram className="h-4 w-4 mr-2" /> Ver Instagram
              </a>

              <Link to="/login" className="btn-gold w-full">
                Agendar agora
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="app" className="py-20">
  <div className="container-page">
    <InstallAppCTA />
  </div>
</section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="container-page flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-white/70 text-sm">
          © {new Date().getFullYear()} Barbearia Álvaro Santos. Todos os direitos reservados.
        </div>
        <div className="flex items-center gap-4 text-white/70">
          <a href="#servicos" className="hover:text-white text-sm">Serviços</a>
          <a href="#sobre" className="hover:text-white text-sm">Sobre</a>
          <a href="#app" className="hover:text-white text-sm">App</a>
        </div>
      </div>
    </footer>
  );
}
