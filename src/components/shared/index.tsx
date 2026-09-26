import { useId, useRef, useState, type ReactNode } from "react";
import { AlertCircle, Camera, Images, Paperclip, X, FileText, Search, RefreshCw, Inbox } from "lucide-react";
import { toast } from "sonner";
import { cn, compressImage, readAsDataURL } from "@/lib/utils";
import { formatRupiah, initials, parseRupiahInput, toThousandInput } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/constants";
import { Button, Input, Progress, Skeleton } from "@/components/ui";

/* ---------- Rupiah text (wraps, never overflows) ---------- */
export function RupiahText({ value, className, sign }: { value: number; className?: string; sign?: "pos" | "neg" }) {
  const prefix = sign === "pos" ? "+" : sign === "neg" ? "−" : "";
  return (
    <span className={cn("tabular break-anywhere", className)}>
      {prefix}
      {formatRupiah(value)}
    </span>
  );
}

/* ---------- Card ---------- */
export function Card({ className, children, onClick, as: Tag = "div", role, tabIndex, onKeyDown, "aria-label": ariaLabel }: { className?: string; children: ReactNode; onClick?: () => void; as?: "div" | "article" | "section" | "li"; role?: string; tabIndex?: number; onKeyDown?: (e: React.KeyboardEvent) => void; "aria-label"?: string }) {
  return (
    <Tag onClick={onClick} role={role} tabIndex={tabIndex} onKeyDown={onKeyDown} aria-label={ariaLabel} className={cn("min-w-0 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm", onClick && "card-hover cursor-pointer hover:border-primary/40", className)}>
      {children}
    </Tag>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-24 w-full rounded-xl", className)} />;
}

export function ListSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("grid gap-3", className)}>
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
    </div>
  );
}

