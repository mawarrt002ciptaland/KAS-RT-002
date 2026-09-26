import type { NeonDashboardSnapshot, Transaksi } from "@/data/types";

function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

async function readView(url: string, view: string, params = ""): Promise<Record<string, unknown>[]> {
  const response = await fetch(`${url}/${view}?select=*${params}`, { cache: "no-store" });
  const payload = await response.json().catch(() => null) as Record<string, unknown>[] | { message?: string; details?: string } | null;
  if (!response.ok) {
    const error = payload && !Array.isArray(payload) ? payload.message || payload.details : null;
    throw new Error(typeof error === "string" ? error : `Neon Data API menolak view ${view} (HTTP ${response.status}).`);
  }
  if (!Array.isArray(payload)) throw new Error(`Neon Data API tidak mengembalikan daftar baris untuk ${view}.`);
  return payload;
}

/** Read-only browser access to the four least-privilege Neon dashboard views. */
export async function fetchNeonDashboard(dataApiUrl: string): Promise<NeonDashboardSnapshot> {
  const parsed = new URL(dataApiUrl.trim());
  if (parsed.protocol !== "https:" || !parsed.hostname.includes(".apirest.")) {
    throw new Error("Gunakan HTTPS API URL lengkap dari Neon Data API (host .apirest.).");
  }
  let path = parsed.pathname.replace(/\/+$/, "");
  if (!path.endsWith("/rest/v1")) path += "/rest/v1";
  const base = `${parsed.origin}${path}`;
  const [summaries, cashFlowRows, categoryRows, recentRows] = await Promise.all([
    readView(base, "rt_dashboard_summary", "&limit=1"),
    readView(base, "rt_dashboard_cash_flow", "&order=month_key.asc"),
    readView(base, "rt_dashboard_expense_categories", "&order=nominal.desc"),
    readView(base, "rt_dashboard_recent_transactions", "&order=tanggal.desc&limit=8"),
  ]);
  const summary = summaries[0];
  if (!summary) throw new Error("View rt_dashboard_summary belum dibuat atau belum mengembalikan data.");

  return {
    summary: {
      saldo: toNumber(summary.saldo),
      totalPemasukan: toNumber(summary.total_pemasukan),
      totalPengeluaran: toNumber(summary.total_pengeluaran),
      tagihanBelumLunas: toNumber(summary.tagihan_belum_lunas),
      tagihanTelat: toNumber(summary.tagihan_telat),
      nominalTunggakan: toNumber(summary.nominal_tunggakan),
      tagihanLunas: toNumber(summary.tagihan_lunas),
      totalWarga: toNumber(summary.total_warga),
      totalJiwa: toNumber(summary.total_jiwa),
    },
    cashFlow: cashFlowRows.map((row) => ({
      label: String(row.label ?? ""),
      pemasukan: toNumber(row.pemasukan),
      pengeluaran: toNumber(row.pengeluaran),
    })),
    expenseByCategory: categoryRows.map((row) => ({
      kategori: String(row.kategori ?? "Lain-lain"),
      nominal: toNumber(row.nominal),
      percent: toNumber(row.percent),
    })),
    recentTransaksi: recentRows.map((row) => ({
      id: String(row.id ?? row.kode ?? ""),
      kode: String(row.kode ?? ""),
      jenis: String(row.jenis).toLowerCase() === "pemasukan" ? "pemasukan" : "pengeluaran",
      tanggal: String(row.tanggal ?? ""),
      kategori: String(row.kategori ?? "Lain-lain"),
      keterangan: String(row.keterangan ?? "Transaksi kas RT"),
      nominal: toNumber(row.nominal),
      metode: String(row.metode ?? "Tunai"),
      status: String(row.status ?? "selesai").toLowerCase() === "pending" ? "pending" : "selesai",
      createdAt: String(row.created_at ?? row.tanggal ?? ""),
    } as Transaksi)),
  };
}