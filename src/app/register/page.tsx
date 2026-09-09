"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wallet, Search, CreditCard, User, Lock, CheckCircle2 } from "lucide-react";
import { setToken, makeCredToken } from "@/lib/api";

type WargaInfo = { id: number; nama: string; noRumah: string; nik: string };

export default function RegisterPage() {
  const [nik, setNik] = useState("");
  const [wargaInfo, setWargaInfo] = useState<WargaInfo | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function cekNik() {
    setError("");
    if (!nik.trim()) {
      setError("Masukkan NIK terlebih dahulu");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/register?nik=${encodeURIComponent(nik.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "NIK tidak ditemukan");
        setWargaInfo(null);
        return;
      }
      setWargaInfo(data.warga);
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  async function daftar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nik: nik.trim(), username, password }),
      });
      if (res.ok) {
        // Tidak bergantung pada body respons — pakai credential token
        setToken(makeCredToken(username, password));
        router.push("/dashboard");
        return;
      }
      let data: { error?: string } = {};
      try {
        const text = await res.text();
        if (text) data = JSON.parse(text);
      } catch {
        // body tidak terbaca
      }
      setError(data.error || `Gagal mendaftar (HTTP ${res.status})`);
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3.5 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 placeholder:text-slate-400 placeholder:font-semibold";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-50/50 p-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 md:p-10 shadow-[0_20px_60px_rgba(99,102,241,0.12)] fade-up">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-500/40">
            <Wallet size={30} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">
            Daftar Akun 📝
          </h1>
          <p className="mt-1 text-sm font-bold text-indigo-500">
            KAS RT — Blok Mawar RT 002 RW 014
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            Verifikasi NIK untuk akses sistem
          </p>
        </div>

        {!wargaInfo ? (
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-300">
                1. Cek NIK
              </label>
              <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100">
                <div className="flex items-center pl-4 text-slate-300">
                  <CreditCard size={17} />
                </div>
                <input
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && cekNik()}
                  placeholder="Nomor Induk Kependudukan"
                  className="flex-1 bg-transparent py-3.5 px-3 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400 placeholder:font-semibold"
                />
                <button
                  onClick={cekNik}
                  disabled={loading}
                  className="bg-slate-800 px-5 text-white transition hover:bg-slate-900 disabled:opacity-60"
                >
                  <Search size={18} />
                </button>
              </div>
            </div>
            {error && (
              <p className="rounded-xl bg-rose-50 px-4 py-3 text-center text-xs font-bold text-rose-500">
                {error}
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={daftar} className="space-y-5">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <CheckCircle2 className="text-emerald-500" size={22} />
              <div>
                <p className="text-sm font-extrabold text-emerald-700">
                  {wargaInfo.nama}
                </p>
                <p className="text-[11px] font-bold text-emerald-500">
                  Rumah {wargaInfo.noRumah} · NIK terverifikasi ✓
                </p>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-300">
                2. Buat Username
              </label>
              <div className="relative">
                <User size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username baru"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-300">
                3. Buat Password
              </label>
              <div className="relative">
                <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className={inputCls}
                />
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-rose-50 px-4 py-3 text-center text-xs font-bold text-rose-500">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-indigo-500 py-3.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-xl shadow-indigo-500/30 transition hover:bg-indigo-600 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Daftar Sekarang"}
            </button>
          </form>
        )}

        <p className="mt-7 text-center text-xs font-bold text-slate-400">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-indigo-500 hover:underline">
            Login disini
          </Link>
        </p>
      </div>
    </div>
  );
}
