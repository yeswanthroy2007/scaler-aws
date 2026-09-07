import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => "/login",
  useSearchParams: () => new URLSearchParams(),
}));

const login = vi.fn();
vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({ login, logout: vi.fn(), user: null, status: "unauthenticated" }),
}));

import LoginPage from "./page";

describe("LoginPage", () => {
  beforeEach(() => {
    login.mockReset();
    push.mockReset();
  });

  it("shows validation errors when submitting an empty form", async () => {
    render(<LoginPage />);
    await userEvent.clear(screen.getByLabelText("Email address", { exact: false }));
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText(/enter your email address/i)).toBeInTheDocument();
    expect(await screen.findByText(/enter your password/i)).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("rejects an invalid email format", async () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText("Email address", { exact: false });
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, "not-an-email");
    await userEvent.type(screen.getByLabelText("Password", { exact: false }), "somepassword");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("calls login with entered credentials and navigates on success", async () => {
    login.mockResolvedValueOnce(undefined);
    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText("Password", { exact: false }), "Password123!");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(login).toHaveBeenCalledWith({
      email: "admin@example.com",
      password: "Password123!",
      remember_me: true,
    }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/route53"));
  });

  it("surfaces an API error message when login fails", async () => {
    login.mockRejectedValueOnce(new Error("Invalid email or password"));
    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText("Password", { exact: false }), "wrong-password");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/unable to sign in/i);
    expect(push).not.toHaveBeenCalled();
  });
});
