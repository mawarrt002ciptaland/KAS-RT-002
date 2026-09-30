import { useMemo, useState, useEffect } from "react";
import { Globe, Eye, Users, MousePointerClick, Smartphone, ExternalLink, Activity } from "lucide-react";
import { formatNumber, BULAN_SHORT } from "@/lib/format";
import { Tabs } from "@/components/ui";
import { PageHeader, StatCard, SectionTitle, EmptyState, CardSkeleton } from "@/components/shared";
import { TrafficAreaChart, MiniDonut, BarList } from "@/components/charts";
import type { TrafikRow } from "@/data/types";

export default function TrafikView() {
  const [range, setRange] = useState<"7" | "14" | "30">("30");
  const [rows, setRows] = useState<TrafikRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrafik = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/data/trafik?days=${range}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || `HTTP ${response.status}`);
      }
      const data = await response.json();
      setRows(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data trafik.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTrafik(); }, [range]);

  const totals = useMemo(() => ({
    pv: rows.reduce((a, r) => a + (r.pageViews || 0), 0),
    v: rows.reduce((a, r) => a + (r.visitors || 0), 0),
    s: rows.reduce((a, r) => a + (r.sessions || 0), 0),
  }), [rows]);

  const daily = useMemo(() => {
    const m = new Map<string, { label: string; pageViews: number; visitors: number }>();
    rows.forEach((r) => {
      const d = new Date(r.tanggal);
      const k = r.tanggal.slice(0, 10);
      const e = m.get(k) ?? { label: `${d.getDate()} ${BULAN_SHORT[d.getMonth()]}`, pageViews: 0, visitors: 0 };
      e.pageViews += r.pageViews || 0;
      e.visitors += r.visitors || 0;
      m.set(k, e);
    });
    return Array.from(m.values());
  }, [rows]);

  const devices = useMemo(() =>
    (["mobile", "desktop", "tablet"] as const).map((d) => ({
      label: d === "mobile" ? "Mobile" : d === "desktop" ? "Desktop" : "Tablet",
      value: rows.filter((r) => r.device === d).reduce((a, r) => a + (r.visitors || 0), 0),
    })), [rows]);

  const agg = (key: "referrer" | "page") => {
    const m = new Map<string, number>();
    rows.forEach((r) => m.set(r[key] || "Unknown", (m.get(r[key] || "Unknown") ?? 0) + (r.pageViews || 0)));
    const total = Array.from(m.values()).reduce((a, b) => a + b, 0) || 1;
    return Array.from(m.entries()).map(([label, value]) => ({ label, value, percent: Math.round((value / total) * 100) })).sort((a, b) => b.value - a.value);
  };

  const referrers = useMemo(() => agg("referrer"), [rows]);
  const pages = useMemo(() => agg("page"), [rows]);
  const mobileShare = totals.v ? Math.round((devices[0].value / totals.v) * 100) : 0;

  return (
    <div className="space-y-5">
      <PageHeader title="Trafik Website" description="Statistik pengunjung website RT 002" icon={<Globe className="h-5 w-5" />} />
      <Tabs value={range} onChange={(v) => setRange(v as "7" | "14" | "30")} items={[{ value: "7", label: "7 hari" }, { value: "14", label: "14 hari" }, { value: "30", label: "30 hari" }]} />

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[...Array(4)].map((_, i) => <CardSkeleton key={i} className="h-24" />)}</div>
      ) : error ? (
        <EmptyState icon={<Activity className="h-6 w-6" />} title="Gagal memuat data" description={error} />
      ) : rows.length === 0 ? (
        <EmptyState icon={<Activity className="h-6 w-6" />} title="Belum ada data trafik" description="Data trafik akan otomatis terkumpul saat warga mengunjungi website ini." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard title="Page Views" tone="income" value={formatNumber(totals.pv)} icon={<Eye className="h-5 w-5" />} />
            <StatCard title="Pengunjung" tone="info" value={formatNumber(totals.v)} icon={<Users className="h-5 w-5" />} />
            <StatCard title="Sesi" tone="neutral" value={formatNumber(totals.s)} icon={<MousePointerClick className="h-5 w-5" />} />
            <StatCard title="Mobile Share" tone="expense" value={`${mobileShare}%`} icon={<Smartphone className="h-5 w-5" />} hint="Pengunjung via ponsel" />
          </div>

          <SectionTitle title="Kunjungan Harian" />
          <div className="rounded-xl border bg-card p-4">
            <TrafficAreaChart data={daily} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-4">
              <SectionTitle title="Perangkat" />
              <div className="flex items-center gap-4">
                <MiniDonut data={devices.map((d, i) => ({ name: d.label, value: d.value, color: ["#0f9f6e", "#3b82f6", "#f59e0b"][i] }))} />
                <ul className="flex-1 space-y-2">{devices.map((d, i) => (<li key={d.label} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: ["#0f9f6e", "#3b82f6", "#f59e0b"][i] }} />{d.label}</span><span className="font-bold tabular">{formatNumber(d.value)}</span></li>))}</ul>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <SectionTitle title="Sumber Trafik" />
              <BarList data={referrers.slice(0, 6)} />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <SectionTitle title="Halaman Populer" />
            <BarList data={pages.slice(0, 7)} />
          </div>

          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground"><ExternalLink className="h-3.5 w-3.5" />Data trafik dikumpulkan secara realtime dari kunjungan website RT 002.</p>
        </>
      )}
    </div>
  );
}
