import { useMemo, useState } from "react";
import { Database, Copy, Download, ExternalLink, Check, AlertTriangle, CheckCircle2, FileCode2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import sqlText from "../../sql/neon_transaksi_2026.sql?raw";
import { useData } from "@/data/store";
import { copyText, downloadBlob, openExternal } from "@/lib/utils";
import { formatRupiah, periodeLabel } from "@/lib/format";
import { Button, Badge, Input } from "@/components/ui";
import { SectionTitle, StatCard, RupiahText } from "@/components/shared";
import { getAdminApiKey, setAdminApiKey } from "@/lib/api";

/** Baris VALUES aktif (yang dikomentari "-- (" tidak ikut dihitung) */
const ROW_RE = /^\s*\('TRX-(?:PEM|PENG)-(\d{4})(\d{2})-\d{3}',\s*'(pemasukan|pengeluaran)',\s*'[^']*',\s*'\d{4}-\d{2}-\d{2}',\s*(\d+),/gm;
/** Total per bulan sesuai judul rekap kas — untuk pengecekan silang */
const REKAP: Record<string, number> = {
  "2026-01": 12387800, "2026-02": 16895900, "2026-03": 18906300, "2026-04": 16238200,
  "2026-05": 11940265, "2026-06": 11143079, "2026-07": 11311483, "2026-08": 14586820,
};
const FILE_NAME = "neon_transaksi_2026.sql";

export default function DatabaseSqlTab() {
  const [copied, setCopied] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");
  const [keySaved, setKeySaved] = useState(() => Boolean(getAdminApiKey()));
  const neonStatus = useData((s) => s.neonStatus);
  const neonError = useData((s) => s.neonError);
  const neonLastSync = useData((s) => s.neonLastSync);
  const syncRemoteData = useData((s) => s.syncRemoteData);
  const stats = useMemo(() => {
    const bulan = new Map<string, { n: number; pemasukan: number; pengeluaran: number }>();
    let pemasukan = 0, pengeluaran = 0, rows = 0;
    for (const m of sqlText.matchAll(ROW_RE)) {
      const key = `${m[1]}-${m[2]}`;
      const jenis = m[3] as "pemasukan" | "pengeluaran";
      const nominal = Number(m[4]);
      const e = bulan.get(key) ?? { n: 0, pemasukan: 0, pengeluaran: 0 };
      e.n++; e[jenis] += nominal; bulan.set(key, e);
      if (jenis === "pemasukan") pemasukan += nominal; else pengeluaran += nominal;
      rows++;
    }
    return { rows, pemasukan, pengeluaran, bulan: Array.from(bulan.entries()).sort(([a], [b]) => a.localeCompare(b)) };
  }, []);
  const mismatches = stats.bulan.filter(([k, v]) => REKAP[k] !== undefined && REKAP[k] !== v.pengeluaran);

  async function salin() {
    const ok = await copyText(sqlText);
    if (ok) { setCopied(true); toast.success("SQL disalin — tempel di Neon SQL Editor lalu klik Run"); setTimeout(() => setCopied(false), 2000); }
    else toast.error("Gagal menyalin. Gunakan tombol Unduh .sql");
  }
  function unduh() {
    downloadBlob(FILE_NAME, sqlText, "application/sql;charset=utf-8");
    toast.success(`${FILE_NAME} diunduh`);
  }
  function simpanKunci() {
    if (!keyDraft.trim()) return toast.error("Masukkan ADMIN_API_KEY dari server terlebih dahulu");
    if (!setAdminApiKey(keyDraft)) return toast.error("Browser tidak dapat menyimpan kunci sesi");
    setKeySaved(true);
    setKeyDraft("");
    toast.success("Kunci disimpan untuk sesi browser ini");
    void syncRemoteData();
  }
  function hapusKunci() {
    setAdminApiKey("");
    setKeySaved(false);
    toast.info("Kunci dihapus dari sesi browser");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Database className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold">SQL Seed untuk Neon Console</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">Skrip PostgreSQL mengisi tabel <code className="rounded bg-muted px-1 font-mono text-xs">"Transaksi"</code> di Neon. Menjalankan SQL saja belum menghubungkan dashboard: server aplikasi juga harus memiliki <code className="rounded bg-muted px-1 font-mono text-xs">DATABASE_URL</code> yang mengarah ke project dan branch yang sama.</p>
          </div>
        </div>
        <ol className="mt-4 grid gap-2 sm:grid-cols-3">
          {["Buka Neon Console → pilih Project & Branch → menu SQL Editor", "Salin seluruh SQL di bawah, lalu tempel ke editor", "Klik Run, kemudian jalankan query verifikasi (bagian D) satu per satu"].map((s, i) => (
            <li key={i} className="flex gap-2 rounded-lg bg-muted/40 p-3 text-sm"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span><span>{s}</span></li>
          ))}
        </ol>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} onClick={salin}>{copied ? "Tersalin" : "Salin SQL"}</Button>
          <Button variant="outline" className="flex-1" leftIcon={<Download className="h-4 w-4" />} onClick={unduh}>Unduh .sql</Button>
          <Button variant="outline" className="flex-1" leftIcon={<ExternalLink className="h-4 w-4" />} onClick={() => openExternal("https://console.neon.tech")}>Buka Neon Console</Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${neonStatus === "connected" ? "bg-success/15 text-success" : neonStatus === "syncing" ? "bg-primary/10 text-primary" : "bg-warning/20 text-warning-foreground dark:text-warning"}`}>
            {neonStatus === "connected" ? <CheckCircle2 className="h-5 w-5" /> : neonStatus === "syncing" ? <RefreshCw className="h-5 w-5 animate-spin" /> : <AlertTriangle className="h-5 w-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{neonStatus === "connected" ? "Aplikasi tersambung ke Neon" : neonStatus === "syncing" ? "Sedang mengambil data dari Neon…" : "Aplikasi belum tersambung ke Neon"}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{neonStatus === "connected" ? `Transaksi, tagihan, dan warga sudah dimuat${neonLastSync ? ` • ${new Date(neonLastSync).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : ""}.` : neonError || "Atur DATABASE_URL di environment backend server, lalu jalankan `node --env-file=.env server/index.mjs`. Jangan masukkan password Neon ke VITE_API_BASE_URL."}</p>
          </div>
          <Button variant="outline" onClick={() => void syncRemoteData()} disabled={neonStatus === "syncing"} leftIcon={<RefreshCw className={`h-4 w-4 ${neonStatus === "syncing" ? "animate-spin" : ""}`} />}>Sinkronkan</Button>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <Input type="password" autoComplete="off" value={keyDraft} onChange={(event) => setKeyDraft(event.target.value)} placeholder={keySaved ? "Kunci admin tersimpan sampai tab ditutup" : "Masukkan ADMIN_API_KEY dari server"} aria-label="Kunci admin API Neon" />
          <Button variant="soft" onClick={simpanKunci} disabled={!keyDraft.trim()}>Simpan Kunci Sesi</Button>
          {keySaved && <Button variant="ghost" className="text-destructive" onClick={hapusKunci}>Hapus Kunci</Button>}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Kunci admin dikirim sebagai header API dan hanya disimpan di sessionStorage sampai tab browser ditutup. Jangan gunakan connection string Neon di sini.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard title="Baris Transaksi" value={`${stats.rows} baris`} icon={<FileCode2 className="h-5 w-5" />} hint="Januari – Agustus 2026" />
        <StatCard title="Total Pengeluaran" tone="expense" value={<RupiahText value={stats.pengeluaran} />} icon={<Database className="h-5 w-5" />} hint="Penjumlahan seluruh baris" />
        <StatCard title="Total Pemasukan" tone="income" value={<RupiahText value={stats.pemasukan} />} hint={stats.pemasukan ? "Termasuk dalam skrip" : "Belum ada — tambahkan baris TRX-PEM (bagian C)"} />
      </div>

      {mismatches.length > 0 && (
        <div role="alert" className="flex gap-3 rounded-xl border border-warning/50 bg-warning/10 p-4 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning-foreground dark:text-warning" />
          <div className="min-w-0">
            <p className="font-semibold">Perlu dicek: judul rekap tidak sama dengan penjumlahan baris</p>
            <ul className="mt-1 space-y-0.5 text-muted-foreground">
              {mismatches.map(([k, v]) => <li key={k} className="break-anywhere">{periodeLabel(k)}: judul rekap {formatRupiah(REKAP[k])} • jumlah baris {formatRupiah(v.pengeluaran)} • selisih {formatRupiah(v.pengeluaran - REKAP[k])}</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card p-4">
        <SectionTitle title="Rekap per Bulan" />
        <ul className="divide-y">
          {stats.bulan.map(([k, v]) => {
            const ok = REKAP[k] === undefined || REKAP[k] === v.pengeluaran;
            return (
              <li key={k} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="min-w-0 flex-1"><span className="block font-semibold">{periodeLabel(k)}</span><span className="block text-xs text-muted-foreground">{v.n} baris{v.pemasukan ? ` • pemasukan ${formatRupiah(v.pemasukan)}` : ""}</span></span>
                <span className="shrink-0 font-bold tabular text-destructive">{formatRupiah(v.pengeluaran)}</span>
                {ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-label="Cocok dengan rekap" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-warning-foreground dark:text-warning" aria-label="Berbeda dari rekap" />}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <SectionTitle title="Isi Skrip SQL" action={<Badge tone="muted">{FILE_NAME} • {(sqlText.length / 1024).toFixed(0)} KB</Badge>} />
        <div className="max-h-[60vh] w-full overflow-auto rounded-xl border bg-[#0b1512] p-3 scrollbar-thin" tabIndex={0} aria-label="Isi skrip SQL">
          <pre className="min-w-max font-mono text-[11px] leading-relaxed text-emerald-100 sm:text-xs">{sqlText}</pre>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Kotak di atas dapat digeser ke samping; halaman tidak ikut melebar.</p>
      </div>
    </div>
  );
}
