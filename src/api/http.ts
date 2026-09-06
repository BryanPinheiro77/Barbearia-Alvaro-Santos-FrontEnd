import { readSession, writeSession } from "../auth/session";

const API_URL = import.meta.env.VITE_API_URL || "/api";
const PUBLIC_ROUTES = ["/auth/login", "/auth/refresh", "/auth/logout", "/clientes/registrar", "/servicos/ativos", "/agendamentos/horarios-disponiveis"];
let refreshPromise: Promise<void> | null = null;
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
function expireSession() {
  writeSession(null);
  if (window.location.pathname !== "/login") window.location.replace("/login");
}
export function refreshSession(): Promise<void> {
  if (refreshPromise) return refreshPromise;
  const original = readSession()?.token;
  const run = async () => {
    if (!original || readSession()?.token !== original) return;
    const response = await fetch(API_URL + "/auth/refresh", { method: "POST", credentials: "include" });
    if (response.status === 401) {
      if (readSession()?.token === original) expireSession();
      throw new HttpError(401, "Sessão expirada. Faça login novamente.");
    }
    if (!response.ok) throw new HttpError(response.status, "Não foi possível renovar a sessão. Tente novamente.");
    const updated = await response.json();
    if (readSession()?.token === original) writeSession(updated);
  };
  refreshPromise = (async () => { await (navigator.locks ? navigator.locks.request("auth-refresh", run) : run()); })()
    .finally(() => { refreshPromise = null; });
  return refreshPromise;
}
export async function logoutRequest() {
  writeSession(null);
  if (refreshPromise) await refreshPromise.catch(() => undefined);
  const run = async () => {
    const response = await fetch(API_URL + "/auth/logout", { method: "POST", credentials: "include" });
    if (!response.ok) throw new HttpError(response.status, "Não foi possível encerrar a sessão no servidor.");
  };
  await (navigator.locks ? navigator.locks.request("auth-refresh", run) : run());
}
export async function http<T>(path: string, options: RequestInit = {}): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : "/" + path;
  const isPublic = PUBLIC_ROUTES.includes(normalizedPath);
  const request = () => {
    const headers = new Headers(options.headers);
    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const token = readSession()?.token;
    if (token && !isPublic) headers.set("Authorization", "Bearer " + token);
    return fetch(API_URL + normalizedPath, { ...options, headers, credentials: "include" });
  };
  const sentToken = readSession()?.token;
  let response = await request();
  if (response.status === 401 && !isPublic) {
    if (!readSession()) {
      expireSession();
      throw new HttpError(401, "Sessão expirada. Faça login novamente.");
    }
    if (readSession()?.token === sentToken) await refreshSession();
    if (!readSession()) throw new HttpError(401, "Sessão expirada. Faça login novamente.");
    response = await request();
    if (response.status === 401) expireSession();
  }
  if (response.status === 204) return undefined as T;
  if (!response.ok) throw new HttpError(response.status, (await response.text().catch(() => "")) || ("HTTP " + response.status));
  return response.headers.get("content-type")?.includes("application/json") ? response.json() : await response.text() as T;
}
