"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wallet, User, Lock, LogIn } from "lucide-react";
import { setToken, apiFetch, getToken, clearToken, makeCredToken } from "@/lib/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) return;
    apiFetch("/api/auth/me").then((r) => {
      if (r.ok) router.replace("/dashboard");
    });
  }, [router]);

  useEffect(() => {
    fetch("/api/branding")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.logoAplikasi && setLogo(d.logoAplikasi))
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Strategi anti-gagal: TIDAK membaca body/header respons sama sekali
      // (proxy preview bisa merusaknya). Cukup status code yang selalu terbaca.
      // Kredensial dikodekan jadi token, diverifikasi server di setiap request.
      const cred = makeCredToken(username, password);
      setToken(cred);
      const res = await apiFetch("/api/auth/me", { cache: "no-store" });

      if (res.ok) {
        router.push("/dashboard");
        return;
      }
      clearToken();
      if (res.status === 401) {
        setError("Username atau password salah");
      } else if (res.status === 503 || res.status === 500) {
        // Ambil diagnosa detail dari health check
        try {
          const h = await fetch("/api/health", { cache: "no-store" });
          const info = (await h.json()) as {
            hasDatabaseUrl?: boolean;
            dbConnected?: boolean;
            dbError?: string;
          };
          if (!info.hasDatabaseUrl) {
            setError(
              "DATABASE_URL belum diset di hosting. Buka pengaturan Environment Variables, tambahkan DATABASE_URL berisi connection string PostgreSQL (mis. dari neon.tech), lalu deploy ulang."
            );
          } else if (!info.dbConnected) {
            setError(
              `DATABASE_URL sudah diset tetapi koneksi GAGAL: "${info.dbError || "unknown"}". Periksa kembali host/user/password pada connection string.`
            );
          } else {
            setError("Database sempat tidak terjangkau. Coba login lagi.");
          }
        } catch {
          setError(
            "Database tidak terjangkau. Pastikan DATABASE_URL sudah diset di pengaturan hosting, lalu deploy ulang."
          );
        }
      } else {
        setError(`Gagal masuk (HTTP ${res.status}). Coba lagi.`);
      }
    } catch (err) {
      setError(
        `Kesalahan jaringan: ${err instanceof Error ? err.message : "tidak diketahui"}`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-50/50 p-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 md:p-10 shadow-[0_20px_60px_rgba(99,102,241,0.12)] fade-up">
        <div className="mb-8 text-center">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt="Logo"
              className="mx-auto mb-5 h-16 w-16 rounded-2xl object-cover shadow-xl shadow-indigo-500/30"
            />
          ) : (
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-500/40">
              <Wallet size={30} />
            </div>
          )}
          <h1 className="text-2xl font-extrabold text-slate-800">
            Selamat Datang 👋
          </h1>
          <p className="mt-1 text-sm font-bold text-indigo-500">
            KAS RT — Blok Mawar RT 002 RW 014
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            Perumahan Ciptaland · Masuk untuk mengakses sistem
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-300">
              Username
            </label>
            <div className="relative">
              <User
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
              />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3.5 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 placeholder:text-slate-400 placeholder:font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-300">
              Password
            </label>
            <div className="relative">
              <Lock
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3.5 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 placeholder:text-slate-400 placeholder:font-semibold"
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
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 py-3.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-xl shadow-indigo-500/30 transition hover:bg-indigo-600 active:scale-[0.98] disabled:opacity-60"
          >
            <LogIn size={17} />
            {loading ? "Memproses..." : "Log In Sekarang"}
          </button>
        </form>

        <p className="mt-7 text-center text-xs font-bold text-slate-400">
          Belum punya akun?{" "}
          <Link href="/register" className="text-indigo-500 hover:underline">
            Daftar sebagai Warga
          </Link>
        </p>

      </div>
    </div>
  );
}
