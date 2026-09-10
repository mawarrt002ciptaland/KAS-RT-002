import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bills, feeTypes, residents, transactions } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import DashboardApp from "../dashboard-app";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function DashboardPage() {
  const user = await getSessionUser().catch(() => null);
  if (!user) redirect("/login");
  try {
    const [residentRows, transactionRows, billRows, fees] = await Promise.all([
      db.select().from(residents).where(user.role === "admin" ? undefined : eq(residents.id, user.residentId ?? -1)).orderBy(residents.name),
      user.role === "admin" ? db.select().from(transactions).orderBy(desc(transactions.transactionDate), desc(transactions.id)) : Promise.resolve([]),
      db.select({ id: bills.id, residentId: bills.residentId, residentName: residents.name, residentAddress: residents.address,
        feeName: feeTypes.name, period: bills.period, amount: bills.amount, status: bills.status, dueDate: bills.dueDate, paidAt: bills.paidAt,
      }).from(bills).innerJoin(residents, eq(residents.id, bills.residentId)).innerJoin(feeTypes, eq(feeTypes.id, bills.feeTypeId))
        .where(user.role === "admin" ? undefined : eq(bills.residentId, user.residentId ?? -1)).orderBy(desc(bills.id)),
      db.select().from(feeTypes),
    ]);
    return <DashboardApp key={user.id} sessionUser={user}
      residents={residentRows.map(row => ({ ...row, createdAt: row.createdAt.toISOString() }))}
      transactions={transactionRows.map(row => ({ ...row, createdAt: row.createdAt.toISOString() }))}
      bills={billRows.map(row => ({ ...row, paidAt: row.paidAt?.toISOString() ?? null }))}
      fees={fees}/>;
  } catch {
    return <main className="login-page"><section className="login-card"><h1>Data belum dapat dimuat</h1><p className="login-subtitle">Sesi Anda valid. Pengurus perlu memeriksa koneksi dan migrasi database; tidak ada data demo yang ditampilkan sebagai data warga.</p><Link href="/dashboard" className="btn primary">Coba lagi</Link></section></main>;
  }
}
