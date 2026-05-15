import { Select } from "../ui/Select";
import type { UserRole } from "../../types";

type Props = {
  value: UserRole;
  onChange: (role: UserRole) => void;
  id?: string;
};

export function RoleSelect({ value, onChange, id = "role" }: Props) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-[var(--color-muted)]">
        Account type
      </label>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value as UserRole)}>
        <option value="MEMBER">Member — team collaborator</option>
        <option value="ADMIN">Admin — workspace manager</option>
      </Select>
    </div>
  );
}
