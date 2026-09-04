import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { users as initialUsers, type PlatformUser } from "./mock";

type UsersContextValue = {
  users: PlatformUser[];
  addUser: (user: Omit<PlatformUser, "id">) => string;
  updateUser: (id: string, patch: Partial<PlatformUser>) => void;
  deleteUser: (id: string) => void;
};

const UsersContext = createContext<UsersContextValue | null>(null);

function makeId(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "user"}-${Date.now().toString(36)}`;
}

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<PlatformUser[]>(initialUsers);

  const value = useMemo<UsersContextValue>(
    () => ({
      users,
      addUser: (user) => {
        const id = makeId(user.name);
        setUsers((prev) => [...prev, { ...user, id }]);
        return id;
      },
      updateUser: (id, patch) =>
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u))),
      deleteUser: (id) => setUsers((prev) => prev.filter((u) => u.id !== id)),
    }),
    [users],
  );

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsers must be used within UsersProvider");
  return ctx;
}
