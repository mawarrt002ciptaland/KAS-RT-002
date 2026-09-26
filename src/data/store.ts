import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { buildSeed } from "./seed";
import type {
  DataBundle, Warga, AnggotaKK, Transaksi, Tagihan, Kegiatan, Pengumuman, Pengaduan,
  Kwitansi, Pengurus, Tautan, Marketplace, User, Jenis,
} from "./types";
import { uid } from "@/lib/utils";
import { JENIS_TAGIHAN, JENIS_TAGIHAN_LABEL } from "@/lib/constants";
import { periodeLabel } from "@/lib/format";
import { apiRequest, getNeonDataApiUrl } from "@/lib/api";
import { fetchNeonDashboard } from "@/lib/neon-dashboard";
import type { NeonDashboardSnapshot } from "./types";

const DATA_VERSION = 5;
let syncInFlight = false;

function nextKode(list: { kode: string }[], prefix: string, pad: number): string {
  const nums = list
    .filter((x) => x.kode.startsWith(prefix))
    .map((x) => parseInt(x.kode.slice(prefix.length), 10))
    .filter((n) => !isNaN(n));
  const n = (nums.length ? Math.max(...nums) : 0) + 1;
  return prefix + String(n).padStart(pad, "0");
}

const nowIso = () => new Date().toISOString();

type TransaksiInput = Omit<Transaksi, "id" | "kode" | "createdAt" | "status"> & { status?: Transaksi["status"] };
type TagihanInput = Omit<Tagihan, "id" | "kode" | "createdAt" | "status" | "denda"> & { status?: Tagihan["status"]; denda?: number };
type WargaInput = Omit<Warga, "id" | "createdAt" | "anggotaKK" | "tanggalBergabung"> & { anggotaKK?: AnggotaKK[]; tanggalBergabung?: string };

export interface DataActions {
  // transaksi
  addTransaksi: (input: TransaksiInput) => Promise<Transaksi>;
  updateTransaksi: (id: string, patch: Partial<Transaksi>) => void;
  deleteTransaksi: (id: string) => Promise<void>;
  // tagihan
  addTagihan: (input: TagihanInput) => Tagihan;
  addTagihanBulk: (inputs: TagihanInput[]) => number;
  updateTagihan: (id: string, patch: Partial<Tagihan>) => void;
  bayarTagihan: (id: string, metode: string) => Promise<{ transaksi: Transaksi; kwitansi: Kwitansi } | null>;
  deleteTagihan: (id: string) => void;
  // warga
  addWarga: (input: WargaInput) => Warga;
  updateWarga: (id: string, patch: Partial<Warga>) => void;
  deleteWarga: (id: string) => void;
  addAnggota: (wargaId: string, a: Omit<AnggotaKK, "id">) => void;
  deleteAnggota: (wargaId: string, anggotaId: string) => void;
  // kegiatan
  addKegiatan: (input: Omit<Kegiatan, "id" | "createdAt">) => Kegiatan;
  updateKegiatan: (id: string, patch: Partial<Kegiatan>) => void;
  deleteKegiatan: (id: string) => void;
  // pengumuman
  addPengumuman: (input: Omit<Pengumuman, "id" | "createdAt">) => Pengumuman;
  updatePengumuman: (id: string, patch: Partial<Pengumuman>) => void;
  deletePengumuman: (id: string) => void;
  // pengaduan
  addPengaduan: (input: Omit<Pengaduan, "id" | "kode" | "createdAt" | "updatedAt" | "status">) => Pengaduan;
  updatePengaduan: (id: string, patch: Partial<Pengaduan>) => void;
  deletePengaduan: (id: string) => void;
  // kwitansi
  addKwitansi: (input: Omit<Kwitansi, "id" | "kode" | "createdAt">) => Kwitansi;
  deleteKwitansi: (id: string) => void;
  // pengurus
  addPengurus: (input: Omit<Pengurus, "id">) => Pengurus;
  updatePengurus: (id: string, patch: Partial<Pengurus>) => void;
  deletePengurus: (id: string) => void;
  // tautan
  addTautan: (input: Omit<Tautan, "id" | "urutan">) => Tautan;
  deleteTautan: (id: string) => void;
  // marketplace
  addMarketplace: (input: Omit<Marketplace, "id" | "createdAt" | "status">) => Marketplace;
  updateMarketplace: (id: string, patch: Partial<Marketplace>) => void;
  deleteMarketplace: (id: string) => void;
  // users
  addUser: (input: Omit<User, "id" | "createdAt" | "status">) => User;
  updateUser: (id: string, patch: Partial<User>) => void;
  deleteUser: (id: string) => void;
  // pengaturan
  setPengaturan: (patch: Record<string, string>) => void;
  // misc
  syncRemoteData: () => Promise<boolean>;
  resetData: () => void;
}

