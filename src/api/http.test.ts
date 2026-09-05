// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from "vitest";
import { writeSession, readSession } from "../auth/session";
import { http, logoutRequest } from "./http";

const auth = { token: "old", nome: "Teste", tipo: "CLIENTE" as const };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
beforeEach(() => { vi.restoreAllMocks(); window.history.replaceState(null, "", "/login"); localStorage.clear(); writeSession(auth); });

it("renews once for concurrent 401s and retries with the new token", async () => {
  let refreshes = 0;
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/auth/refresh")) {
      refreshes++;
      await new Promise(resolve => setTimeout(resolve, 5));
      return json({ ...auth, token: "new" });
    }
    return new Headers(init?.headers).get("Authorization") === "Bearer new" ? json({ ok: true }) : json({}, 401);
  });
  vi.stubGlobal("fetch", fetchMock);
  const result = await Promise.all([http("/agendamentos/meus"), http("/clientes/me")]);
  expect(refreshes).toBe(1);
  expect(result).toEqual([{ ok: true }, { ok: true }]);
  expect(readSession()?.token).toBe("new");
});
it("clears the session on rejected refresh without retrying indefinitely", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => json({}, 401)));
  await expect(http("/clientes/me")).rejects.toMatchObject({ status: 401 });
  expect(readSession()).toBeNull();
  expect(fetch).toHaveBeenCalledTimes(2);
});
it("does not refresh or logout on permission failures", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => json({}, 403)));
  await expect(http("/admin/clientes")).rejects.toMatchObject({ status: 403 });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(readSession()).toEqual(auth);
});
it("preserves a session during temporary refresh outages", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(json({}, 401)).mockResolvedValueOnce(json({}, 503)));
  await expect(http("/clientes/me")).rejects.toMatchObject({ status: 503 });
  expect(readSession()).toEqual(auth);
});
it("logout wins over an in-flight refresh and revokes its resulting cookie", async () => {
  let release!: (value: Response) => void;
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(json({}, 401))
    .mockImplementationOnce(() => new Promise<Response>(resolve => { release = resolve; }))
    .mockResolvedValueOnce(new Response(null, { status: 204 })));
  const pending = http("/clientes/me").catch(() => undefined);
  await vi.waitFor(() => expect(release).toBeTypeOf("function"));
  const logout = logoutRequest();
  release(json({ ...auth, token: "new" }));
  await Promise.all([pending, logout]);
  expect(readSession()).toBeNull();
  expect(vi.mocked(fetch).mock.calls.at(-1)?.[0]).toBe("/api/auth/logout");
});
