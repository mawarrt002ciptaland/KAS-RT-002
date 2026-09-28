import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEscape, useLockBodyScroll } from "@/hooks";
import { Button } from "./index";

/* ------------------------------------------------------------------ */
/* Modal: bottom sheet on mobile (<640px), centered dialog on desktop  */
/* ------------------------------------------------------------------ */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;  
  size?: "sm" | "md" | "lg" | "xl";
  fullOnMobile?: boolean;
  bodyClassName?: string;
  hideClose?: boolean;
  headerExtra?: ReactNode;
}

const sizes = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" };

export function Modal({ open, onClose, title, description, children, footer, size = "md", fullOnMobile, bodyClassName, hideClose, headerExtra }: ModalProps) {
  const id = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const stableClose = useCallback(() => onClose(), [onClose]);
  useEscape(stableClose, open);
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => {
      const el = panelRef.current?.querySelector<HTMLElement>("[data-autofocus], input:not([type=hidden]), select, textarea, button:not([data-close])");
      el?.focus({ preventScroll: true });
    }, 60);
    return () => {
      clearTimeout(t);
      prev?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className={cn("fixed inset-0 z-[80] flex justify-center", fullOnMobile ? "items-stretch sm:items-center sm:p-4" : "items-end sm:items-center sm:p-4")} role="presentation">
      <div className="absolute inset-0 bg-black/55 animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? `${id}-title` : undefined}
        className={cn(
          "relative flex w-full flex-col bg-card text-card-foreground shadow-2xl",
          fullOnMobile ? "h-dvh max-h-dvh sm:h-auto sm:max-h-[90vh] sm:rounded-2xl" : "max-h-[90vh] rounded-t-2xl sm:rounded-2xl",
          "animate-slide-up sm:animate-zoom-in",
          sizes[size],
        )}
      >
        {!fullOnMobile && <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30 sm:hidden" aria-hidden />}
        {(title || !hideClose) && (
          <div className={cn("flex shrink-0 items-start gap-3 border-b px-4 py-3 sm:px-5", fullOnMobile && "pt-safe")}>
            <div className="min-w-0 flex-1 pt-1">
              {title && <h2 id={`${id}-title`} className="text-base font-bold leading-snug sm:text-lg">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
            </div>
            {headerExtra}
            {!hideClose && (
              <button data-close onClick={onClose} aria-label="Tutup" className="touch-target -mr-2 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5", !footer && "pb-safe-4", bodyClassName)}>{children}</div>
        {footer && <div className="flex shrink-0 flex-col-reverse gap-2 border-t px-4 py-3 pb-safe-3 sm:flex-row sm:justify-end sm:px-5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/* Drawer: side panel (left for nav, right for notifications)          */
/* FIX: Tambah -webkit-overflow-scrolling: touch untuk iOS Safari      */
/* ------------------------------------------------------------------ */
export function Drawer({ open, onClose, side = "left", title, children, className, ariaLabel }: { open: boolean; onClose: () => void; side?: "left" | "right"; title?: ReactNode; children: ReactNode; className?: string; ariaLabel?: string }) {
  const stableClose = useCallback(() => onClose(), [onClose]);
  useEscape(stableClose, open);
  useLockBodyScroll(open);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70]" role="presentation">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? (typeof title === "string" ? title : "Panel")}
        className={cn(
          "absolute top-0 flex h-dvh w-[300px] max-w-[85vw] flex-col bg-sidebar text-sidebar-foreground shadow-2xl",
          side === "left" ? "left-0 animate-slide-in-left" : "right-0 animate-slide-in-right",
          className,
        )}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b px-4 py-3 pt-safe">
            <h2 className="text-base font-bold">{title}</h2>
            <button onClick={onClose} aria-label="Tutup" className="touch-target -mr-2 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/* Confirm dialog                                                      */
/* ------------------------------------------------------------------ */
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Ya, lanjutkan", tone = "destructive" }: { open: boolean; onClose: () => void; onConfirm: () => void | Promise<void>; title: string; description?: ReactNode; confirmLabel?: string; tone?: "destructive" | "primary" }) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      hideClose
      footer={
        <>
          <Button variant="outline" onClick={onClose} fullWidth className="sm:w-auto">Batal</Button>
          <Button
            variant={tone}
            loading={busy}
            fullWidth
            className="sm:w-auto"
            onClick={async () => {
              setBusy(true);
              try { await onConfirm(); } finally { setBusy(false); onClose(); }
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", tone === "destructive" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-bold">{title}</h3>
          {description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Dropdown menu (desktop header avatar etc.)                          */
/* FIX: Delay 300ms sebelum attach touchstart listener supaya tap      */
/* pembuka tidak langsung menutup dropdown di HP (mobile bug)         */
/* ------------------------------------------------------------------ */
export function Dropdown({ trigger, items, align = "right" }: { trigger: (open: boolean) => ReactNode; items: { label: string; icon?: ReactNode; onClick: () => void; tone?: "default" | "destructive" }[]; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      const onDoc = (e: MouseEvent | TouchEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener("mousedown", onDoc);
      document.addEventListener("touchstart", onDoc, { passive: true });
      return () => {
        document.removeEventListener("mousedown", onDoc);
        document.removeEventListener("touchstart", onDoc);
      };
    }, 300);
    return () => clearTimeout(timer);
  }, [open]);
  useEscape(() => setOpen(false), open);
  return (
    <div ref={ref} className="relative">
      <div onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>{trigger(open)}</div>
      {open && (
        <div role="menu" className={cn("absolute top-full z-[90] mt-2 w-56 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-xl animate-slide-down", align === "right" ? "right-0" : "left-0")}>
          {items.map((it) => (
            <button
              key={it.label}
              role="menuitem"
              onClick={() => { setOpen(false); it.onClick(); }}
              className={cn("flex min-h-[44px] w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm hover:bg-muted", it.tone === "destructive" && "text-destructive")}
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
