import { Component, Suspense, lazy, useEffect, useState, type ComponentType, type LazyExoticComponent, type ReactNode } from "react";
import { Download, X } from "lucide-react";
import { Toaster } from "sonner";
import { useUI } from "@/store/ui";
import { useData } from "@/data/store";
import { useInstallPrompt } from "@/hooks";
import { Sidebar, MobileDrawer } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { SearchOverlay, NotificationSheet, QuickActionsSheet, QuickFab } from "./overlays";
import { ErrorState, CardSkeleton } from "@/components/shared";
import { Button } from "@/components/ui";
import type { MenuKey } from "@/lib/constants";

const views: Record<MenuKey, LazyExoticComponent<ComponentType>> = {
  dashboard: lazy(() => import("@/views/DashboardView")),
  pemasukan: lazy(() => import("@/views/TransaksiView").then((m) => ({ default: m.PemasukanView }))),
  pengeluaran: lazy(() => import("@/views/TransaksiView").then((m) => ({ default: m.PengeluaranView }))),
  tagihan: lazy(() => import("@/views/TagihanView")),
  warga: lazy(() => import("@/views/WargaView")),
  kegiatan: lazy(() => import("@/views/KegiatanView")),
  kwitansi: lazy(() => import("@/views/KwitansiView")),
  laporan: lazy(() => import("@/views/LaporanView")),
  trafik: lazy(() => import("@/views/TrafikView")),
  marketplace: lazy(() => import("@/views/MarketplaceView")),
  pengaduan: lazy(() => import("@/views/PengaduanView")),
  pengumuman: lazy(() => import("@/views/PengumumanView")),
  struktur: lazy(() => import("@/views/StrukturView")),
  whatsapp: lazy(() => import("@/views/WhatsappView")),
  tautan: lazy(() => import("@/views/TautanView")),
  pengaturan: lazy(() => import("@/views/PengaturanView")),
};
const WargaApp = lazy(() => import("./warga/WargaApp"));

class ErrorBoundary extends Component<{ children: ReactNode; resetKey: string }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.hasError) this.setState({ hasError: false });
  }
  render() {
    if (this.state.hasError) return <ErrorState message="Data belum dapat dimuat." onRetry={() => this.setState({ hasError: false })} />;
    return this.props.children;
  }
}

function ViewSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Memuat">
      <CardSkeleton className="h-12 w-2/3 max-w-xs" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} className="h-28" />)}</div>
      <CardSkeleton className="h-72" />
    </div>
  );
}

export function ViewRouter() {
  const activeView = useUI((s) => s.activeView);
  const View = views[activeView] ?? views.dashboard;
  return (
    <ErrorBoundary resetKey={activeView}>
      <Suspense fallback={<ViewSkeleton />}>
        <div key={activeView} className="animate-fade-in"><View /></div>
      </Suspense>
    </ErrorBoundary>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/30 px-4 py-4 pb-safe-4 text-center text-xs text-muted-foreground">
      <p className="font-medium break-anywhere">Sistem Informasi RT 002 — Blok Mawar • Ciptaland Batam</p>
      <p className="mt-1 break-anywhere">© {new Date().getFullYear()} Pengurus RT 002 RW 014. Digital Operating System Warga.</p>
    </footer>
  );
}

export function InstallBanner() {
  const { canInstall, install, isStandalone } = useInstallPrompt();
  const dismissed = useUI((s) => s.installDismissed);
  const setDismissed = useUI((s) => s.setInstallDismissed);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);
  if (!canInstall || isStandalone || dismissed || !visible) return null;
  return (
    <div className="fixed inset-x-3 z-40 mx-auto max-w-md rounded-xl border bg-card p-3 shadow-xl animate-slide-up bottom-safe-nav sm:bottom-safe-4 sm:inset-x-auto sm:right-4" role="dialog" aria-label="Install aplikasi">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Download className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Install Sistem Informasi RT 002</p>
          <p className="text-xs text-muted-foreground">Akses cepat dari layar utama, seperti aplikasi native.</p>
        </div>
        <button onClick={() => setDismissed(true)} aria-label="Tutup" className="touch-target -mr-2 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
      </div>
      <Button size="sm" fullWidth className="mt-2" onClick={async () => { const r = await install(); if (r !== "accepted") setDismissed(true); }}>Install Aplikasi</Button>
    </div>
  );
}

function AdminShell() {
  return (
    <div className="flex min-h-dvh w-full max-w-[100vw] bg-background">
      <Sidebar />
      <MobileDrawer />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader />
        <main className="flex-1 px-4 py-4 sm:px-5 sm:py-6 lg:px-8 pb-24 lg:pb-8">
          <div className="mx-auto w-full max-w-7xl min-w-0">
            <ViewRouter />
          </div>
        </main>
        <Footer />
      </div>
      <QuickFab />
      <SearchOverlay />
      <NotificationSheet />
      <QuickActionsSheet />
      <InstallBanner />
    </div>
  );
}

export function AppShell() {
  const role = useUI((s) => s.role);
  const syncRemoteData = useData((s) => s.syncRemoteData);

  useEffect(() => {
    void syncRemoteData();
  }, [syncRemoteData]);

  return (
    <>
      {role === "warga" ? (
        <Suspense fallback={<div className="p-4"><ViewSkeleton /></div>}>
          <WargaApp />
        </Suspense>
      ) : (
        <AdminShell />
      )}
      <Toaster position="top-center" richColors closeButton toastOptions={{ className: "text-sm", style: { marginTop: "env(safe-area-inset-top, 0px)" } }} />
    </>
  );
}
