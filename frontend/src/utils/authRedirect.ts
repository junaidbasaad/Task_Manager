import type { User } from "../types";

export function homePathForUser(user: User | null | undefined): string {
  if (user?.role === "ADMIN") return "/admin";
  return "/dashboard";
}

export function assertRoleMatches(user: User, expected: User["role"]): void {
  if (user.role !== expected) {
    const label = expected === "ADMIN" ? "Administrator" : "Member";
    throw new Error(`This account is not a ${label}. Select the correct account type.`);
  }
}
