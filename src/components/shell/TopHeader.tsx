import { Menu, Search, Bell, Sun, Moon, User, ChevronDown, ChevronRight, LogOut, Settings, Sparkles, Home, Users } from "lucide-react";
import { toast } from "sonner";
import { useUI } from "@/store/ui";
import { useData } from "@/data/store";
import { useAuth } from "@/store/auth";
import { MENU_LABEL } from "@/lib/constants";
import { Dropdown } from "@/components/ui/Modal";
import { useNotifications } from "./overlays";

export function TopHeader() {
  const activeView = useUI((s) => s.activeView);
  const setDrawerOpen = useUI((s) => s.setDrawerOpen);
  const setSearchOpen = useUI((s) => s.setSearchOpen);
  const setNotifOpen = useUI((s) => s.setNotifOpen);
  const navigate = useUI((s) => s.navigate);
  const theme = useUI((s) => s.theme);
  const toggleTheme = useUI((s) => s.toggleTheme);
  const setRole = useUI((s) => s.setRole);
  const authUser = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const logo = useData((s) => s.pengaturan.logo_url);
  const { unread } = useNotifications();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 pt-safe backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-14 items-center gap-1 px-2 sm:gap-2 sm:px-4">
        {/* Hamburger (mobile) */}
        <button onClick={() => setDrawerOpen(true)} className="touch-target flex items-center justify-center rounded-lg text-foreground hover:bg-muted md:hidden" aria-label="Buka menu">
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile brand: [LOGO] SISTEM INFORMASI RT 002 */}
        <button onClick={() => navigate("dashboard")} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1 text-left lg:hidden" aria-label="Ke Dashboard">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary text-primary-foreground">
            {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : <Home className="h-4 w-4" />}
          </span>
          <span className="min-w-0 leading-none">
            <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Sistem Informasi</span>
            <span className="block truncate text-sm font-extrabold">RT 002 Mawar</span>
          </span>
        </button>

        {/* Desktop breadcrumb */}
        <nav className="hidden min-w-0 flex-1 items-center gap-1.5 text-sm lg:flex" aria-label="Breadcrumb">
          <button onClick={() => navigate("dashboard")} className="text-muted-foreground hover:text-foreground">Sistem Informasi RT 002</button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="truncate font-semibold" aria-current="page">{MENU_LABEL[activeView]}</span>
        </nav>

        {/* Search: icon on mobile, pill on desktop */}
        <button onClick={() => setSearchOpen(true)} className="touch-target flex items-center justify-center gap-2 rounded-lg text-muted-foreground hover:bg-muted sm:border sm:bg-muted/40 sm:px-3" aria-label="Cari data">
          <Search className="h-5 w-5 sm:h-4 sm:w-4" />
          <span className="hidden text-sm sm:inline">Cari data...</span>
          <kbd className="hidden rounded border bg-background px-1.5 text-[10px] font-medium lg:inline">/</kbd>
        </button>

        {/* Theme (tablet+) */}
        <button onClick={toggleTheme} className="touch-target hidden items-center justify-center rounded-lg hover:bg-muted sm:flex" aria-label={theme === "dark" ? "Tema terang" : "Tema gelap"}>
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <button onClick={() => setNotifOpen(true)} className="touch-target relative flex items-center justify-center rounded-lg hover:bg-muted" aria-label={`Notifikasi${unread ? `, ${unread} belum dibaca` : ""}`}>
          <Bell className="h-5 w-5" />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground ring-2 ring-background">{unread > 9 ? "9+" : unread}</span>}
        </button>

        {/* Avatar */}
        <Dropdown
          align="right"
          trigger={(open) => (
            <button className="touch-target flex items-center gap-1.5 rounded-full border bg-card p-0.5 hover:bg-muted sm:pr-2" aria-label="Akun" aria-expanded={open}>
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground">{authUser?.foto ? <img src={authUser.foto} alt="" className="h-full w-full object-cover" /> : <User className="h-4 w-4" />}</span>
              <span className="hidden max-w-32 truncate text-xs font-semibold sm:inline">{authUser?.nama ?? "Akun RT"}</span>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:inline" />
            </button>
          )}
          items={[
            { label: "Pengaturan", icon: <Settings className="h-4 w-4" />, onClick: () => navigate("pengaturan") },
            ...(authUser?.role === "admin" ? [{ label: "Kelola Akun", icon: <Users className="h-4 w-4" />, onClick: () => navigate("pengaturan") }] : []),
            { label: theme === "dark" ? "Tema Terang" : "Tema Gelap", icon: theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />, onClick: toggleTheme },
            ...(authUser?.role !== "warga" ? [{ label: "Mode Warga", icon: <Sparkles className="h-4 w-4" />, onClick: () => { setRole("warga"); toast.success("Beralih ke tampilan warga"); } }] : []),
            { label: "Keluar", icon: <LogOut className="h-4 w-4" />, tone: "destructive", onClick: () => { void logout().then(() => { useUI.getState().setActiveView("dashboard"); toast.success("Anda sudah keluar."); }).catch(() => toast.error("Logout belum dapat diproses. Periksa koneksi, lalu coba lagi.")); } },
          ]}
        />
      </div>
    </header>
  );
}
