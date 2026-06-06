import type { UserRole } from "@prisma/client";

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
}