/* ---------- Stat card ---------- */
export type Tone = "default" | "income" | "expense" | "warning" | "neutral" | "info";
export function StatCard({ title, value, icon, tone = "default", hint, action, className }: { title: string; value: ReactNode; icon?: ReactNode; tone?: Tone; hint?: ReactNode; action?: ReactNode; className?: string }) {
  const text = { default: "text-foreground", income: "text-success", expense: "text-destructive", warning: "text-warning-foreground dark:text-warning", neutral: "text-foreground", info: "text-info" }[tone];
  const bg = { default: "bg-primary/10 text-primary", income: "bg-success/15 text-success", expense: "bg-destructive/10 text-destructive", warning: "bg-warning/25 text-warning-foreground dark:text-warning", neutral: "bg-muted text-muted-foreground", info: "bg-info/15 text-info" }[tone];
  return (
    <div className={cn("card-hover min-w-0 w-full rounded-xl border bg-card p-4 shadow-sm sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">{title}</p>
          <p className={cn("text-fluid-stat mt-1.5 font-bold break-anywhere", text)}>{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground break-anywhere">{hint}</p>}
        </div>
        {icon && <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", bg)}>{icon}</div>}
      </div>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/* ---------- Page header ---------- */
export function PageHeader({ title, description, actions, icon }: { title: string; description?: string; actions?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {icon && <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>}
        <div className="min-w-0">
          <h1 className="text-fluid-h3 font-bold tracking-tight break-anywhere">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ title, action, className }: { title: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-2.5 flex items-center justify-between gap-3", className)}>
      <h2 className="text-base font-semibold sm:text-lg">{title}</h2>
      {action}
    </div>
  );
}

/* ---------- Empty / Error ---------- */
export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-4 py-10 text-center", className)}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon ?? <Inbox className="h-6 w-6" />}</span>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = "Data belum dapat dimuat.", onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border bg-card px-4 py-10 text-center" role="alert">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"><AlertCircle className="h-6 w-6" /></span>
      <p className="mt-3 text-sm font-semibold">{message}</p>
      <p className="mt-1 text-sm text-muted-foreground">Periksa koneksi Anda lalu coba lagi.</p>
      {onRetry && <Button variant="outline" className="mt-4" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={onRetry}>Coba Lagi</Button>}
    </div>
  );
}

/* ---------- Status badge ---------- */
const statusTone: Record<string, string> = {
  selesai: "bg-success/15 text-success", lunas: "bg-success/15 text-success", aktif: "bg-success/15 text-success", tersedia: "bg-success/15 text-success", berlangsung: "bg-success/15 text-success",
  belum_bayar: "bg-warning/25 text-warning-foreground dark:text-warning", pending: "bg-warning/25 text-warning-foreground dark:text-warning", proses: "bg-info/15 text-info", akan_datang: "bg-primary/10 text-primary", baru: "bg-info/15 text-info",
  telat: "bg-destructive/10 text-destructive", ditolak: "bg-destructive/10 text-destructive", dibatalkan: "bg-destructive/10 text-destructive", mendesak: "bg-destructive/10 text-destructive",
  arsip: "bg-muted text-muted-foreground", terjual: "bg-muted text-muted-foreground", nonaktif: "bg-muted text-muted-foreground", pindah: "bg-muted text-muted-foreground", meninggal: "bg-muted text-muted-foreground", normal: "bg-muted text-muted-foreground",
  penting: "bg-warning/25 text-warning-foreground dark:text-warning",
  admin: "bg-primary/10 text-primary", ketua: "bg-primary/10 text-primary", bendahara: "bg-success/15 text-success", pengurus: "bg-info/15 text-info", warga: "bg-muted text-muted-foreground",
};
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide", statusTone[status] ?? "bg-muted text-muted-foreground", className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

/* ---------- Avatar ---------- */
export function Avatar({ name, src, size = "md", className }: { name?: string; src?: string; size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const s = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-base", xl: "h-24 w-24 text-2xl" }[size];
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-bold text-primary", s, className)}>
      {src ? <img src={src} alt={name ?? "Foto"} className="h-full w-full object-cover" /> : initials(name)}
    </span>
  );
}

/* ---------- Info row / key value ---------- */
export function InfoRow({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-0.5 py-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4", className)}>
      <dt className="text-xs font-medium text-muted-foreground sm:w-40 sm:shrink-0 sm:text-sm">{label}</dt>
      <dd className="min-w-0 text-sm font-medium break-anywhere sm:text-right">{value ?? "-"}</dd>
    </div>
  );
}

/* ---------- Search input ---------- */
export function SearchInput({ value, onChange, placeholder = "Cari...", className, autoFocus }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; autoFocus?: boolean }) {
  return (
    <Input
      type="search"
      value={value}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className={className}
      leftIcon={<Search className="h-4 w-4" />}
      rightSlot={value ? (
        <button type="button" onClick={() => onChange("")} aria-label="Hapus pencarian" className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
      ) : undefined}
    />
  );
}

/* ---------- Rupiah input ---------- */
export function RupiahInput({ value, onChange, id, placeholder = "0", className, autoFocus, large }: { value: number; onChange: (n: number) => void; id?: string; placeholder?: string; className?: string; autoFocus?: boolean; large?: boolean }) {
  return (
    <div className="relative w-full min-w-0">
      <span className={cn("pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground", large ? "text-lg" : "text-sm")}>Rp</span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        autoFocus={autoFocus}
        value={toThousandInput(value)}
        placeholder={placeholder}
        onChange={(e) => onChange(parseRupiahInput(e.target.value))}
        className={cn(
          "w-full min-w-0 rounded-lg border border-input bg-card pr-3 font-bold tabular text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25",
          large ? "h-14 pl-12 text-2xl" : "h-11 min-h-[44px] pl-10 text-base",
          className,
        )}
      />
    </div>
  );
}

/* ---------- File upload (camera / gallery / file) ---------- */
export interface UploadValue { url: string; name: string; type: string; size: number }
export function FileUploadField({ value, onChange, accept = "image/*,.pdf", maxSizeMB = 4, label = "Bukti / Foto", compact }: { value: UploadValue | null; onChange: (v: UploadValue | null) => void; accept?: string; maxSizeMB?: number; label?: string; compact?: boolean }) {
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const id = useId();

  async function handle(file?: File) {
    if (!file) return;
    const okType = file.type.startsWith("image/") || file.type === "application/pdf";
    if (!okType) return toast.error("Format tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF.");
    if (file.size > maxSizeMB * 1024 * 1024) return toast.error(`Ukuran file maksimal ${maxSizeMB} MB.`);
    setProgress(8);
    const timer = setInterval(() => setProgress((p) => (p === null ? null : Math.min(88, p + 12))), 90);
    try {
      const url = file.type.startsWith("image/") ? await compressImage(file) : await readAsDataURL(file);
      clearInterval(timer);
      setProgress(100);
      onChange({ url, name: file.name, type: file.type, size: file.size });
      setTimeout(() => setProgress(null), 400);
      toast.success("File siap diunggah");
    } catch {
      clearInterval(timer);
      setProgress(null);
      toast.error("Gagal membaca file. Coba lagi.");
    }
  }

  const isImage = value?.type.startsWith("image/");
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-sm font-medium" id={`${id}-label`}>{label}</p>
      <input ref={camRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} onChange={(e) => { handle(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={galRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => { handle(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={fileRef} type="file" accept={accept} className="sr-only" tabIndex={-1} onChange={(e) => { handle(e.target.files?.[0]); e.target.value = ""; }} />

      {value ? (
        <div className="overflow-hidden rounded-xl border bg-muted/30">
          {isImage ? (
            <img src={value.url} alt="Pratinjau bukti" className="max-h-64 w-full object-contain bg-black/5" />
          ) : (
            <div className="flex items-center gap-3 p-4"><FileText className="h-8 w-8 text-primary" /><span className="truncate text-sm font-medium">{value.name}</span></div>
          )}
          <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
            <span className="truncate text-xs text-muted-foreground">{value.name} · {(value.size / 1024).toFixed(0)} KB</span>
            <button type="button" onClick={() => onChange(null)} className="touch-target inline-flex items-center gap-1 rounded-lg px-2 text-xs font-semibold text-destructive hover:bg-destructive/10"><X className="h-4 w-4" /> Hapus</button>
          </div>
        </div>
      ) : (
        <div className={cn("grid gap-2", compact ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-3")} role="group" aria-labelledby={`${id}-label`}>
          <UploadBtn icon={<Camera className="h-5 w-5" />} label="Ambil Foto" onClick={() => camRef.current?.click()} compact={compact} />
          <UploadBtn icon={<Images className="h-5 w-5" />} label="Pilih dari Galeri" onClick={() => galRef.current?.click()} compact={compact} />
          <UploadBtn icon={<Paperclip className="h-5 w-5" />} label="Pilih File" onClick={() => fileRef.current?.click()} compact={compact} />
        </div>
      )}
      {progress !== null && (
        <div className="mt-2">
          <Progress value={progress} />
          <p className="mt-1 text-xs text-muted-foreground">Mengunggah… {progress}%</p>
        </div>
      )}
      <p className="mt-1.5 text-xs text-muted-foreground">JPG, PNG, WEBP, atau PDF. Maks {maxSizeMB} MB.</p>
    </div>
  );
}
function UploadBtn({ icon, label, onClick, compact }: { icon: ReactNode; label: string; onClick: () => void; compact?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 text-sm font-medium text-primary hover:bg-primary/10", compact ? "flex-col py-3 text-xs" : "py-3")}>
      {icon}
      <span className="text-center leading-tight">{label}</span>
    </button>
  );
}

/* ---------- Table shell (desktop): horizontal scroll ONLY inside ---------- */
export function TableShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("w-full overflow-hidden rounded-xl border bg-card shadow-sm", className)}>
      <div className="w-full overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[720px] text-sm [&_th]:whitespace-nowrap [&_th]:px-3 [&_th]:py-3 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-muted-foreground [&_td]:px-3 [&_td]:py-3 [&_td]:align-middle lg:[&_td]:px-4 lg:[&_th]:px-4">
          {children}
        </table>
      </div>
    </div>
  );
}

/* ---------- Icon button with label ---------- */
export function IconButton({ icon, label, onClick, tone = "default", className }: { icon: ReactNode; label: string; onClick: () => void; tone?: "default" | "destructive" | "primary" | "whatsapp"; className?: string }) {
  const t = { default: "text-muted-foreground hover:bg-muted hover:text-foreground", destructive: "text-destructive hover:bg-destructive/10", primary: "text-primary hover:bg-primary/10", whatsapp: "text-[#25D366] hover:bg-[#25D366]/10" }[tone];
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={cn("inline-flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-lg lg:h-11 lg:w-11", t, className)}>
      {icon}
    </button>
  );
}

/* ---------- Filter bar ---------- */
export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-2 sm:flex sm:flex-wrap sm:items-center [&>*]:min-w-0 sm:[&>*]:w-auto sm:[&>*]:min-w-[180px]", className)}>{children}</div>;
}
