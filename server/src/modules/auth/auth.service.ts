import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { User, UserRole } from "@prisma/client";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { AuthRepository } from "./auth.repository";

export class AuthService {
  constructor(private repository = new AuthRepository()) {}

  async signup(payload: { name: string; email: string; password: string; adminCode?: string }) {
    const existing = await this.repository.findByEmail(payload.email);
    if (existing) throw new ApiError(409, "Email is already registered");

    const userCount = await this.repository.countUsers();
    const role: UserRole = env.signupAdminCode
      ? payload.adminCode === env.signupAdminCode
        ? "ADMIN"
        : "VIEWER"
      : userCount === 0
        ? "ADMIN"
        : "VIEWER";
    const passwordHash = await bcrypt.hash(payload.password, 12);
    const username = await this.generateUsername(payload.name, payload.email);
    const user = await this.repository.create({
      name: payload.name,
      username,
      email: payload.email.toLowerCase(),
      passwordHash,
      role
    });

    return this.authResponse(user);
  }

  async login(payload: { email: string; password: string }) {
    const user = await this.repository.findByEmail(payload.email.toLowerCase());
    if (!user) throw new ApiError(401, "Invalid email or password");

    const isValid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isValid) throw new ApiError(401, "Invalid email or password");

    return this.authResponse(user);
  }

  viewer() {
    const user = {
      id: "viewer",
      name: "Viewer",
      username: "viewer",
      email: "viewer@maintainex.local",
      role: "VIEWER" as UserRole
    };
    return {
      token: this.sign(user),
      user
    };
  }

  private authResponse(user: User) {
    const publicUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role
    };

    return {
      token: this.sign(publicUser),
      user: publicUser
    };
  }

  private sign(user: { id: string; name: string; username: string; email: string; role: UserRole }) {
    return jwt.sign(user, env.jwtSecret, { expiresIn: "7d" });
  }

  private async generateUsername(name: string, email: string) {
    const base =
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") ||
      email
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") ||
      "user";

    let username = base;
    let suffix = 1;
    while (await this.repository.findByUsername(username)) {
      suffix += 1;
      username = `${base}-${suffix}`;
    }
    return username;
  }
}
