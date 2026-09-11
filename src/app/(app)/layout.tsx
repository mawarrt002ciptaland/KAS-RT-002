"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ModalCatatTransaksi } from "@/components/ModalCatatTransaksi";
import { ModalTambahWarga } from "@/components/ModalTambahWarga";
import { AuthProvider } from "@/context/AuthContext";
import { AuthGate } from "@/components/AuthGate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [openTrx, setOpenTrx] = useState(false);
  const [openWarga, setOpenWarga] = useState(false);

  return (
    <AuthProvider>
      <AuthGate>
        <div className="flex min-h-screen bg-slate-50 text-slate-900">
          {/* Left Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <Header
              onOpenTransaction={() => setOpenTrx(true)}
              onOpenAddWarga={() => setOpenWarga(true)}
            />

            <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>

          {/* Global Modals accessible anywhere */}
          <ModalCatatTransaksi
            isOpen={openTrx}
            onClose={() => setOpenTrx(false)}
            onSuccess={() => window.location.reload()}
          />
          <ModalTambahWarga
            isOpen={openWarga}
            onClose={() => setOpenWarga(false)}
            onSuccess={() => window.location.reload()}
          />
        </div>
      </AuthGate>
    </AuthProvider>
  );
}
