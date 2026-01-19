import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import * as PagamentosApi from "../../api/pagamentos";

export default function PagamentoRetorno() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("Confirmando pagamento...");

  useEffect(() => {
    (async () => {
      const pagamentoIdStr =
        localStorage.getItem("ultimoPagamentoId");

      if (!pagamentoIdStr) {
        setMsg("Não encontrei o pagamento. Voltando ao agendamento...");
        navigate("/cliente/novo-agendamento");
        return;
      }

      const pagamentoId = Number(pagamentoIdStr);

      try {
        const st = await PagamentosApi.buscarPagamentoPorId(pagamentoId);

        if (st.status === "PAGO") {
          setMsg("Pagamento confirmado. Voltando ao agendamento...");

          // Volta para a mesma tela e pede para restaurar estado
          navigate("/cliente/novo-agendamento?resume=1", { replace: true });
          return;
        }

        setMsg(`Pagamento: ${st.status}. Volte ao agendamento e verifique novamente.`);
        navigate("/cliente/novo-agendamento");
      } catch (e) {
        console.error(e);
        setMsg("Não foi possível validar o pagamento agora. Volte ao agendamento.");
        navigate("/cliente/novo-agendamento");
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
