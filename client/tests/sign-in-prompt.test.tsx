import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, expect, test, vi } from "vitest";
import { apiRequest, signInRequiredEvent, type SignInRequiredDetail } from "@/data/http";
import { SignInDialog } from "@/features/auth/components/SignInDialog";

const mocks = vi.hoisted(() => ({ login: vi.fn(), signup: vi.fn(), viewer: true }));
vi.mock("next/navigation", () => ({ usePathname: () => "/activities/new" }));
vi.mock("@/state/auth", () => ({ useAuthStore: () => ({ isViewer: mocks.viewer, login: mocks.login, signup: mocks.signup }) }));
vi.mock("@/data/api/auth", () => ({ getOAuthProviders: async () => ({ google: false, github: true }), getOAuthUrl: vi.fn() }));

beforeAll(() => {
  // jsdom has no modal dialog implementation; mirror the open attribute the browser would set.
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) { this.removeAttribute("open"); };
});
beforeEach(() => { mocks.login.mockReset(); mocks.signup.mockReset(); mocks.viewer = true; });

const respond = (status: number, body: unknown) => vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(JSON.stringify(body), { status }));
const announce = (detail: SignInRequiredDetail) => act(() => { window.dispatchEvent(new CustomEvent(signInRequiredEvent, { detail })); });

test("only SIGN_IN_REQUIRED responses ask for sign-in, as a view or an action by method", async () => {
  const seen: SignInRequiredDetail[] = [];
  const listen = (event: Event) => seen.push((event as CustomEvent<SignInRequiredDetail>).detail);
  window.addEventListener(signInRequiredEvent, listen);
  respond(403, { message: "Viewer mode is read-only.", code: "SIGN_IN_REQUIRED" });
  await expect(apiRequest("/goals", { method: "POST" })).rejects.toMatchObject({ status: 403, code: "SIGN_IN_REQUIRED" });
  await expect(apiRequest("/profiles")).rejects.toThrow();
  respond(403, { message: "Admin access required" });
  await expect(apiRequest("/admin")).rejects.toThrow("Admin access required");
  window.removeEventListener(signInRequiredEvent, listen);
  expect(seen).toEqual([{ message: "Viewer mode is read-only.", reason: "action" }, { message: "Viewer mode is read-only.", reason: "view" }]);
});

test("the dialog explains why, offers sign-in or sign-up, and closes in place after signing in", async () => {
  mocks.login.mockResolvedValue(undefined);
  render(<SignInDialog />);
  expect(screen.queryByRole("dialog")).toBeNull();
  announce({ message: "Viewer mode is read-only. Sign up or sign in to save changes.", reason: "action" });
  announce({ message: "A second blocked request", reason: "action" });
  const dialog = await screen.findByRole("dialog", { name: "Sign in to continue" });
  expect(dialog).toHaveTextContent("Viewer mode is read-only");
  expect(dialog).not.toHaveTextContent("A second blocked request");

  fireEvent.click(screen.getByRole("button", { name: "Create account" }));
  expect(screen.getByRole("dialog", { name: "Create your account" })).toBeTruthy();
  expect(screen.getByLabelText("Name")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "dana@example.test" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Correct-Horse-9!" } });
  fireEvent.submit(screen.getByLabelText("Email").closest("form")!);
  await waitFor(() => expect(mocks.login).toHaveBeenCalledWith("dana@example.test", "Correct-Horse-9!"));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});

test("a failed sign-in keeps the dialog open with the reason, and Escape closes it", async () => {
  mocks.login.mockRejectedValue(new Error("Email or password is incorrect."));
  render(<SignInDialog />);
  announce({ message: "Sign in to see other contributors.", reason: "view" });
  await screen.findByRole("dialog");
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "dana@example.test" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong" } });
  fireEvent.submit(screen.getByLabelText("Email").closest("form")!);
  expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is incorrect.");
  fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});

test("signed-in members never see the prompt", () => {
  mocks.viewer = false;
  render(<SignInDialog />);
  announce({ message: "Sign in to see other contributors.", reason: "view" });
  expect(screen.queryByRole("dialog")).toBeNull();
});
