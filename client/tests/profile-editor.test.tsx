import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import EditProfilePage from "@/features/profile/screens/ProfileEditScreen";

const mocks = vi.hoisted(() => ({ load: vi.fn(), update: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock("@/state/auth", () => ({ useAuthStore: () => ({ user: { username: "owner" }, updateUser: vi.fn() }) }));
vi.mock("@/data/api/profile", () => ({ getProfileByUsername: mocks.load, updateProfile: mocks.update, checkUsernameAvailability: vi.fn().mockResolvedValue(null) }));

test("failed hydration cannot overwrite saved profile arrays with empty defaults", async () => {
  mocks.load.mockRejectedValueOnce(new Error("Offline")).mockResolvedValueOnce({ user: { name: "Owner", username: "owner", skills: ["TypeScript"], mainOrganizations: ["maintainex"] } });
  mocks.update.mockResolvedValue({ name: "Owner", username: "owner" });
  render(<EditProfilePage />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load");
  expect(screen.queryByRole("button", { name: "Save profile" })).not.toBeInTheDocument();
  expect(mocks.update).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByLabelText("Skills")).toHaveValue("TypeScript");
  fireEvent.submit(screen.getByRole("button", { name: "Save profile" }).closest("form")!);
  await waitFor(() => expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ skills: ["TypeScript"], mainOrganizations: ["maintainex"] })));
});
