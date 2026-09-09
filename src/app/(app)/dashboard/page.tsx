"use client";
import { apiFetch } from "@/lib/api";

import { useCallback, useEffect, useState } from "react";
import {
  Wallet,
  Users,
  Clock,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Activity,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, Spinner, EmptyState } from "@/components/ui";
import { rupiah, NAMA_BULAN_PENDEK, NAMA_BULAN } from "@/lib/format";

type Dash = {
  saldo: number;
  totalMasuk: number;
  totalKeluar: number;
  masukBulanIni: number;
  jumlahWarga: number;
  tagihanPending: number;
  chart: { bulan: number; masuk: number; keluar: number }[];
  recent: {
    id: number;
    nama: string;
    noRumah: string;
    iuran: string;
    bulan: number;
    tahun: number;
    nominal: number;
    status: string;
  }[];
  pengeluaranKategori: { kategori: string; total: number }[];
};

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6"];

export default function DashboardPage() {
  const [data, setData] = useState<Dash | null>(null);
  const [tahun, setTahun] = useState(new Date().getFullYear());

  const load = useCallback(async (y: number) => {
    const res = await apiFetch(`/api/dashboard?tahun=${y}`);
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    load(tahun);
  }, [tahun, load]);

  if (!data) return <Spinner />;

  const stats = [
    {
      label: "Total Kas RT",
      value: rupiah(data.saldo),
      icon: Wallet,
      bg: "bg-indigo-500",
      shadow: "shadow-indigo-500/30",
    },
    {
      label: "Jumlah Warga",
      value: String(data.jumlahWarga),
      icon: Users,
      bg: "bg-emerald-500",
      shadow: "shadow-emerald-500/30",
    },
    {
      label: "Tagihan Pending",
      value: String(data.tagihanPending),
      icon: Clock,
      bg: "bg-orange-500",
      shadow: "shadow-orange-500/30",
    },
    {
      label: "Kas Masuk Bulan Ini",
      value: rupiah(data.masukBulanIni),
      icon: TrendingUp,
      bg: "bg-cyan-500",
      shadow: "shadow-cyan-500/30",
    },
  ];

  const chartData = data.chart.map((c) => ({
    name: NAMA_BULAN_PENDEK[c.bulan - 1],
    Pemasukan: c.masuk,
    Pengeluaran: c.keluar,
  }));

  return (
    <div className="fade-up">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">
          Ringkasan Sistem
        </h1>
        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">
          Statistik Vital Blok Mawar RT 002 RW 014 · Perumahan Ciptaland
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center justify-between p-5">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                {s.label}
              </p>
              <p className="mt-1.5 text-xl font-extrabold text-slate-800">
                {s.value}
              </p>
            </div>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${s.bg} text-white shadow-lg ${s.shadow}`}
            >
              <s.icon size={22} />
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="p-6 xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="text-indigo-500" size={20} />
              <h2 className="text-lg font-extrabold text-slate-800">
                Visualisasi Arus Kas
              </h2>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1">
              <button
                onClick={() => setTahun((t) => t - 1)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 text-sm font-extrabold text-slate-700">
                {tahun}
              </span>
              <button
                onClick={() => setTahun((t) => t + 1)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gMasuk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fontWeight: 700, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                  tickFormatter={(v: number) =>
                    v >= 1000000 ? `Rp${(v / 1000000).toFixed(1)}Jt` : `Rp${(v / 1000).toFixed(0)}rb`
                  }
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Tooltip
                  formatter={(value) => rupiah(Number(value))}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Pemasukan"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fill="url(#gMasuk)"
                />
                <Area
                  type="monotone"
                  dataKey="Pengeluaran"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-extrabold text-slate-800">
            Tagihan Terbaru
          </h2>
          {data.recent.length === 0 ? (
            <EmptyState text="Belum ada tagihan" />
          ) : (
            <div className="space-y-4">
              {data.recent.map((r) => (
                <div key={r.id} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-extrabold text-slate-500">
                    {r.nama.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-slate-700">
                      {r.nama}
                    </p>
                    <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {NAMA_BULAN[r.bulan - 1]} {r.tahun} · Rumah {r.noRumah} ·{" "}
                      {rupiah(r.nominal)}
                    </p>
                  </div>
                  {r.status === "lunas" ? (
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  ) : (
                    <AlertCircle size={18} className="text-rose-400" />
                  )}
                </div>
              ))}
            </div>
          )}

          {data.pengeluaranKategori.length > 0 && (
            <>
              <h3 className="mb-2 mt-6 text-sm font-extrabold text-slate-800">
                Komposisi Pengeluaran
              </h3>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.pengeluaranKategori}
                      dataKey="total"
                      nameKey="kategori"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {data.pengeluaranKategori.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => rupiah(Number(value))}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend kategori */}
              {(() => {
                const totalKeluar = data.pengeluaranKategori.reduce(
                  (a, b) => a + b.total,
                  0
                );
                return (
                  <div className="mt-3 space-y-2">
                    {data.pengeluaranKategori.map((k, i) => {
                      const pct =
                        totalKeluar > 0
                          ? Math.round((k.total / totalKeluar) * 100)
                          : 0;
                      return (
                        <div key={k.kategori} className="flex items-center gap-2.5">
                          <span
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{
                              backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                            }}
                          />
                          <span className="min-w-0 flex-1 truncate text-xs font-extrabold text-slate-600">
                            {k.kategori}
                          </span>
                          <span className="whitespace-nowrap text-xs font-bold text-slate-400">
                            {rupiah(k.total)}
                          </span>
                          <span className="w-10 whitespace-nowrap rounded-full bg-slate-100 px-1.5 py-0.5 text-center text-[10px] font-extrabold text-slate-500">
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                        Total
                      </span>
                      <span className="text-sm font-extrabold text-rose-500">
                        {rupiah(totalKeluar)}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
