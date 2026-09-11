import React from 'react';
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";
import type { User } from "../types";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try { setUser((await api.get("/auth/me")).data); }
    catch { setUser(null); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function logout() {
    await api.post("/auth/logout");
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
