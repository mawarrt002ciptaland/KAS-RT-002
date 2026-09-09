"use client";
import { apiFetch, clearToken } from "@/lib/api";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Layers,
  ArrowDownCircle,
  ArrowUpCircle,
  ReceiptText,
  MessageCircle,
  FileBarChart,
  Settings,
  LogOut,
  Wallet,
  Menu,
  X,
  Store,
  FileCheck,
} from "lucide-react";

export type Me = {
  id: number;
  username: string;
  role: string;
  wargaId: number | null;
  nama: string;
  noRumah: string;
};

const MeContext = createContext<Me | null>(null);
export function useMe() {
  return useContext(MeContext);
}

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "warga"] },
  { href: "/warga", label: "Data Warga", icon: Users, roles: ["admin", "warga"] },
  { href: "/iuran", label: "Jenis Iuran", icon: Layers, roles: ["admin"] },
  { href: "/pemasukan", label: "Pemasukan", icon: ArrowDownCircle, roles: ["admin", "warga"] },
  { href: "/pengeluaran", label: "Pengeluaran", icon: ArrowUpCircle, roles: ["admin", "warga"] },
  { href: "/tagihan", label: "Tagihan", icon: ReceiptText, roles: ["admin", "warga"] },
  { href: "/whatsapp", label: "Kirim WhatsApp", icon: MessageCircle, roles: ["admin"] },
  { href: "/kwitansi", label: "Kwitansi", icon: FileCheck, roles: ["admin", "warga"] },
  { href: "/laporan", label: "Laporan", icon: FileBarChart, roles: ["admin", "warga"] },
  { href: "/marketplace", label: "Marketplace", icon: Store, roles: ["admin", "warga"] },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings, roles: ["admin"] },
];

type Branding = {
  namaAplikasi: string;
  keteranganAplikasi: string;
  logoAplikasi: string;
  namaRt: string;
  namaPerumahan: string;
};

export default function AppShell({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branding, setBranding] = useState<Branding | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/branding")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setBranding(d))
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    apiFetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setMe(d.user))
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    clearToken();
    router.replace("/login");
  }

  if (loading || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-indigo-200 border-t-indigo-500" />
      </div>
    );
  }

  const items = NAV.filter((n) => n.roles.includes(me.role));
  const current = NAV.find((n) => pathname.startsWith(n.href));

  return (
    <MeContext.Provider value={me}>
      <div className="flex min-h-screen bg-slate-50">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white border-r border-slate-100 transition-transform lg:translate-x-0 lg:static ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } flex flex-col`}
        >
          <div className="flex items-center gap-3 px-5 py-5">
            {branding?.logoAplikasi ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.logoAplikasi}
                alt="Logo"
                className="h-11 w-11 rounded-2xl object-cover shadow-lg shadow-indigo-500/20"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
                <Wallet size={22} />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[13px] font-extrabold text-slate-800 leading-snug">
                {branding?.namaRt || "Blok Mawar RT 002 RW 014"}
              </p>
              <p className="truncate text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                {branding?.namaPerumahan || "Perumahan Ciptaland"}
              </p>
            </div>
            <button
              className="ml-auto lg:hidden text-slate-400"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
            {items.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                    active
                      ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="m-3 rounded-2xl bg-indigo-50/70 p-4">
            <p className="text-xs font-extrabold text-indigo-600">
              Butuh Bantuan?
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-500 leading-relaxed">
              Hubungi pengurus RT 002 Blok Mawar untuk bantuan sistem.
            </p>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-slate-100 bg-white/80 px-5 py-3 backdrop-blur no-print">
            <button
              className="lg:hidden text-slate-500"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
              {me.role === "admin" ? "Admin" : "Warga"} /{" "}
              <span className="text-indigo-500">
                {current?.label ?? "Dashboard"}
              </span>
            </p>
            <div className="ml-auto flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-extrabold text-slate-800 leading-tight">
                  {me.nama}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {me.role === "admin" ? "Admin RT" : `Rumah ${me.noRumah}`}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-extrabold text-white">
                {me.nama.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={logout}
                title="Keluar"
                className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
              >
                <LogOut size={19} />
              </button>
            </div>
          </header>

          <main className="flex-1 px-5 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </MeContext.Provider>
  );
}
