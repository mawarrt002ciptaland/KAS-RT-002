"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardList,
  Users,
  Receipt,
  BarChart3,
  ShoppingBag,
  Settings,
  ShieldCheck,
  MessageSquare,
  LogOut,
  Sparkles,
} from "lucide-react";
import { CiptalandLogo } from "./CiptalandLogo";
import { useAuth } from "@/context/AuthContext";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    {
      href: "/dashboard",
      // Note 1: Rubah nama kolom "Ringkasan" pada halaman Dashboard jadi " Dashboard"
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/pemasukan",
      label: "Pemasukan",
      icon: ArrowDownLeft,
    },
    {
      href: "/pengeluaran",
      label: "Pengeluaran",
      icon: ArrowUpRight,
    },
    {
      href: "/tagihan",
      label: "Tagihan Warga",
      icon: ClipboardList,
      badge: "4",
    },
    {
      href: "/warga",
      label: "Data Warga",
      icon: Users,
    },
    {
      href: "/kwitansi",
      label: "Kwitansi",
      icon: Receipt,
    },
    {
      href: "/laporan",
      label: "Laporan",
      icon: BarChart3,
    },
    {
      href: "/marketplace",
      label: "Marketplace",
      icon: ShoppingBag,
    },
    {
      href: "/pengaturan",
      label: "Pengaturan",
      icon: Settings,
    },
  ];

  const systemItems = [
    {
      href: "/pengaturan?tab=users",
      label: "Hak Akses",
      icon: ShieldCheck,
    },
    {
      href: "/whatsapp",
      label: "WhatsApp",
      icon: MessageSquare,
    },
  ];

  const roleLabels: Record<string, string> = {
    admin: "Admin RT",
    ketua_rt: "Ketua RT",
    bendahara: "Bendahara RT",
    warga: "Warga RT",
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 select-none z-30">
      <div>
        {/* Brand & Emblem */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <CiptalandLogo size={42} />
            <div>
              <div className="text-sm font-black text-slate-800 tracking-tight leading-none uppercase">
                KAS RT 002
              </div>
              <div className="text-[11px] font-semibold text-slate-400 tracking-wider mt-0.5">
                BLOK MAWAR · CIPTALAND
              </div>
            </div>
          </div>

          {/* RT Badge */}
          <div className="mt-3 bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">🏠</span>
              <div>
                <p className="font-bold text-slate-800 text-[11px] leading-tight">
                  RT 002 · RW 014
                </p>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Perumahan Ciptaland
                </p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>

        {/* Menu Navigation */}
        <div className="px-3 py-4">
          <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-2">
            Menu Utama
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200 font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? "bg-white text-indigo-700"
                          : "bg-rose-50 text-rose-600 border border-rose-200"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 mt-5 mb-2">
            Sistem
          </div>
          <nav className="space-y-1">
            {systemItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom section */}
      <div className="p-3 space-y-3">
        {/* Transparency Banner matching mockup */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white shadow-md relative overflow-hidden">
          <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Kas transparan, warga nyaman.</span>
          </div>
          <p className="text-[10px] text-indigo-100 leading-relaxed font-normal">
            Seluruh transaksi tercatat dan dapat dipertanggungjawabkan secara transparan.
          </p>
          <div className="mt-2 text-[9px] uppercase tracking-wider font-bold text-indigo-200/90">
            STATIC DIST · RT 002 V5
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200 shrink-0">
              {user?.avatar || "AS"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">
                {user?.name || "Ahmad Suryana"}
              </p>
              <p className="text-[10px] font-medium text-slate-500 truncate">
                {roleLabels[user?.role || "bendahara"] || "Bendahara RT"}
              </p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Keluar / Logout"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
