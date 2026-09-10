import { NextRequest } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { authUsers, bills, paymentProofs, residents, transactions } from "@/db/schema";
import { apiError, AuthError, json, readJson, requireSameOrigin, requireUser } from "@/lib/auth";
import { hashPassword, validPassword } from "@/lib/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ resource: string }> };
const value = (body: Record<string, unknown>, key: string) => typeof body[key] === "string" ? String(body[key]).trim() : "";

export async function GET(_request: NextRequest, context: Context) {
  try {
    await requireUser(true);
    const { resource } = await context.params;
    if (resource === "residents") return json({ ok: true, residents: await db.select().from(residents).orderBy(residents.name) });
    if (resource === "users") return json({ ok: true, users: await db.select({ id: authUsers.id, username: authUsers.username, name: authUsers.name, role: authUsers.role, active: authUsers.active, createdAt: authUsers.createdAt }).from(authUsers).orderBy(desc(authUsers.id)) });
    if (resource === "payments") return json({ ok: true, payments: await db.select({ id: paymentProofs.id, billId: paymentProofs.billId, name: residents.name, amount: bills.amount, period: bills.period, image: paymentProofs.image, submittedAt: paymentProofs.createdAt }).from(paymentProofs).innerJoin(bills, eq(bills.id, paymentProofs.billId)).innerJoin(residents, eq(residents.id, bills.residentId)).where(eq(paymentProofs.status, "pending")).orderBy(desc(paymentProofs.createdAt)) });
    return json({ ok: false, error: "Tidak ditemukan." }, 404);
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    requireSameOrigin(request);
    await requireUser(true);
    const body = await readJson(request);
    const { resource } = await context.params;
    if (resource === "residents") {
      const nik = value(body, "nik"), name = value(body, "name"), address = value(body, "address"), phone = value(body, "phone");
      const familyMembers = Number(body.familyMembers);
      if (!/^\d{16}$/.test(nik) || name.length < 2 || name.length > 80 || address.length < 3 || address.length > 200 || !/^[+0-9 ()-]{8,20}$/.test(phone) || !Number.isInteger(familyMembers) || familyMembers < 1 || familyMembers > 30) throw new AuthError(400, "INVALID_RESIDENT", "Isi nama, NIK 16 digit, alamat, telepon, dan jumlah jiwa 1–30 dengan benar.");
      const [resident] = await db.insert(residents).values({ nik, name, address, phone, familyMembers, joinedAt: new Date().toISOString().slice(0,10) }).onConflictDoNothing().returning({ id: residents.id });
      if (!resident) throw new AuthError(409, "DUPLICATE_NIK", "NIK tersebut sudah terdaftar.");
      return json({ ok: true, id: resident.id }, 201);
    }
    if (resource === "transactions") {
      const type = value(body, "type"), category = value(body, "category"), description = value(body, "description"), date = value(body, "transactionDate");
      const amount = Number(String(body.amount ?? "").replace(/[.\s]/g, ""));
      if (!["masuk","keluar"].includes(type) || !Number.isSafeInteger(amount) || amount < 1 || amount > 2000000000 || !category || category.length > 80 || !description || description.length > 500 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date))) throw new AuthError(400, "INVALID_TRANSACTION", "Lengkapi transaksi dengan tanggal dan nominal rupiah yang valid.");
      await db.insert(transactions).values({ type: type as "masuk" | "keluar", category, description, amount, transactionDate: date });
      return json({ ok: true }, 201);
    }
    if (resource === "users") {
      const username = value(body, "username").toLowerCase(), name = value(body, "name"), password = typeof body.password === "string" ? body.password : "";
      if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username) || name.length < 3 || name.length > 80 || !validPassword(password)) throw new AuthError(400, "INVALID_ACCOUNT", "Isi nama, username valid, dan password minimal 10 karakter berisi huruf serta angka.");
      if (password !== body.confirmPassword) throw new AuthError(400, "PASSWORD_MISMATCH", "Konfirmasi password tidak sama.");
      const [user] = await db.insert(authUsers).values({ username, name, passwordHash: await hashPassword(password), role: "admin" }).onConflictDoNothing().returning({ id: authUsers.id });
      if (!user) throw new AuthError(409, "USERNAME_EXISTS", "Username tersebut sudah digunakan.");
      return json({ ok: true }, 201);
    }
    if (resource === "payments") {
      const billId = Number(body.billId);
      if (!Number.isInteger(billId) || billId < 1) throw new AuthError(400, "INVALID_BILL", "Tagihan tidak valid.");
      // One atomic statement: concurrent approvals cannot record income twice.
      await db.execute(sql`with paid as (
        update ${bills} set status = 'lunas', paid_at = now()
        where id = ${billId} and status = 'belum_lunas'
        and exists (select 1 from ${paymentProofs} where bill_id = ${billId} and status = 'pending')
        returning id, amount, period
      ), booked as (
        insert into ${transactions} (type, category, description, amount, transaction_date)
        select 'masuk', 'Pembayaran Iuran', 'Pembayaran tagihan #' || id || ' - ' || period, amount, current_date from paid
        returning id
      ) update ${paymentProofs} set status = 'approved' where bill_id = ${billId} and exists (select 1 from paid)`);
      return json({ ok: true });
    }
    return json({ ok: false, error: "Tidak ditemukan." }, 404);
  } catch (error) { return apiError(error); }
}
