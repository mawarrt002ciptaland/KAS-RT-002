import { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { formatRupiah, formatRupiahCompact, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const PALETTE = ["#0f9f6e", "#34c48f", "#f2b134", "#e0654a", "#8b5cf6", "#3b9ed8", "#f472b6", "#a3e635", "#f97316", "#64748b"];

export const CHART_COLORS = PALETTE;

function TooltipBox({ active, payload, label, money = true }: { active?: boolean; payload?: { name: string; value: number; color?: string; payload?: Record<string, unknown> }[]; label?: string; money?: boolean }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
      {label && <p className="mb-1 font-semibold">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 tabular">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold">{money ? formatRupiah(p.value) : formatNumber(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

/* ---------------- Cash flow bar chart (12 months) ---------------- */
export function CashFlowChart({ data, className, height = 280 }: { data: { label: string; pemasukan: number; pengeluaran: number }[]; className?: string; height?: number }) {
  return (
    <div className={cn("w-full overflow-x-auto overflow-y-hidden scrollbar-thin", className)}>
      <div className="min-w-[560px] sm:min-w-0" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2} barCategoryGap="28%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={0} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={56} tickFormatter={(v) => formatRupiahCompact(v).replace("Rp ", "")} />
            <Tooltip content={<TooltipBox />} cursor={{ fill: "rgba(15,159,110,0.08)" }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Bar dataKey="pemasukan" name="Pemasukan" fill="#0f9f6e" radius={[6, 6, 0, 0]} maxBarSize={28} />
            <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#e0654a" radius={[6, 6, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-center text-[11px] text-muted-foreground sm:hidden">Geser ke samping untuk melihat semua bulan</p>
    </div>
  );
}

/* ---------------- Expense donut + legend below ---------------- */
export function ExpenseDonut({ data, total, className }: { data: { kategori: string; nominal: number; percent: number }[]; total: number; className?: string }) {
  const [active, setActive] = useState<number | null>(null);
  return (
    <div className={cn("w-full", className)}>
      <div className="relative mx-auto h-56 w-full max-w-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="nominal" nameKey="kategori" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none" onMouseEnter={(_, i) => setActive(i)} onMouseLeave={() => setActive(null)} onClick={(_, i) => setActive((a) => (a === i ? null : i))}>
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} opacity={active === null || active === i ? 1 : 0.4} />
              ))}
            </Pie>
            <Tooltip content={<TooltipBox />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <span className="text-[11px] font-medium text-muted-foreground">{active !== null && data[active] ? data[active].kategori : "Total"}</span>
          <span className="text-base font-bold leading-tight tabular break-anywhere sm:text-lg">{formatRupiah(active !== null && data[active] ? data[active].nominal : total)}</span>
        </div>
      </div>
      <ul className="mt-3 divide-y">
        {data.map((d, i) => (
          <li key={d.kategori}>
            <button type="button" onClick={() => setActive((a) => (a === i ? null : i))} className={cn("flex min-h-[44px] w-full items-center gap-3 py-2 text-left", active === i && "font-semibold")}>
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
              <span className="min-w-0 flex-1 truncate text-sm">{d.kategori}</span>
              <span className="shrink-0 text-sm font-semibold tabular">{formatRupiah(d.nominal)}</span>
              <span className="w-10 shrink-0 text-right text-xs text-muted-foreground tabular">{Math.round(d.percent)}%</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Generic bar list (category horizontal bars) ---------------- */
export function BarList({ items, colorIndex = 0, money = true }: { items: { label: string; value: number; percent?: number }[]; colorIndex?: number; money?: boolean }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((it, i) => (
        <li key={it.label} className="min-w-0">
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{it.label}</span>
            <span className="shrink-0 font-semibold tabular">{money ? formatRupiah(it.value) : formatNumber(it.value)}{typeof it.percent === "number" && <span className="ml-1 text-xs font-normal text-muted-foreground">({it.percent}%)</span>}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full" style={{ width: `${(it.value / max) * 100}%`, background: PALETTE[(i + colorIndex) % PALETTE.length] }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------------- Traffic area chart ---------------- */
export function TrafficAreaChart({ data, height = 260 }: { data: { label: string; pageViews: number; visitors: number }[]; height?: number }) {
  return (
    <div className="w-full overflow-x-auto overflow-y-hidden scrollbar-thin">
      <div className="min-w-[520px] sm:min-w-0" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gPV" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0f9f6e" stopOpacity={0.4} /><stop offset="100%" stopColor="#0f9f6e" stopOpacity={0} /></linearGradient>
              <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f2b134" stopOpacity={0.4} /><stop offset="100%" stopColor="#f2b134" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={18} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={36} />
            <Tooltip content={<TooltipBox money={false} />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Area type="monotone" dataKey="pageViews" name="Page Views" stroke="#0f9f6e" strokeWidth={2} fill="url(#gPV)" />
            <Area type="monotone" dataKey="visitors" name="Pengunjung" stroke="#f2b134" strokeWidth={2} fill="url(#gV)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ---------------- Simple donut for device share ---------------- */
export function MiniDonut({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius="60%" outerRadius="95%" paddingAngle={2} stroke="none">
              {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Pie>
            <Tooltip content={<TooltipBox money={false} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-2">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className="min-w-0 flex-1 truncate">{d.label}</span>
            <span className="font-semibold tabular">{formatNumber(d.value)}</span>
            <span className="w-10 text-right text-xs text-muted-foreground tabular">{Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
