const API_URL = import.meta.env.VITE_API_URL;

const PUBLIC_ROUTES = ["/auth/login", "/clientes/registrar"];

export async function http<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authRaw = localStorage.getItem("auth");
  const auth = authRaw ? JSON.parse(authRaw) : null;
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

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return (await res.text()) as T;
  }
  
if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
