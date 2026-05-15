import type { User } from "../types";

export function homePathForUser(user: User | null | undefined): string {
  if (user?.role === "ADMIN") return "/admin";
  return "/";
}
