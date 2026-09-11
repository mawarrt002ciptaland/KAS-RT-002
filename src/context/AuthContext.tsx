"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface UserSession {
  id: number;
  nik?: string | null;
  username: string;
  name: string;
  role: "admin" | "ketua_rt" | "bendahara" | "warga";
  phone?: string;
  houseNumber?: string;
  avatar?: string;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchUser: (role: "admin" | "ketua_rt" | "bendahara" | "warga") => void;
  setUserDirectly: (user: UserSession) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("kas_rt_user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        setUser(null);
        localStorage.removeItem("kas_rt_user");
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Gagal login" };
      }
      setUser(data.user);
      localStorage.setItem("kas_rt_user", JSON.stringify(data.user));
      return { success: true };
    } catch {
      return { success: false, error: "Koneksi bermasalah" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    localStorage.removeItem("kas_rt_user");
    router.push("/login");
  };

  const switchUser = (_role: "admin" | "ketua_rt" | "bendahara" | "warga") => {
    return;
  };

  const setUserDirectly = (u: UserSession) => {
    setUser(u);
    localStorage.setItem("kas_rt_user", JSON.stringify(u));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        switchUser,
        setUserDirectly,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
