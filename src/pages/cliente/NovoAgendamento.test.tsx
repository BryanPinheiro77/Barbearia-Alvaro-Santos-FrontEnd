// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import NovoAgendamento from "./NovoAgendamento";
import { criarAgendamento } from "../../api/criarAgendamento";

vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));
vi.mock("../../auth/AuthContext", () => ({ useAuth: () => ({ user: { token: "test", tipo: "CLIENTE" } }) }));
vi.mock("../../components/layout/AppShell", () => ({ AppShell: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock("../../components/ui/Step", () => ({ Step: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock("../../components/ui/CalendarPicker", () => ({ CalendarPicker: ({ onChange }: { onChange: (value: string) => void }) => <button onClick={() => onChange("2099-10-10")}>Escolher dia</button> }));
vi.mock("../../api/servicos", () => ({ listarServicosAtivos: async () => [{ id: 1, nome: "Corte", preco: 30, duracaoMinutos: 30 }] }));
vi.mock("../../api/horarios", () => ({ listarHorariosDisponiveis: async () => ({ horarios: ["10:00"] }) }));
vi.mock("../../api/criarAgendamento", () => ({ criarAgendamento: vi.fn() }));
beforeEach(() => { vi.clearAllMocks(); });
afterEach(cleanup);

it("shows Agendando and prevents a duplicate call while the API is slow; failure enables retry", async () => {
  let reject!: (error: Error) => void;
  vi.mocked(criarAgendamento).mockImplementation(() => new Promise((_resolve, fail) => { reject = fail; }));
  render(<NovoAgendamento />);
  fireEvent.click(await screen.findByRole("button", { name: /Corte/ }));
  fireEvent.click(screen.getByRole("button", { name: "Escolher dia" }));
  fireEvent.click(await screen.findByRole("button", { name: "10:00" }));
  const button = screen.getByRole("button", { name: "Confirmar agendamento" });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(criarAgendamento).toHaveBeenCalledTimes(1);
  const pending = screen.getByRole("button", { name: "Agendando..." }) as HTMLButtonElement;
  expect(pending.disabled).toBe(true);
  expect(pending.getAttribute("aria-busy")).toBe("true");
  await act(async () => reject(new Error("network timeout")));
  await waitFor(() => expect((screen.getByRole("button", { name: "Confirmar agendamento" }) as HTMLButtonElement).disabled).toBe(false));
});
