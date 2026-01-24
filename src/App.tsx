import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { PrivateRoute } from "./auth/PrivateRoute";

import Login from "./pages/login";
import Index from "./pages/home";

import Register from "./pages/cliente/Register";
import ClienteDashboard from "./pages/cliente/ClienteDashboard";
import NovoAgendamento from "./pages/cliente/NovoAgendamento";
import ClienteHistorico from "./pages/cliente/ClienteHistorico";
import ClienteConfiguracoes from "./pages/cliente/ConfiguracoesCliente";
import PagamentoRetorno from "./pages/cliente/PagamentoRetorno";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAgendamentos from "./pages/admin/AdminAgendamentos";
import AdminServicos from "./pages/admin/AdminServicos";
import AdminHorarios from "./pages/admin/AdminHorarios";
import AdminRelatorios from "./pages/admin/AdminRelatorios";
import AdminNovoAgendamento from "./pages/admin/AdminNovoAgendamento";
import AdminClientes from "./pages/admin/AdminClientes";

export default function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<Index />} />

        {/* Redirect central (opcional) */}
        <Route
          path="/app"
          element={
            user ? (
              <Navigate to={user.tipo === "ADMIN" ? "/admin" : "/cliente"} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Auth */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={user.tipo === "ADMIN" ? "/admin" : "/cliente"} replace />
            ) : (
              <Login />
            )
          }
        />
        <Route path="/register" element={<Register />} />

        {/* Cliente */}
        <Route
          path="/cliente"
          element={
            <PrivateRoute allow={["CLIENTE"]}>
              <ClienteDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/cliente/novo-agendamento"
          element={
            <PrivateRoute allow={["CLIENTE"]}>
              <NovoAgendamento />
            </PrivateRoute>
          }
        />

        <Route
          path="/cliente/historico"
          element={
            <PrivateRoute allow={["CLIENTE"]}>
              <ClienteHistorico />
            </PrivateRoute>
          }
        />

        <Route
          path="/cliente/configuracoes"
          element={
            <PrivateRoute allow={["CLIENTE"]}>
              <ClienteConfiguracoes />
            </PrivateRoute>
          }
        />

        <Route
          path="/pagamento/retorno"
          element={
            <PrivateRoute allow={["CLIENTE"]}>
              <PagamentoRetorno />
            </PrivateRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <PrivateRoute allow={["ADMIN"]}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/agendamentos"
          element={
            <PrivateRoute allow={["ADMIN"]}>
              <AdminAgendamentos />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/agendamentos/novo"
          element={
            <PrivateRoute allow={["ADMIN"]}>
              <AdminNovoAgendamento />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/clientes"
          element={
            <PrivateRoute allow={["ADMIN"]}>
              <AdminClientes />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/servicos"
          element={
            <PrivateRoute allow={["ADMIN"]}>
              <AdminServicos />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/horarios"
          element={
            <PrivateRoute allow={["ADMIN"]}>
              <AdminHorarios />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/relatorios"
          element={
            <PrivateRoute allow={["ADMIN"]}>
              <AdminRelatorios />
            </PrivateRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
