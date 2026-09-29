import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MenuKey } from "@/lib/constants";

export type Role = "admin" | "warga";
export type WargaTab = "home" | "tagihan" | "pengumuman" | "aduan" | "profil" | "kegiatan" | "marketplace" | "struktur";
export type Theme = "light" | "dark";

interface UIState {
  role: Role;
  theme: Theme;
  activeView: MenuKey;
  wargaTab: WargaTab;
  drawerOpen: boolean;
  searchOpen: boolean;
  notifOpen: boolean;
  quickOpen: boolean;
  sidebarCollapsed: boolean;
  readNotif: string[];
  /** view that should auto-open its create form (set by quick actions) */
  pendingCreate: MenuKey | null;
  /** search text handed to a view from the global search */
  pendingSearch: { view: MenuKey; q: string } | null;
  installDismissed: boolean;

  setRole: (r: Role) => void;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setActiveView: (v: MenuKey) => void;
  navigate: (v: MenuKey, opts?: { create?: boolean; q?: string }) => void;
  setWargaTab: (t: WargaTab) => void;
  setDrawerOpen: (b: boolean) => void;
  setSearchOpen: (b: boolean) => void;
  setNotifOpen: (b: boolean) => void;
  setQuickOpen: (b: boolean) => void;
  toggleSidebar: () => void;
  markNotifRead: (ids: string[]) => void;
  consumePendingCreate: (view: MenuKey) => boolean;
  consumePendingSearch: (view: MenuKey) => string | null;
  setInstallDismissed: (b: boolean) => void;
}

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", t === "dark");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", t === "dark" ? "#14201b" : "#0f9f6e");
}

export const useUI = create<UIState>()(
  persist(
    (set, get) => ({
      role: "admin",
      theme: (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light") as Theme,
      activeView: "dashboard",
      wargaTab: "home",
      drawerOpen: false,
      searchOpen: false,
      notifOpen: false,
      quickOpen: false,
      sidebarCollapsed: false,
      readNotif: [],
      pendingCreate: null,
      pendingSearch: null,
      installDismissed: false,

      setRole: (role) => set({ role, drawerOpen: false, searchOpen: false, notifOpen: false, quickOpen: false, wargaTab: "home", activeView: "dashboard" }),
      setTheme: (theme) => { applyTheme(theme); set({ theme }); },
      toggleTheme: () => { const t: Theme = get().theme === "dark" ? "light" : "dark"; applyTheme(t); set({ theme: t }); },
      setActiveView: (activeView) => set({ activeView, drawerOpen: false }),
      navigate: (view, opts) => {
        set({
          activeView: view,
          drawerOpen: false,
          searchOpen: false,
          notifOpen: false,
          quickOpen: false,
          pendingCreate: opts?.create ? view : null,
          pendingSearch: opts?.q ? { view, q: opts.q } : null,
        });
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      },
      setWargaTab: (wargaTab) => { set({ wargaTab }); if (typeof window !== "undefined") window.scrollTo({ top: 0 }); },
      setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
      setSearchOpen: (searchOpen) => set({ searchOpen }),
      setNotifOpen: (notifOpen) => set({ notifOpen }),
      setQuickOpen: (quickOpen) => set({ quickOpen }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      markNotifRead: (ids) => set((s) => ({ readNotif: Array.from(new Set([...s.readNotif, ...ids])) })),
      consumePendingCreate: (view) => {
        if (get().pendingCreate === view) { set({ pendingCreate: null }); return true; }
        return false;
      },
      consumePendingSearch: (view) => {
        const p = get().pendingSearch;
        if (p && p.view === view) { set({ pendingSearch: null }); return p.q; }
        return null;
      },
      setInstallDismissed: (installDismissed) => set({ installDismissed }),
    }),
    {
      name: "rt002-ui",
      partialize: (s) => ({ role: s.role, theme: s.theme, sidebarCollapsed: s.sidebarCollapsed, readNotif: s.readNotif, installDismissed: s.installDismissed, activeView: s.activeView, wargaTab: s.wargaTab }) as UIState,
      onRehydrateStorage: () => (state) => { if (state) applyTheme(state.theme); },
    },
  ),
);

// Apply theme immediately on module load (in case persisted)
if (typeof document !== "undefined") applyTheme(useUI.getState().theme);
