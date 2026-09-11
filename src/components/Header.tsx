"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Search, Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface HeaderProps {
  onOpenTransaction?: () => void;
  onOpenAddWarga?: () => void;
}

export function Header({ onOpenTransaction, onOpenAddWarga }: HeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const getPageTitle = () => {
    if (pathname.includes("/dashboard") || pathname === "/") return "Dashboard";
    if (pathname.includes("/pemasukan")) return "Pemasukan Kas";
    if (pathname.includes("/pengeluaran")) return "Pengeluaran Kas";
    if (pathname.includes("/tagihan")) return "Tagihan Warga";
    if (pathname.includes("/warga")) return "Data Warga";
    if (pathname.includes("/kwitansi")) return "Kwitansi Digital";
    if (pathname.includes("/laporan")) return "Laporan Keuangan";
    if (pathname.includes("/marketplace")) return "Marketplace Warga";
    if (pathname.includes("/pengaturan")) return "Pengaturan Sistem";
    if (pathname.includes("/whatsapp")) return "WhatsApp Broadcast";
    return "Dashboard";
  };

  const roleTitles: Record<string, string> = {
    admin: "Admin RT",
    ketua_rt: "Ketua RT",
    bendahara: "Bendahara RT",
    warga: "Warga",
  };

  const sampleNotifications = [
    {
      id: 1,
      title: "Iuran Terverifikasi",
      desc: "Bayu Sudik (M-02) membayar iuran April 2026 Rp 50.000 via Transfer",
      time: "10 menit lalu",
      unread: true,
    },
    {
      id: 2,
      title: "Tagihan Belum Lunas",
      desc: "4 warga belum melunasi tagihan iuran bulan April",
      time: "1 jam lalu",
      unread: true,
    },
    {
      id: 3,
      title: "Produk Baru",
      desc: "Siti Aminah memposting 'Katering Tumpeng Mini Bu Ani'",
      time: "2 jam lalu",
      unread: false,
    },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <span className="text-slate-400">Blok Mawar</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-bold tracking-tight text-sm">{getPageTitle()}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari data..."
            className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-56 transition-all"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl relative transition-colors border border-slate-200/60"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-3 z-50 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="font-bold text-slate-800">Notifikasi</span>
                <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">2 baru</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sampleNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-2 rounded-xl text-left transition-colors ${
                      notif.unread ? "bg-indigo-50/50 border border-indigo-100" : "bg-slate-50"
                    }`}
                  >
                    <p className="font-bold text-slate-800 text-[11px] leading-tight">{notif.title}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">{notif.desc}</p>
                    <span className="text-[9px] text-slate-400 mt-1 inline-block">{notif.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Link
          href="/pengaturan?tab=users"
          className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            {user?.avatar || "US"}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name || "Pengguna"}</p>
            <p className="text-[10px] font-medium text-slate-500 leading-tight">
              {roleTitles[user?.role || "warga"]}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}
