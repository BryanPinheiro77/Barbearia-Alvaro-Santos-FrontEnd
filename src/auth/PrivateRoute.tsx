import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

type UserType = "CLIENTE" | "ADMIN";

type Props = PropsWithChildren<{
  allow?: UserType[]; // se não passar, apenas exige login
}>;

export function PrivateRoute({ children, allow }: Props) {
  const { user } = useAuth();
  const location = useLocation();

  // 1) não logado
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 2) logado mas sem permissão
  if (allow && allow.length > 0 && !allow.includes(user.tipo)) {
    // redireciona para o dashboard correcto
    return (
      <Navigate to={user.tipo === "ADMIN" ? "/admin" : "/cliente"} replace />
    );
  }

  return <>{children}</>;
}
