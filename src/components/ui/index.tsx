import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------- Button ---------------- */
type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "whatsapp" | "soft";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

const variantClass: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
  secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
  outline: "border bg-card text-foreground hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  whatsapp: "bg-whatsapp text-white hover:bg-whatsapp-dark shadow-sm",
  soft: "bg-primary/10 text-primary hover:bg-primary/15",
};
const sizeClass: Record<Size, string> = {
  sm: "h-10 min-h-[40px] px-3 text-sm gap-1.5 rounded-lg",
  md: "h-11 min-h-[44px] px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 min-h-[48px] px-5 text-base gap-2 rounded-xl",
  icon: "h-11 w-11 min-h-[44px] min-w-[44px] rounded-lg",
  "icon-sm": "h-10 w-10 min-h-[40px] min-w-[40px] rounded-lg",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, fullWidth, leftIcon, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition-colors disabled:opacity-60 disabled:pointer-events-none active:scale-[0.98]",
        variantClass[variant],
        sizeClass[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : leftIcon}
      {children}
    </button>
  );
});

/* ---------------- Inputs ---------------- */
const fieldBase =
  "w-full min-w-0 rounded-lg border border-input bg-card px-3 text-[15px] text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:opacity-60";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, leftIcon, rightSlot, ...rest }, ref) {
  if (!leftIcon && !rightSlot) return <input ref={ref} className={cn(fieldBase, "h-11 min-h-[44px]", className)} {...rest} />;
  return (
    <div className="relative w-full min-w-0">
      {leftIcon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{leftIcon}</span>}
      <input ref={ref} className={cn(fieldBase, "h-11 min-h-[44px]", leftIcon && "pl-10", rightSlot && "pr-11", className)} {...rest} />
      {rightSlot && <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{rightSlot}</span>}
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, rows = 3, ...rest }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(fieldBase, "min-h-[88px] resize-y py-2.5 leading-relaxed", className)} {...rest} />;
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ className, options, placeholder, ...rest }, ref) {
  return (
    <div className="relative w-full min-w-0">
      <select ref={ref} className={cn(fieldBase, "h-11 min-h-[44px] appearance-none pr-10", className)} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </div>
  );
});

export function Label({ children, htmlFor, required, className }: { children: ReactNode; htmlFor?: string; required?: boolean; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 block text-sm font-medium text-foreground", className)}>
      {children}
      {required && <span className="ml-0.5 text-destructive" aria-hidden>*</span>}
    </label>
  );
}

export function Field({ label, htmlFor, required, hint, error, children, className }: { label?: string; htmlFor?: string; required?: boolean; hint?: ReactNode; error?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      {label && <Label htmlFor={htmlFor} required={required}>{label}</Label>}
      {children}
      {error ? <p className="mt-1 text-xs font-medium text-destructive">{error}</p> : hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/* ---------------- Badge ---------------- */
type BadgeTone = "default" | "success" | "warning" | "destructive" | "info" | "muted" | "primary" | "outline";
const badgeTone: Record<BadgeTone, string> = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground dark:text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/15 text-info",
  muted: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  outline: "border text-foreground",
};
export function Badge({ children, tone = "default", className, dot }: { children: ReactNode; tone?: BadgeTone; className?: string; dot?: boolean }) {
  return (
    <span className={cn("inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-5 whitespace-nowrap", badgeTone[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      <span className="truncate">{children}</span>
    </span>
  );
}

/* ---------------- Skeleton / Progress / Switch ---------------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-lg bg-muted", className)} aria-hidden />;
}

export function Progress({ value, className, tone = "primary" }: { value: number; className?: string; tone?: "primary" | "success" | "destructive" | "warning" | "info" }) {
  const color = { primary: "bg-primary", success: "bg-success", destructive: "bg-destructive", warning: "bg-warning", info: "bg-info" }[tone];
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-all duration-300", color)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Switch({ checked, onChange, label, description, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; id?: string }) {
  return (
    <label htmlFor={id} className="flex min-h-[44px] cursor-pointer items-center justify-between gap-4 py-1">
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-xs text-muted-foreground">{description}</span>}
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", checked ? "bg-primary" : "bg-muted-foreground/30")}
      >
        <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
      </button>
    </label>
  );
}

/* ---------------- Tabs (pills) ---------------- */
export function Tabs<T extends string>({ value, onChange, items, className, size = "md" }: { value: T; onChange: (v: T) => void; items: { value: T; label: string; count?: number; icon?: ReactNode }[]; className?: string; size?: "sm" | "md" }) {
  return (
    <div role="tablist" className={cn("-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide", className)}>
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border font-medium transition-colors",
              size === "sm" ? "h-9 px-3 text-xs" : "h-10 px-4 text-sm",
              active ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            {it.icon}
            {it.label}
            {typeof it.count === "number" && (
              <span className={cn("rounded-full px-1.5 text-[10px] font-bold", active ? "bg-white/25" : "bg-muted text-muted-foreground")}>{it.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Segmented tabs (underline) ---------------- */
export function SegmentTabs<T extends string>({ value, onChange, items, className }: { value: T; onChange: (v: T) => void; items: { value: T; label: string; icon?: ReactNode }[]; className?: string }) {
  return (
    <div role="tablist" className={cn("flex gap-1 overflow-x-auto border-b scrollbar-hide", className)}>
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={cn(
              "relative inline-flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap px-3 text-sm font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {it.icon}
            {it.label}
            {active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />}
          </button>
        );
      })}
    </div>
  );
}
