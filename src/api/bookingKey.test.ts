// @vitest-environment jsdom
import { beforeEach, expect, it } from "vitest";
import { bookingKey, finishBooking } from "./bookingKey";
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
it("keeps a key for a retry but changes it for a different payload or completed booking", () => {
  const first = bookingKey("cliente", { date: "2026-10-10" });
  expect(bookingKey("cliente", { date: "2026-10-10" })).toBe(first);
  expect(bookingKey("cliente", { date: "2026-10-11" })).not.toBe(first);
  finishBooking("cliente");
  expect(bookingKey("cliente", { date: "2026-10-10" })).not.toBe(first);
});
it("isolates keys by authenticated account", () => {
  const login = (sub: string) => localStorage.setItem("auth", JSON.stringify({ token: "header." + btoa(JSON.stringify({ sub })) + ".signature", tipo: "CLIENTE" }));
  login("a@example.com");
  const first = bookingKey("cliente", {});
  login("b@example.com");
  expect(bookingKey("cliente", {})).not.toBe(first);
});
