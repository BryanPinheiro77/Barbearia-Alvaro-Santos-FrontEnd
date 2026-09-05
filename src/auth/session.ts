export interface AuthData {
  id?: number;
  token: string;
  nome: string;
  tipo: "CLIENTE" | "ADMIN";
}
export const SESSION_EVENT = "auth-session-changed";
export function readSession(): AuthData | null {
  try {
    const value = JSON.parse(localStorage.getItem("auth") || "null");
    return value?.token && ["CLIENTE", "ADMIN"].includes(value.tipo) ? value : null;
  } catch { return null; }
}
export function writeSession(value: AuthData | null) {
  if (value) localStorage.setItem("auth", JSON.stringify(value));
  else localStorage.removeItem("auth");
  window.dispatchEvent(new Event(SESSION_EVENT));
}
export function tokenExpired(token: string): boolean {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(payload));
    return typeof exp !== "number" || exp * 1000 <= Date.now() + 5000;
  } catch { return true; }
}
