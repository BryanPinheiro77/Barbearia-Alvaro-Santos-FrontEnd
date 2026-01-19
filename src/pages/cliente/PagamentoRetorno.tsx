import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import * as PagamentosApi from "../../api/pagamentos";

export default function PagamentoRetorno() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("Confirmando pagamento...");

  useEffect(() => {
    (async () => {
      const pagamentoIdStr = localStorage.getItem("ultimoPagamentoId");

      if (!pagamentoIdStr) {
        setMsg("Não encontrei o pagamento. Indo para a área do cliente...");
        navigate("/cliente", { replace: true });
        return;
      }

      const pagamentoId = Number(pagamentoIdStr);

      try {
        const st = await PagamentosApi.buscarPagamentoPorId(pagamentoId);

        if (st.status === "PAGO") {
          setMsg("Pagamento confirmado. Redirecionando...");

          // limpa o estado do fluxo
          localStorage.removeItem("ultimoPagamentoId");
          localStorage.removeItem("ultimoAgendamentoId");
          localStorage.removeItem("novoAgendamentoDraft");

          navigate("/cliente", { replace: true });
          return;
        }

        // Não pago ainda (pending, etc.)
        setMsg(`Pagamento: ${st.status}. Você pode tentar novamente.`);
        navigate("/cliente/novo-agendamento", { replace: true });
      } catch (e) {
        console.error(e);
        setMsg("Não foi possível validar o pagamento agora. Tente novamente.");
        navigate("/cliente/novo-agendamento", { replace: true });
      }
    })();
  }, [navigate]);

  return (
    <AppShell>
      <div className="container-page py-10">
        <div className="card">
          <h1 className="font-display text-2xl">Pagamento</h1>
          <p className="text-white/70 mt-2">{msg}</p>
        </div>
      </div>
    </AppShell>
  );
}
