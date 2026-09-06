import { createContext, useContext, useEffect, useState } from "react";
import { logoutRequest, refreshSession } from "../api/http";
import { readSession, writeSession, tokenExpired, SESSION_EVENT } from "./session";
import type { AuthData } from "./session";
export type { AuthData } from "./session";
interface AuthContextType {
  user: AuthData | null;
  checking: boolean;
  sessionError: string | null;
  login: (data: AuthData) => void;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(readSession);
  const [checking, setChecking] = useState(() => {
    const value = readSession();
    return !!value && tokenExpired(value.token);
  });
  const [sessionError, setSessionError] = useState<string | null>(null);
  useEffect(() => {
    const sync = () => { setUser(readSession()); setSessionError(null); };
    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener("storage", sync);
    const current = readSession();
    if (current && tokenExpired(current.token)) {
      refreshSession().catch(() => {
        if (readSession()) setSessionError("Não foi possível verificar sua sessão. Recarregue a página para tentar novamente.");
      }).finally(() => setChecking(false));
    }
    return () => {
      window.removeEventListener(SESSION_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  async function logout() {
    try { await logoutRequest(); }
    catch { setSessionError("Você saiu neste dispositivo, mas não foi possível revogar a sessão no servidor."); }
  }
  return <AuthContext.Provider value={{ user, checking, sessionError, login: writeSession, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
