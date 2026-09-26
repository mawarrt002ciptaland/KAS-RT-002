import { Home, Sparkles, PanelLeftClose, PanelLeftOpen, Download } from "lucide-react";
import { useUI } from "@/store/ui";
import { useData } from "@/data/store";
import { MENU_ITEMS, RT_INFO, type MenuItem } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Drawer } from "@/components/ui/Modal";
import { useInstallPrompt } from "@/hooks";
import { toast } from "sonner";

function Brand({ compact }: { compact?: boolean }) {
  const logo = useData((s) => s.pengaturan.logo_url);
  const namaRT = useData((s) => s.pengaturan.nama_rt);
  return (
    <div className={cn("flex items-center gap-3", compact && "justify-center")}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary text-primary-foreground shadow-sm">
        {logo ? <img src={logo} alt="Logo RT 002" className="h-full w-full object-cover" /> : <Home className="h-5 w-5" />}
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-extrabold leading-tight tracking-tight">SISTEM INFORMASI RT 002</p>
          <p className="truncate text-xs text-muted-foreground">{namaRT || "Blok Mawar"} • {RT_INFO.perumahan} {RT_INFO.kota}</p>
        </div>
      )}
    </div>
  );
}

function NavBtn({ item, active, onClick, compact }: { item: MenuItem; active: boolean; onClick: () => void; compact?: boolean }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      title={compact ? item.label : undefined}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex min-h-[44px] w-full items-center gap-3 rounded-lg text-left text-sm transition-colors",
        compact ? "justify-center px-0" : "px-3 py-2.5",
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-sidebar-foreground hover:bg-sidebar-accent",
      )}
    >
      <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
      {!compact && <span className="flex-1 truncate font-medium">{item.label}</span>}
      {!compact && active && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
    </button>
  );
}

function MenuList({ compact, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  const activeView = useUI((s) => s.activeView);
  const navigate = useUI((s) => s.navigate);
  const utama = MENU_ITEMS.filter((m) => m.group === "utama");
  const org = MENU_ITEMS.filter((m) => m.group === "organisasi");
  const go = (k: MenuItem["key"]) => { navigate(k); onNavigate?.(); };
  return (
    <nav className={cn("flex flex-col gap-1", compact ? "p-2" : "p-3")} aria-label="Menu navigasi">
      {!compact && <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Menu Utama</p>}
      {utama.map((m) => <NavBtn key={m.key} item={m} active={activeView === m.key} onClick={() => go(m.key)} compact={compact} />)}
      {!compact ? <p className="px-2 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Organisasi & Sistem</p> : <div className="my-2 border-t" />}
      {org.map((m) => <NavBtn key={m.key} item={m} active={activeView === m.key} onClick={() => go(m.key)} compact={compact} />)}
    </nav>
  );
}

function RoleSwitch({ compact, onDone }: { compact?: boolean; onDone?: () => void }) {
  const role = useUI((s) => s.role);
  const setRole = useUI((s) => s.setRole);
  return (
    <button
      onClick={() => { setRole(role === "admin" ? "warga" : "admin"); onDone?.(); toast.success(role === "admin" ? "Beralih ke Mode Warga" : "Beralih ke Mode Admin"); }}
      title="Ganti mode"
      className={cn("flex min-h-[44px] w-full items-center gap-2 rounded-lg bg-primary/10 text-sm font-medium text-primary hover:bg-primary/15", compact ? "justify-center px-0" : "px-3 py-2")}
    >
      <Sparkles className="h-4 w-4 shrink-0" />
      {!compact && <span className="flex-1 text-left">Mode {role === "admin" ? "Warga" : "Admin"}</span>}
    </button>
  );
}

/** Desktop (lg): full 260px sidebar (collapsible). Tablet (md): icon rail. Mobile: hidden (drawer). */
export function Sidebar() {
  const collapsed = useUI((s) => s.sidebarCollapsed);
  const toggle = useUI((s) => s.toggleSidebar);
  return (
    <>
      {/* Tablet rail */}
      <aside className="sticky top-0 hidden h-dvh w-[72px] shrink-0 flex-col border-r bg-sidebar md:flex lg:hidden" aria-label="Sidebar">
        <div className="border-b px-3 py-4"><Brand compact /></div>
        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide"><MenuList compact /></div>
        <div className="border-t p-2"><RoleSwitch compact /></div>
      </aside>
      {/* Desktop */}
      <aside className={cn("sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-sidebar transition-[width] duration-200 lg:flex", collapsed ? "w-[76px]" : "w-[264px]")} aria-label="Sidebar">
        <div className={cn("flex items-center border-b py-4", collapsed ? "justify-center px-2" : "justify-between px-4")}>
          <Brand compact={collapsed} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin"><MenuList compact={collapsed} /></div>
        <div className={cn("space-y-2 border-t", collapsed ? "p-2" : "p-3")}>
          <RoleSwitch compact={collapsed} />
          <button onClick={toggle} aria-label={collapsed ? "Perlebar sidebar" : "Ciutkan sidebar"} className={cn("flex min-h-[44px] w-full items-center gap-2 rounded-lg text-sm text-muted-foreground hover:bg-sidebar-accent", collapsed ? "justify-center" : "px-3")}>
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            {!collapsed && <span>Ciutkan</span>}
          </button>
          {!collapsed && <p className="px-2 text-[11px] leading-snug text-muted-foreground">{RT_INFO.namaLengkap}</p>}
        </div>
      </aside>
    </>
  );
}

/** Mobile drawer: slide from left, overlay, X, Escape */
export function MobileDrawer() {
  const open = useUI((s) => s.drawerOpen);
  const setOpen = useUI((s) => s.setDrawerOpen);
  const { canInstall, install } = useInstallPrompt();
  return (
    <Drawer open={open} onClose={() => setOpen(false)} side="left" title="Menu" ariaLabel="Menu navigasi" className="w-[290px]">
      <div className="border-b px-4 py-3"><Brand /></div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-thin"><MenuList onNavigate={() => setOpen(false)} /></div>
      <div className="space-y-2 border-t p-3 pb-safe-3">
        {canInstall && (
          <button onClick={() => install()} className="flex min-h-[44px] w-full items-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted">
            <Download className="h-4 w-4 text-primary" /> Install Sistem Informasi RT 002
          </button>
        )}
        <RoleSwitch onDone={() => setOpen(false)} />
      </div>
    </Drawer>
  );
}