export type NeonSyncStatus = "syncing" | "connected" | "readonly" | "offline";
export type DataState = DataBundle & DataActions & {
  neonStatus: NeonSyncStatus;
  neonError: string | null;
  neonLastSync: string | null;
  neonDashboard: NeonDashboardSnapshot | null;
};

interface NeonSyncPayload {
  ok: boolean;
  items: DataBundle;
  counts: { transaksi: number; tagihan: number; warga: number; kegiatan: number; pengumuman: number; pengaduan: number };
}

const safeStorage = {
  getItem: (k: string) => {
    try { return localStorage.getItem(k); } catch { return null; }
  },
  setItem: (k: string, v: string) => {
    try { localStorage.setItem(k, v); } catch { /* quota exceeded — keep in memory */ }
  },
  removeItem: (k: string) => {
    try { localStorage.removeItem(k); } catch { /* ignore */ }
  },
};

export const useData = create<DataState>()(
  persist(
    (set, get) => {
      const persistEntity = (entity: string, id: string, body: unknown, method: "POST" | "PATCH" | "DELETE" = "POST") => {
        if (get().neonStatus !== "connected") return;
        const path = method === "POST"
          ? `/api/data/${entity}`
          : `/api/data/${entity}/${encodeURIComponent(id)}`;
        void apiRequest<{ ok: boolean }>(path, {
          method,
          ...(method === "DELETE" ? {} : { body: JSON.stringify(body) }),
        }).catch((error: unknown) => {
          set({
            neonStatus: "offline",
            neonError: error instanceof Error ? `Perubahan belum tersimpan di Neon: ${error.message}` : "Perubahan belum tersimpan di Neon.",
            neonDashboard: null,
          });
        });
      };
      const markSettingsWriteFailure = (error: unknown) => set({
        neonStatus: "offline",
        neonError: error instanceof Error ? `Perubahan belum tersimpan di Neon: ${error.message}` : "Perubahan belum tersimpan di Neon.",
        neonDashboard: null,
      });

      return {
      ...buildSeed(),
      neonStatus: "syncing",
      neonError: null,
      neonLastSync: null,
      neonDashboard: null,

      // ---------- TRANSAKSI ----------
      addTransaksi: async (input) => {
        if (get().neonStatus !== "connected") {
          throw new Error("Koneksi database bersifat read-only atau offline. Transaksi baru perlu API server aktif agar tersimpan ke Neon.");
        }
        const d = new Date(input.tanggal);
        const yyyymm = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
        const prefix = `TRX-${input.jenis === "pemasukan" ? "PEM" : "PENG"}-${yyyymm}-`;
        const t: Transaksi = {
          ...input,
          id: uid("t-"),
          kode: nextKode(get().transaksi, prefix, 3),
          status: input.status ?? "selesai",
          createdAt: nowIso(),
        };
        let saved = t;
        if (get().neonStatus === "connected") {
          const response = await apiRequest<{ item: Transaksi }>("/api/transaksi", {
            method: "POST",
            body: JSON.stringify(t),
          });
          saved = response.item;
        }
        set((s) => ({ transaksi: [saved, ...s.transaksi.filter((row) => row.id !== saved.id && row.kode !== saved.kode)] }));
        return saved;
      },
      updateTransaksi: (id, patch) => set((s) => ({ transaksi: s.transaksi.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      deleteTransaksi: async (id) => {
        if (get().neonStatus !== "connected") {
          throw new Error("Koneksi database bersifat read-only atau offline. Penghapusan perlu API server aktif.");
        }
        await apiRequest<{ ok: boolean }>(`/api/transaksi/${encodeURIComponent(id)}`, { method: "DELETE" });
        set((s) => ({
          transaksi: s.transaksi.filter((t) => t.id !== id),
          kwitansi: s.kwitansi.filter((k) => k.transaksiId !== id),
        }));
      },

      // ---------- TAGIHAN ----------
      addTagihan: (input) => {
        const prefix = `TAG-${input.periode.replace("-", "")}-`;
        const t: Tagihan = { ...input, id: uid("tag-"), kode: nextKode(get().tagihan, prefix, 4), status: input.status ?? "belum_bayar", denda: input.denda ?? 0, createdAt: nowIso() };
        set((s) => ({ tagihan: [t, ...s.tagihan] }));
        persistEntity("tagihan", t.id, t);
        return t;
      },
      addTagihanBulk: (inputs) => {
        let list = get().tagihan;
        const created: Tagihan[] = [];
        for (const input of inputs) {
          const exists = list.some((x) => x.wargaId === input.wargaId && x.periode === input.periode && x.jenis === input.jenis);
          if (exists) continue;
          const prefix = `TAG-${input.periode.replace("-", "")}-`;
          const t: Tagihan = { ...input, id: uid("tag-"), kode: nextKode(list, prefix, 4), status: input.status ?? "belum_bayar", denda: input.denda ?? 0, createdAt: nowIso() };
          list = [t, ...list];
          created.push(t);
          persistEntity("tagihan", t.id, t);
        }
        set({ tagihan: list });
        return created.length;
      },
      updateTagihan: (id, patch) => { set((s) => ({ tagihan: s.tagihan.map((t) => (t.id === id ? { ...t, ...patch } : t)) })); persistEntity("tagihan", id, patch, "PATCH"); },
      bayarTagihan: async (id, metode) => {
        const s = get();
        const tg = s.tagihan.find((t) => t.id === id);
        if (!tg || tg.status === "lunas") return null;
        const w = s.warga.find((x) => x.id === tg.wargaId);
        const jenis = JENIS_TAGIHAN.find((j) => j.value === tg.jenis);
        const total = tg.jumlah + (tg.denda || 0);
        const transaksi = await s.addTransaksi({
          jenis: "pemasukan",
          tanggal: nowIso(),
          kategori: jenis?.kategori ?? "Lain-lain",
          keterangan: `${JENIS_TAGIHAN_LABEL[tg.jenis] ?? tg.jenis} ${periodeLabel(tg.periode)} — ${w?.nama ?? "Warga"} (${w?.noRumah ?? "-"})`,
          nominal: total,
          sumber: w?.nama ?? "Warga RT 002",
          metode,
          wargaId: tg.wargaId,
        });
        const kwitansi = s.addKwitansi({
          transaksiId: transaksi.id,
          tagihanId: tg.id,
          wargaId: tg.wargaId,
          tanggal: nowIso(),
          nominal: total,
          penerima: s.pengaturan.nama_bendahara || "Bendahara RT 002",
          pembayar: w?.nama ?? "Warga RT 002",
          keterangan: transaksi.keterangan,
        });
        const paidPatch = { status: "lunas" as const, tanggalBayar: nowIso(), metode };
        set((st) => ({ tagihan: st.tagihan.map((t) => (t.id === id ? { ...t, ...paidPatch } : t)) }));
        persistEntity("tagihan", id, paidPatch, "PATCH");
        return { transaksi, kwitansi };
      },
      deleteTagihan: (id) => { set((s) => ({ tagihan: s.tagihan.filter((t) => t.id !== id) })); persistEntity("tagihan", id, undefined, "DELETE"); },

      // ---------- WARGA ----------
      addWarga: (input) => {
        const w: Warga = { ...input, id: uid("w-"), anggotaKK: input.anggotaKK ?? [], tanggalBergabung: input.tanggalBergabung ?? nowIso(), createdAt: nowIso() };
        set((s) => ({ warga: [...s.warga, w] }));
        persistEntity("warga", w.id, w);
        return w;
      },
      updateWarga: (id, patch) => { set((s) => ({ warga: s.warga.map((w) => (w.id === id ? { ...w, ...patch } : w)) })); persistEntity("warga", id, patch, "PATCH"); },
      deleteWarga: (id) => { set((s) => ({ warga: s.warga.filter((w) => w.id !== id) })); persistEntity("warga", id, undefined, "DELETE"); },
      addAnggota: (wargaId, a) => {
        const member = { ...a, id: uid("a-"), wargaId };
        set((s) => ({ warga: s.warga.map((w) => (w.id === wargaId ? { ...w, anggotaKK: [...w.anggotaKK, member] } : w)) }));
        persistEntity("anggota", member.id, member);
      },
      deleteAnggota: (wargaId, anggotaId) => {
        set((s) => ({ warga: s.warga.map((w) => (w.id === wargaId ? { ...w, anggotaKK: w.anggotaKK.filter((x) => x.id !== anggotaId) } : w)) }));
        persistEntity("anggota", anggotaId, undefined, "DELETE");
      },

      // ---------- KEGIATAN ----------
      addKegiatan: (input) => {
        const k: Kegiatan = { ...input, id: uid("keg-"), createdAt: nowIso() };
        set((s) => ({ kegiatan: [k, ...s.kegiatan] }));
        persistEntity("kegiatan", k.id, k);
        return k;
      },
      updateKegiatan: (id, patch) => { set((s) => ({ kegiatan: s.kegiatan.map((k) => (k.id === id ? { ...k, ...patch } : k)) })); persistEntity("kegiatan", id, patch, "PATCH"); },
      deleteKegiatan: (id) => { set((s) => ({ kegiatan: s.kegiatan.filter((k) => k.id !== id) })); persistEntity("kegiatan", id, undefined, "DELETE"); },

      // ---------- PENGUMUMAN ----------
      addPengumuman: (input) => {
        const p: Pengumuman = { ...input, id: uid("png-"), createdAt: nowIso() };
        set((s) => ({ pengumuman: [p, ...s.pengumuman] }));
        persistEntity("pengumuman", p.id, p);
        return p;
      },
      updatePengumuman: (id, patch) => { set((s) => ({ pengumuman: s.pengumuman.map((p) => (p.id === id ? { ...p, ...patch } : p)) })); persistEntity("pengumuman", id, patch, "PATCH"); },
      deletePengumuman: (id) => { set((s) => ({ pengumuman: s.pengumuman.filter((p) => p.id !== id) })); persistEntity("pengumuman", id, undefined, "DELETE"); },

      // ---------- PENGADUAN ----------
      addPengaduan: (input) => {
        const year = new Date().getFullYear();
        const p: Pengaduan = { ...input, id: uid("adu-"), kode: nextKode(get().pengaduan, `ADU-${year}-`, 6), status: "baru", createdAt: nowIso(), updatedAt: nowIso() };
        set((s) => ({ pengaduan: [p, ...s.pengaduan] }));
        persistEntity("pengaduan", p.id, p);
        return p;
      },
      updatePengaduan: (id, patch) => { const updated = { ...patch, updatedAt: nowIso() }; set((s) => ({ pengaduan: s.pengaduan.map((p) => (p.id === id ? { ...p, ...updated } : p)) })); persistEntity("pengaduan", id, updated, "PATCH"); },
      deletePengaduan: (id) => { set((s) => ({ pengaduan: s.pengaduan.filter((p) => p.id !== id) })); persistEntity("pengaduan", id, undefined, "DELETE"); },

      // ---------- KWITANSI ----------
      addKwitansi: (input) => {
        const year = new Date(input.tanggal).getFullYear();
        const k: Kwitansi = { ...input, id: uid("kw-"), kode: nextKode(get().kwitansi, `KWI-${year}-`, 4), createdAt: nowIso() };
        set((s) => ({ kwitansi: [k, ...s.kwitansi] }));
        persistEntity("kwitansi", k.id, k);
        return k;
      },
      deleteKwitansi: (id) => { set((s) => ({ kwitansi: s.kwitansi.filter((k) => k.id !== id) })); persistEntity("kwitansi", id, undefined, "DELETE"); },

      // ---------- PENGURUS ----------
      addPengurus: (input) => {
        const p: Pengurus = { ...input, id: uid("pg-") };
        set((s) => ({ pengurus: [...s.pengurus, p] }));
        persistEntity("pengurus", p.id, p);
        return p;
      },
      updatePengurus: (id, patch) => { set((s) => ({ pengurus: s.pengurus.map((p) => (p.id === id ? { ...p, ...patch } : p)) })); persistEntity("pengurus", id, patch, "PATCH"); },
      deletePengurus: (id) => { set((s) => ({ pengurus: s.pengurus.filter((p) => p.id !== id) })); persistEntity("pengurus", id, undefined, "DELETE"); },

      // ---------- TAUTAN ----------
      addTautan: (input) => {
        const t: Tautan = { ...input, id: uid("lnk-"), urutan: get().tautan.length + 1 };
        set((s) => ({ tautan: [...s.tautan, t] }));
        persistEntity("tautan", t.id, t);
        return t;
      },
      deleteTautan: (id) => { set((s) => ({ tautan: s.tautan.filter((t) => t.id !== id) })); persistEntity("tautan", id, undefined, "DELETE"); },

      // ---------- MARKETPLACE ----------
      addMarketplace: (input) => {
        const m: Marketplace = { ...input, id: uid("mk-"), status: "tersedia", createdAt: nowIso() };
        set((s) => ({ marketplace: [m, ...s.marketplace] }));
        persistEntity("marketplace", m.id, m);
        return m;
      },
      updateMarketplace: (id, patch) => { set((s) => ({ marketplace: s.marketplace.map((m) => (m.id === id ? { ...m, ...patch } : m)) })); persistEntity("marketplace", id, patch, "PATCH"); },
      deleteMarketplace: (id) => { set((s) => ({ marketplace: s.marketplace.filter((m) => m.id !== id) })); persistEntity("marketplace", id, undefined, "DELETE"); },

      // ---------- USERS ----------
      addUser: (input) => {
        const u: User = { ...input, id: uid("u-"), status: "aktif", createdAt: nowIso() };
        set((s) => ({ users: [...s.users, u] }));
        return u;
      },
      updateUser: (id, patch) => set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),
      deleteUser: (id) => set((s) => ({ users: s.users.filter((u) => u.id !== id) })),

      // ---------- PENGATURAN ----------
      setPengaturan: (patch) => {
        set((s) => ({ pengaturan: { ...s.pengaturan, ...patch } }));
        if (get().neonStatus === "connected") void apiRequest<{ ok: boolean }>("/api/pengaturan", { method: "PATCH", body: JSON.stringify(patch) }).catch(markSettingsWriteFailure);
      },

      syncRemoteData: async () => {
        if (syncInFlight) return false;
        syncInFlight = true;
        set({ neonStatus: "syncing", neonError: null, neonDashboard: null });
        const dataApiUrl = getNeonDataApiUrl();
        try {
          const response = await apiRequest<NeonSyncPayload>("/api/sync");
          if (!response?.ok || !response.items) throw new Error("Format data dari server tidak valid.");
          set((state) => ({
            transaksi: response.items.transaksi ?? state.transaksi,
            tagihan: response.items.tagihan ?? state.tagihan,
            warga: response.items.warga ?? state.warga,
            kegiatan: response.items.kegiatan ?? state.kegiatan,
            pengumuman: response.items.pengumuman ?? state.pengumuman,
            pengaduan: response.items.pengaduan ?? state.pengaduan,
            kwitansi: response.items.kwitansi ?? state.kwitansi,
            pengurus: response.items.pengurus ?? state.pengurus,
            tautan: response.items.tautan ?? state.tautan,
            marketplace: response.items.marketplace ?? state.marketplace,
            users: response.items.users ?? state.users,
            pengaturan: response.items.pengaturan ?? state.pengaturan,
            neonStatus: "connected",
            neonError: null,
            neonLastSync: new Date().toISOString(),
            neonDashboard: null,
          }));
          return true;
        } catch (backendError) {
          if (dataApiUrl) {
            try {
              const dashboard = await fetchNeonDashboard(dataApiUrl);
              set({ neonStatus: "readonly", neonDashboard: dashboard, neonError: null, neonLastSync: new Date().toISOString() });
              return true;
            } catch (dataApiError) {
              set({ neonStatus: "offline", neonError: dataApiError instanceof Error ? dataApiError.message : "Neon Data API belum dapat dibaca.", neonDashboard: null });
              return false;
            }
          }
          set({ neonStatus: "offline", neonError: backendError instanceof Error ? backendError.message : "Neon Data API / server belum terhubung.", neonDashboard: null });
          return false;
        } finally {
          syncInFlight = false;
        }
      },

      resetData: () => set({ ...buildSeed() }),
      };
    },
    {
      name: "rt002-data",
      version: DATA_VERSION,
      storage: createJSONStorage(() => safeStorage),
      migrate: () => ({ ...buildSeed() }) as unknown as DataState,
      partialize: (s) => ({
        // Neon is authoritative for financial/resident data; don't hydrate stale browser copies over it.
        kegiatan: s.kegiatan, pengumuman: s.pengumuman,
        pengaduan: s.pengaduan, kwitansi: s.kwitansi, pengurus: s.pengurus, tautan: s.tautan, marketplace: s.marketplace,
        users: s.users, pengaturan: s.pengaturan,
      }) as DataState,
    },
  ),
);

// ================= SELECTOR HELPERS =================
export function sumBy<T>(arr: T[], f: (x: T) => number): number {
  return arr.reduce((a, x) => a + f(x), 0);
}

export function computeSummary(transaksi: Transaksi[], tagihan: Tagihan[]) {
  const totalPemasukan = sumBy(transaksi.filter((t) => t.jenis === "pemasukan"), (t) => t.nominal);
  const totalPengeluaran = sumBy(transaksi.filter((t) => t.jenis === "pengeluaran"), (t) => t.nominal);
  const tagihanBelum = tagihan.filter((t) => t.status !== "lunas");
  return {
    saldo: totalPemasukan - totalPengeluaran,
    totalPemasukan,
    totalPengeluaran,
    tagihanBelumLunas: tagihanBelum.length,
    tagihanTelat: tagihan.filter((t) => t.status === "telat").length,
    nominalTunggakan: sumBy(tagihanBelum, (t) => t.jumlah + t.denda),
  };
}

/** 12-month cash flow ending at the latest month between today and the newest transaction */
export function computeCashFlow(transaksi: Transaksi[], months = 12) {
  const latestTrx = transaksi.reduce((m, t) => Math.max(m, new Date(t.tanggal).getTime()), 0);
  const end = new Date(Math.max(Date.now(), latestTrx));
  const out: { key: string; label: string; pemasukan: number; pengeluaran: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push({ key, label: `${["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, pemasukan: 0, pengeluaran: 0 });
  }
  const map = new Map(out.map((o) => [o.key, o]));
  for (const t of transaksi) {
    const d = new Date(t.tanggal);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const row = map.get(key);
    if (!row) continue;
    if (t.jenis === "pemasukan") row.pemasukan += t.nominal;
    else row.pengeluaran += t.nominal;
  }
  return out;
}

export function computeByCategory(transaksi: Transaksi[], jenis: Jenis) {
  const map = new Map<string, number>();
  const list = transaksi.filter((t) => t.jenis === jenis);
  for (const t of list) map.set(t.kategori, (map.get(t.kategori) ?? 0) + t.nominal);
  const total = sumBy(list, (t) => t.nominal);
  return Array.from(map.entries())
    .map(([kategori, nominal]) => ({ kategori, nominal, percent: total ? Math.round((nominal / total) * 1000) / 10 : 0 }))
    .sort((a, b) => b.nominal - a.nominal);
}
