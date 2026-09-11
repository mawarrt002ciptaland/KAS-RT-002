"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Lock, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { CiptalandLogo } from "@/components/CiptalandLogo";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Username dan password wajib diisi");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login gagal");
      }

      // Save user session
      localStorage.setItem("kas_rt_user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Gagal masuk");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 text-center relative overflow-hidden">
        {/* Top Perumahan Ciptaland Logo - Matches Screenshot_37 */}
        <div className="flex justify-center mb-4">
          <CiptalandLogo size={72} className="shadow-md" />
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-2xl font-black text-slate-800 flex items-center justify-center gap-2">
          <span>Selamat Datang</span>
          <span>👋</span>
        </h1>
        <p className="text-sm font-bold text-indigo-600 mt-1">
          KAS RT — Blok Mawar RT 002 RW 014
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          Perumahan Ciptaland · Masuk untuk mengakses sistem
        </p>

        {/* Error notice */}
        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium text-left">
            {error}
          </div>
        )}

        {/* Form - Note 5: Username & Password access */}
        <form onSubmit={handleLogin} className="mt-6 space-y-4 text-left">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="admin / bendahara / ketuart / warga"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all tracking-wider"
              />
            </div>
          </div>

          {/* Submit Button - Note 5 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? "MEMPROSES..." : "LOG IN SEKARANG"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>


        <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-200 p-3 text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Bantuan Login
          </p>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Gunakan <span className="font-bold text-slate-800">username</span> atau <span className="font-bold text-slate-800">NIK</span> yang sudah terdaftar, lalu masukkan password akun Anda.
          </p>
          <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
            Akun pengurus yang tersedia: <span className="font-semibold">admin</span>, <span className="font-semibold">ketuart</span>, dan <span className="font-semibold">bendahara</span>.
          </p>
        </div>

        <div className="mt-5 text-xs text-slate-500">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline"
          >
            Daftar sebagai Warga
          </Link>
        </div>
      </div>
    </div>
  );
}
