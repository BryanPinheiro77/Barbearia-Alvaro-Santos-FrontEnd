const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const PUBLIC_ROUTES = ["/auth/login", "/clientes/registrar", "/login", "/register"];


function safeParseAuth(): { token?: string } | null {
  const authRaw = localStorage.getItem("auth");
  if (!authRaw) return null;

  try {
    return JSON.parse(authRaw) as { token?: string };
  } catch {
    localStorage.removeItem("auth");
    return null;
  }
}

function redirectToLogin() {
  // evita loop infinito se já estiver no /login
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export async function http<T>(path: string, options: RequestInit = {}): Promise<T> {
  const auth = safeParseAuth();
  const token: string | undefined = auth?.token;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const isPublic = PUBLIC_ROUTES.some((r) => normalizedPath.startsWith(r));

  const headers = new Headers(options.headers);

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !isPublic && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${normalizedPath}`, {
    ...options,
    headers,
  });

  // ✅ token expirado / inválido
  if (res.status === 401 && !isPublic) {
    localStorage.removeItem("auth");
    redirectToLogin();
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  // ✅ sucesso sem conteúdo
  if (res.status === 204) return undefined as T;

  // ✅ erros em geral
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  // ✅ retorna JSON ou texto
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return (await res.text()) as T;
  }

  return (await res.json()) as T;
}
