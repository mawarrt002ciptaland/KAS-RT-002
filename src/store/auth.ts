import { create } from "zustand";
import { apiRequest, ApiError } from "@/lib/api";
import type { User } from "@/data/types";

export interface AuthUser {
  id: string;
  email: string;
  nama: string;
  role: User["role"];
  wargaId?: string;
  telepon?: string;
  foto?: string;
}

type AuthStatus = "checking" | "authenticated" | "anonymous" | "offline";

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
  checkSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  registerResident: (input: { email: string; password: string; nik: string; noKK: string }) => Promise<void>;
  createAccount: (input: { nama: string; email: string; password: string; role: User["role"]; telepon?: string; wargaId?: string }) => Promise<User>;
  updateAccount: (id: string, patch: Partial<User> & { password?: string }) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  logout: () => Promise<void>;
}

let sessionRequest: Promise<void> | null = null;

export const useAuth = create<AuthState>((set) => ({
  status: "checking",
  user: null,
  error: null,

  checkSession: () => {
    if (sessionRequest) return sessionRequest;
    sessionRequest = (async () => {
      set({ status: "checking", error: null });
      try {
        const response = await apiRequest<{ ok: boolean; user: AuthUser }>("/api/auth/me");
        set({ status: "authenticated", user: response.user, error: null });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          set({ status: "anonymous", user: null, error: null });
        } else {
          set({ status: "offline", user: null, error: error instanceof Error ? error.message : "Server autentikasi belum terhubung." });
        }
      } finally {
        sessionRequest = null;
      }
    })();
    return sessionRequest;
  },

  login: async (email, password) => {
    set({ error: null });
    const response = await apiRequest<{ ok: boolean; user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    set({ status: "authenticated", user: response.user, error: null });
  },

  registerResident: async (input) => {
    set({ error: null });
    const response = await apiRequest<{ ok: boolean; user: AuthUser }>("/api/auth/register/warga", {
      method: "POST",
      body: JSON.stringify(input),
    });
    set({ status: "authenticated", user: response.user, error: null });
  },

  createAccount: async (input) => {
    const response = await apiRequest<{ ok: boolean; item: User }>("/api/auth/users", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return response.item;
  },

  updateAccount: async (id, patch) => {
    await apiRequest<{ ok: boolean; item: User }>(`/api/auth/users/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  deleteAccount: async (id) => {
    await apiRequest<{ ok: boolean }>(`/api/auth/users/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  logout: async () => {
    try {
      await apiRequest<{ ok: boolean }>("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
    } finally {
      set({ status: "anonymous", user: null, error: null });
    }
  },
}));