import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getMyPerms } from "../services/authzService";

type AuthZ = {
  ready: boolean;
  perms: Set<string>;
  has: (p: string) => boolean;
  any: (...ps: string[]) => boolean;
  all: (...ps: string[]) => boolean;
};

const Ctx = createContext<AuthZ | null>(null);

export const AuthZProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [perms, setPerms] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const r = await getMyPerms();
        setPerms(new Set(r.data.perms));
      } catch {
        setPerms(new Set());
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const value = useMemo<AuthZ>(() => ({
    ready,
    perms,
    has: (p) => perms.has(p),
    any: (...ps) => ps.some((p) => perms.has(p)),
    all: (...ps) => ps.every((p) => perms.has(p)),
  }), [ready, perms]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuthZ = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuthZ must be used within <AuthZProvider>");
  return ctx;
};