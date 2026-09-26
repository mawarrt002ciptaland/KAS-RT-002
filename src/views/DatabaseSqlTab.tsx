import { useMemo, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, Copy, Database, Download, ExternalLink, FileCode2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import seedSql from "../../sql/neon_transaksi_2026.sql?raw";
import dashboardSql from "../../sql/neon_dashboard_api.sql?raw";
import { useData } from "@/data/store";
import { getAdminApiBase, getNeonDataApiUrl, setAdminApiBase, setNeonDataApiUrl } from "@/lib/api";
import { formatRupiah, periodeLabel } from "@/lib/format";
import { copyText, downloadBlob, openExternal } from "@/lib/utils";
import { Badge, Button, Input } from "@/components/ui";
import { RupiahText, SectionTitle, StatCard } from "@/components/shared";

const ROW_RE = /^\s*\('TRX-(?:PEM|PENG)-(\d{4})(\d{2})-\d{3}',\s*'(pemasukan|pengeluaran)',\s*'[^']*',\s*'\d{4}-\d{2}-\d{2}',\s*(\d+),/gm;
const REKAP: Record<string, number> = {
  "2026-01": 12387800, "2026-02": 16895900, "2026-03": 18906300, "2026-04": 16238200,
  "2026-05": 11940265, "2026-06": 11143079, "2026-07": 11311483, "2026-08": 14586820,
};

export default function DatabaseSqlTab() {
  const [copied, setCopied] = useState(false);
  const [dataApiDraft, setDataApiDraft] = useState("");
  const [backendDraft, setBackendDraft] = useState("");
  const [dataApiSaved, setDataApiSaved] = useState(() => Boolean(getNeonDataApiUrl()));
  const [backendSaved, setBackendSaved] = useState(() => Boolean(getAdminApiBase()));
  const neonStatus = useData((s) => s.neonStatus);
  const neonError = useData((s) => s.neonError);
  const neonLastSync = useData((s) => s.neonLastSync);
  const syncRemoteData = useData((s) => s.syncRemoteData);

  const stats = useMemo(() => {
    const months = new Map<string, { count: number; income: number; expense: number }>();
    let income = 0;
    let expense = 0;
    let count = 0;
    for (const match of seedSql.matchAll(ROW_RE)) {
      const key = `${match[1]}-${match[2]}`;
      const type = match[3] as "pemasukan" | "pengeluaran";
      const amount = Number(match[4]);
      const row = months.get(key) ?? { count: 0, income: 0, expense: 0 };
      row.count++;
      row[type === "pemasukan" ? "income" : "expense"] += amount;
      months.set(key, row);
      if (type === "pemasukan") income += amount;
      else expense += amount;
      count++;
    }
    return { count, income, expense, months: Array.from(months.entries()).sort(([a], [b]) => a.localeCompare(b)) };
  }, []);
  const mismatches = stats.months.filter(([month, totals]) => REKAP[month] !== undefined && REKAP[month] !== totals.expense);

  async function copySql(sql: string, label: string) {
    if (await copyText(sql)) toast.success(`${label} disalin`);
    else toast.error("Gagal menyalin SQL. Gunakan tombol unduh.");
  }

  function saveDataApiUrl() {
    const url = dataApiDraft.trim().replace(/\/$/, "");
    if (!url.startsWith("https://") || !url.includes(".apirest.")) {
      toast.error("Masukkan API URL lengkap dari Neon Data API (host .apirest.).");
      return;
    }
    if (!setNeonDataApiUrl(url)) return toast.error("Browser tidak dapat menyimpan URL untuk sesi ini.");
    setDataApiSaved(true);
    setDataApiDraft("");
    toast.success("Neon Data API URL tersimpan di browser. Mencoba sinkronisasi...");
    void syncRemoteData();
  }

  function saveBackend() {
    if (backendDraft && !/^https?:\/\//i.test(backendDraft.trim())) return toast.error("Alamat API harus diawali https:// atau http://");
    if (!setAdminApiBase(backendDraft)) return toast.error("Browser tidak dapat menyimpan alamat API.");
    setBackendSaved(Boolean(backendDraft.trim()));
    setBackendDraft("");
    toast.success("Alamat API tersimpan untuk sesi tab ini.");
    void syncRemoteData();
  }

  const syncTitle = neonStatus === "connected"
    ? "API server tersambung ke Neon (baca/tulis)"
    : neonStatus === "readonly"
      ? "Dashboard tersambung langsung ke Neon (read-only)"
      : neonStatus === "syncing"
        ? "Sedang mengambil data dari Neon"
        : "Belum ada koneksi Neon aktif";
  const syncDescription = neonStatus === "connected" || neonStatus === "readonly"
    ? `Dashboard memakai data Neon${neonLastSync ? `; sinkron terakhir ${new Date(neonLastSync).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}.` : "."}`
    : neonError || "Masukkan Neon Data API URL di bagian atas, atau jalankan backend server.";

  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-card p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Database className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold">SQL Seed untuk Neon Console</h3>
            <p className="mt-1 text-sm text-muted-foreground">Skrip transaksi lama. Menjalankan skrip ini hanya mengisi database; tidak dengan sendirinya menghubungkan dashboard ke database.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} onClick={async () => { if (await copyText(seedSql)) { setCopied(true); toast.success("SQL transaksi disalin"); setTimeout(() => setCopied(false), 1800); } else toast.error("Gagal menyalin SQL."); }}>{copied ? "Tersalin" : "Salin SQL Transaksi"}</Button>
          <Button variant="outline" className="flex-1" leftIcon={<Download className="h-4 w-4" />} onClick={() => downloadBlob("neon_transaksi_2026.sql", seedSql, "application/sql;charset=utf-8")}>Unduh .sql</Button>
          <Button variant="outline" className="flex-1" leftIcon={<ExternalLink className="h-4 w-4" />} onClick={() => openExternal("https://console.neon.tech")}>Buka Neon Console</Button>
        </div>
      </section>

      <section className="rounded-xl border border-primary/30 bg-card p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Database className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold">Sambungkan dashboard langsung ke Neon</h3>
            <p className="mt-1 text-sm text-muted-foreground">Dashboard akan meminta ringkasan dan grafik dari Neon Data API, bukan menghitungnya dari transaksi di localStorage. Akses browser ini read-only dan dibatasi ke empat view statistik yang tidak mengembalikan NIK, telepon, alamat, atau data anggota keluarga.</p>
          </div>
        </div>
        <ol className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <li className="rounded-lg bg-muted/40 p-3"><b className="text-foreground">1.</b> Neon Console → project <code className="font-mono">super-mud-36780075</code> → branch <code className="font-mono">production</code> → <b>Postgres database → Data API</b>. Enable Data API untuk database <code className="font-mono">neondb</code>. Pendaftaran/login aplikasi memakai session server.</li>
          <li className="rounded-lg bg-muted/40 p-3"><b className="text-foreground">2.</b> Jangan pilih grant akses seluruh schema. Di SQL Editor jalankan <code className="font-mono">neon_dashboard_api.sql</code> di bawah, kemudian kembali ke Data API dan klik <b>Refresh schema cache</b>.</li>
          <li className="rounded-lg bg-muted/40 p-3"><b className="text-foreground">3.</b> Di Data API → Settings, batasi CORS ke origin website Anda. Salin nilai <b>API URL</b> dari tab API.</li>
          <li className="rounded-lg bg-muted/40 p-3"><b className="text-foreground">4.</b> Tempel API URL di bawah dan klik Simpan. Jika koneksi berhasil, dashboard menampilkan status <b className="text-foreground">Neon Data API · read-only</b> dan angka berasal dari view Neon.</li>
        </ol>
        <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <Input type="url" inputMode="url" autoComplete="url" value={dataApiDraft} onChange={(event) => setDataApiDraft(event.target.value)} placeholder={dataApiSaved ? "Neon Data API URL sudah tersimpan di browser" : "https://ep-...apirest.../neondb/rest/v1"} aria-label="Neon Data API URL" />
          <Button onClick={saveDataApiUrl} disabled={!dataApiDraft.trim()}>Simpan URL Neon</Button>
          {dataApiSaved && <Button variant="ghost" className="text-destructive" onClick={() => { setNeonDataApiUrl(""); setDataApiSaved(false); toast.info("URL Neon dihapus dari sesi tab."); }}>Hapus URL</Button>}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">API URL adalah endpoint publik, bukan connection string atau password; alamatnya tetap di browser setelah tab ditutup. Hapus URL bila ingin mengganti koneksi.</p>
        <details className="mt-4 rounded-xl border bg-muted/20 p-3">
          <summary className="min-h-10 cursor-pointer content-center text-sm font-semibold">SQL view dashboard read-only</summary>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button size="sm" variant="soft" onClick={() => void copySql(dashboardSql, "SQL view dashboard")}>Salin SQL Dashboard</Button>
            <Button size="sm" variant="outline" onClick={() => downloadBlob("neon_dashboard_api.sql", dashboardSql, "application/sql;charset=utf-8")}>Unduh SQL Dashboard</Button>
          </div>
          <pre className="mt-3 max-h-[50vh] overflow-auto rounded-lg bg-[#0b1512] p-3 font-mono text-[11px] leading-relaxed text-emerald-100 scrollbar-thin">{dashboardSql}</pre>
        </details>
      </section>

      <section className="rounded-xl border bg-card p-4">
        <div className="mb-4 rounded-lg bg-muted/40 p-3 text-sm">
          <p className="font-semibold">Project Neon yang diberikan</p>
          <p className="mt-1 text-xs text-muted-foreground">Project ID: <code className="font-mono">super-mud-36780075</code></p>
          <p className="text-xs text-muted-foreground">Branch: <code className="font-mono">production</code> (<code className="font-mono">br-aged-surf-b3co4w8c</code>)</p>
          <p className="mt-2 text-xs text-muted-foreground">ID project/branch bukan alamat API. Salin API URL dari menu Data API Neon.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${neonStatus === "connected" || neonStatus === "readonly" ? "bg-success/15 text-success" : neonStatus === "syncing" ? "bg-primary/10 text-primary" : "bg-warning/20 text-warning-foreground dark:text-warning"}`}>
            {neonStatus === "connected" || neonStatus === "readonly" ? <CheckCircle2 className="h-5 w-5" /> : neonStatus === "syncing" ? <RefreshCw className="h-5 w-5 animate-spin" /> : <AlertTriangle className="h-5 w-5" />}
          </span>
          <div className="min-w-0 flex-1"><p className="text-sm font-bold">{syncTitle}</p><p className="mt-0.5 break-words text-xs text-muted-foreground">{syncDescription}</p></div>
          <Button variant="outline" onClick={() => void syncRemoteData()} disabled={neonStatus === "syncing"} leftIcon={<RefreshCw className={`h-4 w-4 ${neonStatus === "syncing" ? "animate-spin" : ""}`} />}>Sinkronkan</Button>
        </div>
        <details className="mt-4 rounded-xl border p-3">
          <summary className="min-h-10 cursor-pointer content-center text-sm font-semibold">Alamat API backend (untuk login dan akses seluruh halaman)</summary>
          <p className="mt-1 text-xs text-muted-foreground">Backend menggunakan session cookie httpOnly. Jangan tempel DATABASE_URL, AUTH_SECRET, atau password database di browser.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <Input type="url" inputMode="url" autoComplete="url" value={backendDraft} onChange={(event) => setBackendDraft(event.target.value)} placeholder={backendSaved ? "Alamat API server tersimpan sampai tab ditutup" : "https://rt002-api.example.com"} aria-label="Alamat API server" />
            <Button variant="soft" onClick={saveBackend}>Simpan Alamat API</Button>
            {backendSaved && <Button variant="ghost" className="text-destructive" onClick={() => { setAdminApiBase(""); setBackendSaved(false); toast.info("Alamat API server dihapus dari sesi tab."); }}>Hapus</Button>}
          </div>
        </details>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard title="Baris pada SQL seed" value={`${stats.count} baris`} icon={<FileCode2 className="h-5 w-5" />} hint="Januari – Agustus 2026" />
        <StatCard title="Total Pengeluaran pada SQL seed" tone="expense" value={<RupiahText value={stats.expense} />} icon={<Database className="h-5 w-5" />} />
        <StatCard title="Total Pemasukan pada SQL seed" tone="income" value={<RupiahText value={stats.income} />} hint={stats.income ? "Termasuk pada seed" : "Data pemasukan belum diberikan"} />
      </section>

      {mismatches.length > 0 && <div role="alert" className="rounded-xl border border-warning/50 bg-warning/10 p-4 text-sm"><p className="font-semibold">Ada bulan dengan jumlah baris berbeda dari judul rekap</p><ul className="mt-1 text-muted-foreground">{mismatches.map(([month, values]) => <li key={month}>{periodeLabel(month)}: rekap {formatRupiah(REKAP[month])}, baris SQL {formatRupiah(values.expense)}</li>)}</ul></div>}

      <section className="rounded-xl border bg-card p-4">
        <SectionTitle title="Isi SQL seed transaksi" action={<Badge tone="muted">neon_transaksi_2026.sql • {(seedSql.length / 1024).toFixed(0)} KB</Badge>} />
        <div className="max-h-[55vh] w-full overflow-auto rounded-xl border bg-[#0b1512] p-3 scrollbar-thin" tabIndex={0} aria-label="Isi SQL seed transaksi"><pre className="min-w-max font-mono text-[11px] leading-relaxed text-emerald-100 sm:text-xs">{seedSql}</pre></div>
      </section>
    </div>
  );
}