import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { PrivateRoute } from "./auth/PrivateRoute";

import Login from "./pages/login";
import ClienteDashboard from "./pages/cliente/ClienteDashboard";
import NovoAgendamento from "./pages/cliente/NovoAgendamento";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAgendamentos from "./pages/admin/AdminAgendamentos";
import AdminServicos from "./pages/admin/AdminServicos";
import AdminHorarios from "./pages/admin/AdminHorarios";
import Register from "./pages/cliente/Register";
import ClienteHistorico from "./pages/cliente/ClienteHistorico";
import AdminRelatorios from "./pages/admin/AdminRelatorios";
import Index from "./pages/home";
import PagamentoRetorno from "./pages/cliente/PagamentoRetorno";


export default function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
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

<Route path="/" element={<Index/>} />

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

        <Route path="/pagamento/retorno" element={<PagamentoRetorno />} />

        <Route
  path="/cliente/historico"
  element={
    <PrivateRoute>
      <ClienteHistorico />
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
  path="/admin/horarios"
  element={
    <PrivateRoute>
      <AdminHorarios />
    </PrivateRoute>
  }
/>

        <Route
  path="/admin/servicos"
  element={
    <PrivateRoute>
      <AdminServicos />
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

        {/* Redirecionamento raiz */}
        <Route
          path="/"
          element={
            user ? (
              user.tipo === "ADMIN" ? (
                <Navigate to="/admin" replace />
              ) : (
                <Navigate to="/cliente" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
