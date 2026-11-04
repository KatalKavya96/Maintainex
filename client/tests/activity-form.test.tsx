import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { ActivityForm } from "@/features/activities/components/ActivityForm";

const mocks = vi.hoisted(() => ({ add: vi.fn(), update: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/state/activities", () => ({ useActivityStore: () => ({ addActivity: mocks.add, updateActivity: mocks.update }) }));
beforeEach(() => { mocks.add.mockReset(); mocks.update.mockReset(); mocks.push.mockReset(); });

function fillRequired() {
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "My contribution draft" } });
  fireEvent.change(screen.getByLabelText("Organization"), { target: { value: "my-org" } });
  fireEvent.change(screen.getByLabelText("Repository"), { target: { value: "my-repo" } });
}
test("a failed save preserves the draft, shows the failure and allows a successful retry", async () => {
  mocks.add.mockRejectedValueOnce(new Error("Connection unavailable")).mockResolvedValueOnce({ id: "saved" });
  render(<ActivityForm />); fillRequired();
  fireEvent.submit(screen.getByRole("button", { name: "Create activity" }).closest("form")!);
  expect(await screen.findByRole("alert")).toHaveTextContent("Connection unavailable");
  expect(screen.getByLabelText("Title")).toHaveValue("My contribution draft");
  expect(mocks.push).not.toHaveBeenCalled();
  fireEvent.submit(screen.getByRole("button", { name: "Create activity" }).closest("form")!);
  await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/activities"));
});
test("repeated submits while a save is pending send exactly one mutation", async () => {
  let finish!: (value: unknown) => void;
  mocks.add.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  render(<ActivityForm />); fillRequired();
  const form = screen.getByRole("button", { name: "Create activity" }).closest("form")!;
  fireEvent.submit(form); fireEvent.submit(form);
  expect(mocks.add).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
  finish({ id: "saved" });
  await waitFor(() => expect(mocks.push).toHaveBeenCalled());
});
