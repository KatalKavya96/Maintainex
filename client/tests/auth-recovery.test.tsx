import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { AuthProvider, useAuthStore } from "@/state/auth";
import { ApiRequestError } from "@/data/http";

const mocks = vi.hoisted(() => ({ request: vi.fn(), clear: vi.fn(), set: vi.fn(), get: vi.fn() }));
vi.mock("@/data/http", async original => ({ ...await original<typeof import("@/data/http")>(), apiRequest: mocks.request }));
vi.mock("@/data/session", () => ({ getSessionToken: mocks.get, clearSessionToken: mocks.clear, setSessionToken: mocks.set }));
function Probe() {
  const auth = useAuthStore();
  return <><p>{auth.isReady ? auth.sessionError || auth.user?.name || "Signed out" : "Loading"}</p><button onClick={auth.retrySession}>Retry</button><button onClick={auth.logout}>Sign out</button></>;
}
beforeEach(() => { mocks.request.mockReset(); mocks.clear.mockReset(); mocks.set.mockReset(); mocks.get.mockReturnValue("stored-token"); });
test("temporary failures retain the stored session and recover on retry", async () => {
  mocks.request.mockRejectedValueOnce(new TypeError("Network failed")).mockResolvedValueOnce({ token: "refreshed", user: { name: "Recovered user" } });
  render(<AuthProvider><Probe /></AuthProvider>);
  expect(await screen.findByText(/could not verify your session/)).toBeInTheDocument();
  expect(mocks.clear).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("Retry"));
  expect(await screen.findByText("Recovered user")).toBeInTheDocument();
  expect(mocks.set).toHaveBeenCalledWith("refreshed");
});
test("a rejected session is cleared", async () => {
  mocks.request.mockRejectedValue(new ApiRequestError("Expired", 401));
  render(<AuthProvider><Probe /></AuthProvider>);
  expect(await screen.findByText("Signed out")).toBeInTheDocument();
  expect(mocks.clear).toHaveBeenCalledTimes(1);
});
test("a late session response cannot sign the user back in after logout", async () => {
  let finish!: (value: unknown) => void;
  mocks.request.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  render(<AuthProvider><Probe /></AuthProvider>);
  fireEvent.click(screen.getByText("Sign out"));
  finish({ token: "late", user: { name: "Late user" } });
  await waitFor(() => expect(mocks.clear).toHaveBeenCalled());
  expect(screen.queryByText("Late user")).not.toBeInTheDocument();
  expect(mocks.set).not.toHaveBeenCalled();
});
