import { createContext, useContext, useState } from "react";

type UserType = "CLIENTE" | "ADMIN";

interface AuthData {
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthData | null>(() => {
    const stored = localStorage.getItem("auth");
    return stored ? JSON.parse(stored) : null;
  });

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
