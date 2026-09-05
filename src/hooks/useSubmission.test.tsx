// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { expect, it } from "vitest";
import { useSubmission } from "./useSubmission";

it("blocks a second submit even before the pending render and unlocks after failure", () => {
  const { result } = renderHook(useSubmission);
  act(() => {
    expect(result.current.begin()).toBe(true);
    expect(result.current.begin()).toBe(false);
  });
  expect(result.current.pending).toBe(true);
  act(() => result.current.end());
  expect(result.current.pending).toBe(false);
  act(() => { expect(result.current.begin()).toBe(true); });
});
