import { useMemo } from "react";
import { Wallet, TrendingUp, TrendingDown, ReceiptText, ArrowRight, Users, RefreshCw, CircleCheck, CircleAlert } from "lucide-react";
import { useData, computeSummary, computeCashFlow, computeByCategory } from "@/data/store";
import { useUI } from "@/store/ui";
import { useLoadState } from "@/hooks";
import { formatRupiah, formatTanggalLengkapID, relativeTime } from "@/lib/format";
import { StatCard, SectionTitle, CardSkeleton, ErrorState, RupiahText, EmptyState } from "@/components/shared";
import { CashFlowChart, ExpenseDonut } from "@/components/charts";
import { QUICK_ACTIONS } from "@/components/shell/overlays";
import { cn } from "@/lib/utils";
import type { Transaksi } from "@/data/types";

export default function DashboardView() {
  const transaksi = useData((s) => s.transaksi);
  const tagihan = useData((s) => s.tagihan);
  const warga = useData((s) => s.warga);
  const neonStatus = useData((s) => s.neonStatus);
  const neonError = useData((s) => s.neonError);
  const neonLastSync = useData((s) => s.neonLastSync);
  const syncRemoteData = useData((s) => s.syncRemoteData);
  const navigate = useUI((s) => s.navigate);
  const setQuickOpen = useUI((s) => s.setQuickOpen);
  const { loading, error, refetch } = useLoadState();

  const summary = useMemo(() => computeSummary(transaksi, tagihan), [transaksi, tagihan]);
  const cashFlow = useMemo(() => computeCashFlow(transaksi), [transaksi]);
  const byCat = useMemo(() => computeByCategory(transaksi, "pengeluaran"), [transaksi]);
  const recent = useMemo(() => [...transaksi].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).slice(0, 8), [transaksi]);
  const now = new Date();
  const greet = now.getHours() < 11 ? "Selamat pagi" : now.getHours() < 15 ? "Selamat siang" : now.getHours() < 18 ? "Selamat sore" : "Selamat malam";

  if (loading || neonStatus === "syncing") {
    return (
      <div className="space-y-4" aria-busy="true">
        <CardSkeleton className="h-28" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} className="h-28" />)}</div>
        <div className="grid gap-4 lg:grid-cols-3"><CardSkeleton className="h-80 lg:col-span-2" /><CardSkeleton className="h-80" /></div>
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Greeting */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-emerald-700 p-4 text-primary-foreground shadow-md sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-primary-foreground/80 sm:text-sm">{greet}, selamat datang kembali</p>
            <h2 className="text-fluid-h2 mt-0.5 font-extrabold">Admin RT 002 Mawar</h2>
            <p className="mt-1 text-xs text-primary-foreground/80 sm:text-sm">{formatTanggalLengkapID(now)} • {warga.length} KK terdaftar</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-white/15 px-2.5 text-xs font-semibold">
                {neonStatus === "connected" ? <CircleCheck className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}
                {neonStatus === "connected" ? "Tersinkron ke Neon" : "Mode lokal · Neon terputus"}
              </span>
              <button onClick={() => void syncRemoteData()} className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold hover:bg-white/15" aria-label="Sinkronkan data dari Neon">
                <RefreshCw className="h-3.5 w-3.5" />
                Sinkronkan
              </button>
              {neonStatus === "connected" && neonLastSync && <span className="text-[11px] text-primary-foreground/70">Terakhir: {new Date(neonLastSync).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>}
            </div>
            {neonStatus === "offline" && <p className="mt-1 text-xs text-primary-foreground/85">{neonError || "Jalankan API server dengan DATABASE_URL untuk menampilkan data Neon."}</p>}
          </div>
          <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 sm:flex"><Wallet className="h-7 w-7" /></div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:max-w-md">
          <div className="rounded-xl bg-white/15 px-3 py-2"><p className="text-primary-foreground/80">Saldo Kas</p><p className="text-sm font-bold tabular break-anywhere">{formatRupiah(summary.saldo)}</p></div>
          <div className="rounded-xl bg-white/15 px-3 py-2"><p className="text-primary-foreground/80">Tunggakan</p><p className="text-sm font-bold tabular break-anywhere">{formatRupiah(summary.nominalTunggakan)}</p></div>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <SectionTitle title="Aksi Cepat" action={<button onClick={() => setQuickOpen(true)} className="min-h-[36px] text-xs font-semibold text-primary lg:hidden">Lihat semua</button>} />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {QUICK_ACTIONS.map((a) => (
            <button key={a.label} onClick={() => navigate(a.view, { create: a.create })} className="card-hover flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-xl border bg-card p-2 text-center hover:border-primary/40">
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-full", a.tone)}><a.icon className="h-5 w-5" /></span>
              <span className="text-[11px] font-semibold leading-tight sm:text-xs">{a.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Financial cards — mobile 1 column, order: Saldo, Pemasukan, Pengeluaran, Tagihan Tertunda */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Saldo Kas RT" tone="default" value={<RupiahText value={summary.saldo} />} icon={<Wallet className="h-5 w-5" />} hint="Saldo kas saat ini" />
        <StatCard title="Total Pemasukan" tone="income" value={<RupiahText value={summary.totalPemasukan} />} icon={<TrendingUp className="h-5 w-5" />} hint="Kumulatif tahun berjalan" />
        <StatCard title="Total Pengeluaran" tone="expense" value={<RupiahText value={summary.totalPengeluaran} />} icon={<TrendingDown className="h-5 w-5" />} hint="Kumulatif tahun berjalan" />
        <StatCard
          title="Tagihan Tertunda"
          tone="warning"
          value={`${summary.tagihanBelumLunas} tagihan`}
          icon={<ReceiptText className="h-5 w-5" />}
          hint={`${summary.tagihanTelat} telat • ${formatRupiah(summary.nominalTunggakan)}`}
          action={<button onClick={() => navigate("tagihan")} className="inline-flex min-h-[36px] items-center gap-1 text-xs font-semibold text-primary">Lihat detail <ArrowRight className="h-3.5 w-3.5" /></button>}
        />
      </section>

      {/* Charts */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <SectionTitle title="Arus Kas Bulanan" action={<span className="text-xs text-muted-foreground">12 bulan terakhir</span>} />
          <div className="rounded-xl border bg-card p-3 shadow-sm sm:p-4">
            <CashFlowChart data={cashFlow} />
          </div>
        </div>
        <div className="min-w-0">
          <SectionTitle title="Pengeluaran per Kategori" />
          <div className="rounded-xl border bg-card p-3 shadow-sm sm:p-4">
            {byCat.length ? <ExpenseDonut data={byCat} total={summary.totalPengeluaran} /> : <EmptyState title="Belum ada pengeluaran" />}
          </div>
        </div>
      </section>

      {/* Recent transactions */}
      <section>
        <SectionTitle title="Transaksi Terbaru" action={<button onClick={() => navigate("pemasukan")} className="inline-flex min-h-[36px] items-center gap-1 text-xs font-semibold text-primary">Lihat semua <ArrowRight className="h-3.5 w-3.5" /></button>} />
        {recent.length === 0 ? (
          <EmptyState icon={<ReceiptText className="h-6 w-6" />} title="Belum ada transaksi" description="Mulai catat pemasukan atau pengeluaran kas RT." />
        ) : (
          <div className="grid gap-2">
            {recent.map((t) => <TransactionRow key={t.id} trx={t} onClick={() => navigate(t.jenis, { q: t.kode })} />)}
          </div>
        )}
      </section>

      {/* Community snapshot */}
      <section className="grid gap-3 sm:grid-cols-3">
        <MiniStat icon={<Users className="h-4 w-4" />} label="Kepala Keluarga" value={`${warga.length} KK`} onClick={() => navigate("warga")} />
        <MiniStat icon={<Users className="h-4 w-4" />} label="Jumlah Jiwa" value={`${warga.reduce((a, w) => a + 1 + w.anggotaKK.length, 0)} jiwa`} onClick={() => navigate("warga")} />
        <MiniStat icon={<ReceiptText className="h-4 w-4" />} label="Tagihan Lunas" value={`${tagihan.filter((t) => t.status === "lunas").length} / ${tagihan.length}`} onClick={() => navigate("tagihan")} />
      </section>
    </div>
  );
}

function MiniStat({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card-hover flex min-h-[56px] items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left hover:border-primary/40">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
      <span className="min-w-0 flex-1"><span className="block text-xs text-muted-foreground">{label}</span><span className="block text-sm font-bold">{value}</span></span>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

export function TransactionRow({ trx, onClick }: { trx: Transaksi; onClick?: () => void }) {
  const isPem = trx.jenis === "pemasukan";
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 overflow-hidden rounded-xl border bg-card p-3 text-left hover:border-primary/40">
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", isPem ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive")}>
        {isPem ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{trx.keterangan}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="truncate font-mono">{trx.kode}</span><span className="shrink-0">•</span><span className="shrink-0">{relativeTime(trx.tanggal)}</span></span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground sm:hidden">{trx.kategori}</span>
      </span>
      <span className="shrink-0 text-right">
        <span className={cn("block text-sm font-bold tabular", isPem ? "text-success" : "text-destructive")}>{isPem ? "+" : "−"}{formatRupiah(trx.nominal)}</span>
        <span className="hidden truncate text-[11px] text-muted-foreground sm:block">{trx.kategori}</span>
      </span>
    </button>
  );
}
