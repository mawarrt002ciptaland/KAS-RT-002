import { useMemo, useState } from "react";
import { Globe, Eye, Users, MousePointerClick, Smartphone, ExternalLink, FileText, TrendingUp } from "lucide-react";
import { useLoadState } from "@/hooks";
import { prng } from "@/lib/utils";
import { formatNumber, BULAN_SHORT } from "@/lib/format";
import { Tabs } from "@/components/ui";
import { PageHeader, StatCard, SectionTitle, ErrorState, ListSkeleton } from "@/components/shared";
import { TrafficAreaChart, MiniDonut, BarList } from "@/components/charts";
import type { TrafikRow } from "@/data/types";

const REFERRERS = ["WhatsApp", "Instagram", "Direct", "Google", "YouTube", "Facebook"];
const PAGES = ["/", "/pengumuman", "/tagihan", "/kegiatan", "/marketplace", "/pengaduan", "/kwitansi"];

/** Deterministic 30-day traffic generated relative to today */
function generateTrafik(days: number): TrafikRow[] {
  const out: TrafikRow[] = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(today.getTime() - d * 86400000);
    const seed = Math.floor(date.getTime() / 86400000);
    const rnd = prng(seed);
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const base = 40 + Math.floor(rnd() * 45) + (weekend ? 18 : 0);
    for (const device of ["mobile", "desktop", "tablet"] as const) {
      const factor = device === "mobile" ? 1 : device === "desktop" ? 0.32 : 0.12;
      const visitors = Math.max(1, Math.floor(base * factor));
      out.push({ tanggal: date.toISOString(), device, visitors, sessions: Math.floor(visitors * (0.75 + rnd() * 0.2)), pageViews: Math.floor(visitors * (1.6 + rnd() * 1.2)), referrer: REFERRERS[Math.floor(rnd() * REFERRERS.length)], page: PAGES[Math.floor(rnd() * PAGES.length)] });
    }
  }
  return out;
}

export default function TrafikView() {
  const { loading, error, refetch } = useLoadState();
  const [range, setRange] = useState<"7" | "14" | "30">("30");
  const rows = useMemo(() => generateTrafik(Number(range)), [range]);
  const prev = useMemo(() => generateTrafik(Number(range) * 2).slice(0, Number(range) * 3), [range]);

  const totals = useMemo(() => ({ pv: rows.reduce((a, r) => a + r.pageViews, 0), v: rows.reduce((a, r) => a + r.visitors, 0), s: rows.reduce((a, r) => a + r.sessions, 0) }), [rows]);
  const prevTotals = useMemo(() => ({ pv: prev.reduce((a, r) => a + r.pageViews, 0), v: prev.reduce((a, r) => a + r.visitors, 0) }), [prev]);
  const growth = (cur: number, before: number) => (before ? Math.round(((cur - before) / before) * 100) : 0);

  const daily = useMemo(() => {
    const m = new Map<string, { label: string; pageViews: number; visitors: number }>();
    rows.forEach((r) => { const d = new Date(r.tanggal); const k = r.tanggal.slice(0, 10); const e = m.get(k) ?? { label: `${d.getDate()} ${BULAN_SHORT[d.getMonth()]}`, pageViews: 0, visitors: 0 }; e.pageViews += r.pageViews; e.visitors += r.visitors; m.set(k, e); });
    return Array.from(m.values());
  }, [rows]);
  const devices = useMemo(() => (["mobile", "desktop", "tablet"] as const).map((d) => ({ label: d === "mobile" ? "Mobile" : d === "desktop" ? "Desktop" : "Tablet", value: rows.filter((r) => r.device === d).reduce((a, r) => a + r.visitors, 0) })), [rows]);
  const agg = (key: "referrer" | "page") => { const m = new Map<string, number>(); rows.forEach((r) => m.set(r[key], (m.get(r[key]) ?? 0) + r.pageViews)); const total = Array.from(m.values()).reduce((a, b) => a + b, 0) || 1; return Array.from(m.entries()).map(([label, value]) => ({ label, value, percent: Math.round((value / total) * 100) })).sort((a, b) => b.value - a.value); };
  const referrers = useMemo(() => agg("referrer"), [rows]); // eslint-disable-line react-hooks/exhaustive-deps
  const pages = useMemo(() => agg("page"), [rows]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-5">
      <PageHeader title="Trafik Website" description="Statistik pengunjung website RT 002" icon={<Globe className="h-5 w-5" />} actions={<Tabs value={range} onChange={setRange} size="sm" items={[{ value: "7", label: "7 hari" }, { value: "14", label: "14 hari" }, { value: "30", label: "30 hari" }]} />} />
      {loading ? <ListSkeleton /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard title="Page Views" value={formatNumber(totals.pv)} icon={<Eye className="h-5 w-5" />} hint={<span className={growth(totals.pv, prevTotals.pv) >= 0 ? "text-success" : "text-destructive"}><TrendingUp className="mr-0.5 inline h-3 w-3" />{growth(totals.pv, prevTotals.pv)}% vs periode lalu</span>} />
            <StatCard title="Pengunjung" tone="income" value={formatNumber(totals.v)} icon={<Users className="h-5 w-5" />} hint={<span className={growth(totals.v, prevTotals.v) >= 0 ? "text-success" : "text-destructive"}>{growth(totals.v, prevTotals.v)}% vs periode lalu</span>} />
            <StatCard title="Sesi" tone="info" value={formatNumber(totals.s)} icon={<MousePointerClick className="h-5 w-5" />} />
            <StatCard title="Mobile Share" tone="neutral" value={`${Math.round((devices[0].value / (totals.v || 1)) * 100)}%`} icon={<Smartphone className="h-5 w-5" />} hint="Pengunjung via ponsel" />
          </div>
          <section>
            <SectionTitle title="Kunjungan Harian" action={<span className="text-xs text-muted-foreground">{range} hari terakhir</span>} />
            <div className="rounded-xl border bg-card p-3 sm:p-4"><TrafficAreaChart data={daily} /></div>
          </section>
          <section className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border bg-card p-4"><SectionTitle title="Perangkat" /><MiniDonut data={devices} /></div>
            <div className="rounded-xl border bg-card p-4"><SectionTitle title="Sumber Trafik" /><BarList items={referrers} money={false} colorIndex={1} /></div>
            <div className="rounded-xl border bg-card p-4"><SectionTitle title="Halaman Populer" /><ul className="divide-y">{pages.map((p, i) => <li key={p.label} className="flex items-center gap-3 py-2.5 text-sm"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">{i + 1}</span><span className="min-w-0 flex-1 truncate font-mono text-xs sm:text-sm"><FileText className="mr-1 inline h-3.5 w-3.5 text-muted-foreground" />{p.label}</span><span className="font-semibold tabular">{formatNumber(p.value)}</span><span className="w-10 text-right text-xs text-muted-foreground">{p.percent}%</span></li>)}</ul></div>
          </section>
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground"><ExternalLink className="h-3.5 w-3.5" />Data trafik dikumpulkan dari website publik rt002mawar.id.</p>
        </>
      )}
    </div>
  );
}
