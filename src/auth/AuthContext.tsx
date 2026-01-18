import { createContext, useContext, useState } from "react";

type UserType = "CLIENTE" | "ADMIN";

export interface AuthData {
  id: number;
  token: string;
  nome: string;
  tipo: UserType;
}

interface AuthContextType {
  user: AuthData | null;
  login: (data: AuthData) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function readAuthFromStorage(): AuthData | null {
  const stored = localStorage.getItem("auth");
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as AuthData;
    // validações mínimas para evitar lixo no storage
    if (!parsed?.token || !parsed?.tipo) {
      localStorage.removeItem("auth");
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem("auth");
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthData | null>(() => readAuthFromStorage());

  function login(data: AuthData) {
    localStorage.setItem("auth", JSON.stringify(data));
    setUser(data);
  }

  function logout() {
    localStorage.removeItem("auth");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
