"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, Search, ArrowRight, CheckCircle2, User, Lock, Phone, AlertCircle, ShieldAlert } from "lucide-react";

export default function RegisterPage() {
  const [nik, setNik] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resident, setResident] = useState<{
    nik: string;
    nama: string;
    noRumah: string;
    noHp: string;
  } | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("warga");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const router = useRouter();

  const handleCheckNik = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nik.trim()) {
      setError("Masukkan Nomor Induk Kependudukan (NIK)");
      return;
    }

    setVerifying(true);
    setError("");
    setResident(null);

    try {
      const res = await fetch("/api/auth/check-nik", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nik: nik.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "NIK tidak terdaftar");
      }

      if (data.alreadyHasAccount) {
        setError(`NIK ${nik} sudah memiliki akun dengan username @${data.existingUsername}. Silakan langsung login.`);
        return;
      }

      setResident(data.resident);
      setUsername(data.resident.nama.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 15));
    } catch (err: any) {
      setError(err.message || "Gagal memverifikasi NIK");
    } finally {
      setVerifying(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Username dan password wajib diisi");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password dan Konfirmasi Password tidak cocok");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nik: resident?.nik,
          name: resident?.nama,
          username: username.trim(),
          password: password,
          role: role,
          phone: resident?.noHp,
          houseNumber: resident?.noRumah,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mendaftar");
      }

      setSuccessMsg("Pendaftaran berhasil! Mengalihkan ke dashboard...");
      localStorage.setItem("kas_rt_user", JSON.stringify(data.user));
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Sample valid NIKs for rapid testing
  const sampleNiks = [
    { nik: "3201140903890006", nama: "Hendro Wijaya (M-04)" },
    { nik: "3201141806930007", nama: "Dedi Kurniawan (M-06)" },
    { nik: "3201142211870008", nama: "Rian Hidayat (M-07)" },
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 text-center relative overflow-hidden">
        {/* Wallet Icon - Matches Screenshot_38 */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-300">
            <CreditCard className="w-8 h-8" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-2xl font-black text-slate-800 flex items-center justify-center gap-1.5">
          <span>Daftar Akun</span>
          <span>📝</span>
        </h1>
        <p className="text-sm font-bold text-indigo-600 mt-1">
          KAS RT — Blok Mawar RT 002 RW 014
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          Verifikasi NIK untuk akses sistem
        </p>

        {/* Error / Success message */}
        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium text-left flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium text-left flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: CEK NIK - Note 6 / Screenshot_38 */}
        <div className="mt-6 text-left">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            1. Cek NIK
          </label>
          <form onSubmit={handleCheckNik} className="flex gap-2">
            <div className="relative flex-1">
              <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Nomor Induk Kependudukan"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                maxLength={16}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={verifying}
              className="px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl flex items-center justify-center transition-all shadow-md"
              title="Cek NIK"
            >
              {verifying ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          </form>

          {/* Quick NIK picks */}
          {!resident && (
            <div className="mt-3 text-[11px] text-slate-500">
              <p className="text-[10px] text-slate-400 font-semibold mb-1">
                Contoh NIK warga Blok Mawar yang belum daftar:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sampleNiks.map((s) => (
                  <button
                    key={s.nik}
                    type="button"
                    onClick={() => {
                      setNik(s.nik);
                    }}
                    className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg font-mono transition-colors text-slate-600"
                  >
                    {s.nama}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* STEP 2: IF NIK VERIFIED -> BUAT USERNAME & PASSWORD */}
        {resident && (
          <div className="mt-6 pt-5 border-t border-slate-100 text-left animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Verified Resident Info Banner */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-emerald-900 leading-tight">
                  Warga Terverifikasi: {resident.nama}
                </p>
                <p className="text-[11px] text-emerald-700">
                  Rumah: {resident.noRumah} · WA: {resident.noHp}
                </p>
              </div>
            </div>

            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              2. Buat Username & Password
            </label>

            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Username
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="username_anda"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Minimal 4 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Ulangi password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 mt-4"
              >
                <span>{submitting ? "Mendaftarkan..." : "Daftarkan Akun Warga"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Link back to login */}
        <div className="mt-6 text-xs text-slate-500">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline"
          >
            Login disini
          </Link>
        </div>
      </div>
    </div>
  );
}
