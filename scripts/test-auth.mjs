import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { chromium, request as playwrightRequest } from "playwright";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { and, eq, inArray, like, sql } from "drizzle-orm";
import { hashPassword } from "../src/lib/password.ts";

const connection = process.env.DATABASE_URL;
const base = process.env.E2E_BASE_URL || "http://localhost:3000";
if (!connection || !["127.0.0.1", "localhost"].includes(new URL(connection).hostname)) throw new Error("Pengujian hanya diizinkan pada database sandbox lokal, bukan produksi.");
const pool = new Pool({ connectionString: connection });
const db = drizzle(pool);
const users = pgTable("kasrt_auth_users", { id: integer("id"), username: text("username"), passwordHash: text("password_hash"), name: text("name"), role: text("role"), residentId: integer("resident_id"), active: boolean("active"), bootstrap: boolean("bootstrap") });
const residents = pgTable("residents", { id: integer("id"), nik: text("nik"), name: text("name"), address: text("address"), phone: text("phone"), familyMembers: integer("family_members"), status: text("status"), joinedAt: text("joined_at") });
const bills = pgTable("bills", { id: integer("id"), residentId: integer("resident_id"), feeTypeId: integer("fee_type_id"), period: text("period"), amount: integer("amount"), status: text("status"), dueDate: text("due_date") });
const fees = pgTable("fee_types", { id: integer("id"), name: text("name"), amount: integer("amount"), description: text("description"), active: boolean("active") });
const proofs = pgTable("kasrt_payment_proofs", { id: integer("id"), billId: integer("bill_id"), userId: integer("user_id"), status: text("status") });
const sessions = pgTable("kasrt_auth_sessions", { tokenHash: text("token_hash"), userId: integer("user_id"), expiresAt: timestamp("expires_at", { withTimezone: true }) });
const limits = pgTable("kasrt_auth_limits", { key: text("key") });
const txs = pgTable("transactions", { id: integer("id"), description: text("description") });
const suffix = Date.now().toString(36);
const adminUsername = `qa_admin_${suffix}`;
const residentUsername = `qa_warga_${suffix}`;
const nik = "99" + String(BigInt("0x" + randomBytes(7).toString("hex"))).padStart(14,"0").slice(-14);
const otherNik = "98" + nik.slice(2);
const password = "TestMawar9!" + randomBytes(12).toString("hex");
const createdResidents = [], createdBills = [];
let browser, newFee;
const report = (text) => console.log("PASS:", text);
const post = (client, path, data) => client.post(base + path, { data, headers: { Origin: new URL(base).origin, "Content-Type": "application/json" } });
const errors = [];

try {
  await db.delete(limits);
  browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  page.on("pageerror", e => errors.push(e.message));
  await page.goto(base + "/dashboard");
  await page.waitForURL("**/login");
  await page.getByRole("button", { name: "Masuk Sekarang" }).waitFor();
  await page.screenshot({ path: "/tmp/kasrt-login-desktop.png", fullPage: true });
  assert.equal((await post(ctx.request, "/api/auth/login", { username: "not-an-account", password })).status(), 401);
  assert.equal((await post(ctx.request, "/api/auth/verify-nik", { nik: "123" })).status(), 400);
  assert.equal((await post(ctx.request, "/api/auth/verify-nik", { nik: "0000000000000000" })).status(), 400);
  assert.equal((await post(ctx.request, "/api/auth/register", { username: residentUsername, password, confirmPassword: password, role: "admin" })).status(), 400);
  assert.equal((await ctx.request.get(base + "/api/admin/residents")).status(), 401);
  report("Dashboard terlindungi; password salah, NIK invalid, dan signup tanpa verifikasi ditolak");

  const status = await (await ctx.request.get(base + "/api/auth/status")).json();
  if (!status.hasAdmin) {
    await page.goto(base + "/setup");
    await page.locator('[name="setupKey"]').fill(process.env.ADMIN_SETUP_KEY || "");
    await page.locator('[name="name"]').fill("Pengurus Uji");
    await page.locator('[name="username"]').fill(adminUsername);
    await page.locator('[name="password"]').fill(password);
    await page.locator('[name="confirmPassword"]').fill(password);
    await page.getByRole("button", { name: "Buat Admin & Masuk" }).click();
    await page.waitForURL("**/dashboard", { timeout: 25000 });
    report("Penyiapan admin pertama melalui browser berhasil");
  } else {
    await db.insert(users).values({ username: adminUsername, name: "Pengurus Uji", passwordHash: await hashPassword(password), role: "admin", active: true, bootstrap: false });
    const result = await post(ctx.request, "/api/auth/login", { username: adminUsername, password });
    assert.equal(result.status(), 200);
    await page.goto(base + "/dashboard");
  }
  assert.equal((await post(ctx.request, "/api/auth/setup", { setupKey: process.env.ADMIN_SETUP_KEY, username: "no_second_admin", password, confirmPassword: password, name: "Tidak Dibuat" })).status(), 409);
  const cookie = (await ctx.cookies()).find(c => c.name === "kasrt_session_v2");
  assert(cookie?.httpOnly); assert.equal(cookie?.sameSite, "Lax");
  if (base.startsWith("https:")) assert(cookie?.secure);

  await page.getByRole("button", { name: "Data Warga", exact: true }).click();
  await page.getByRole("button", { name: "Tambah Warga", exact: true }).click();
  const modal = page.getByRole("dialog");
  await modal.locator('[name="name"]').fill("Registrasi Uji");
  await modal.locator('[name="nik"]').fill(nik);
  await modal.locator('[name="address"]').fill("Blok Uji A1");
  await modal.locator('[name="phone"]').fill("081234567890");
  await modal.locator('[name="familyMembers"]').fill("3");
  await modal.getByRole("button", { name: "Simpan Data Warga" }).click();
  await modal.waitFor({ state: "hidden" });
  const [resident] = await db.select().from(residents).where(eq(residents.nik, nik));
  assert(resident); createdResidents.push(resident.id);
  const [other] = await db.insert(residents).values({ nik: otherNik, name: "Data Warga Rahasia Uji", address: "Blok Uji B1", phone: "081234567891", familyMembers: 2, status: "aktif", joinedAt: "2026-09-09" }).returning();
  createdResidents.push(other.id);
  const [testFee] = await db.insert(fees).values({ name: "Iuran Uji", amount: 50000, description: "E2E temporary fee", active: true }).returning();
  newFee = testFee.id;
  for (const residentId of createdResidents) {
    const [bill] = await db.insert(bills).values({ residentId, feeTypeId: testFee.id, period: "September 2026", amount: 50000, status: "belum_lunas", dueDate: "2026-09-10" }).returning();
    createdBills.push(bill.id);
  }
  report("Admin dapat menambahkan NIK warga ke database melalui formulir");
  await page.getByRole("button", { name: "Keluar dari akun" }).click();
  await page.waitForURL("**/login");
  assert.equal((await ctx.request.get(base + "/api/auth/me")).status(), 401);
  const oldCookieClient = await playwrightRequest.newContext({ extraHTTPHeaders: { Cookie: `kasrt_session_v2=${cookie.value}` } });
  assert.equal((await oldCookieClient.get(base + "/api/auth/me")).status(), 401);
  await oldCookieClient.dispose();
  report("Logout mencabut cookie dan sesi server, token lama ditolak");

  await page.goto(base + "/register");
  await page.locator('[name="nik"]').fill(nik);
  await page.getByRole("button", { name: "Verifikasi NIK", exact: true }).click();
  await page.getByText("NIK terverifikasi", { exact: true }).waitFor();
  await page.locator('[name="username"]').fill(residentUsername);
  await page.locator('[name="password"]').fill(password);
  await page.locator('[name="confirmPassword"]').fill(password + "x");
  await page.getByRole("button", { name: "Buat Akun Warga", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "Konfirmasi password tidak sama" }).waitFor();
  await page.locator('[name="confirmPassword"]').fill(password);
  await page.getByRole("button", { name: "Buat Akun Warga", exact: true }).click();
  await page.waitForURL("**/dashboard", { timeout: 25000 });
  await page.getByRole("heading", { name: "Tagihan Saya", exact: true }).waitFor();
  await page.reload();
  await page.getByRole("heading", { name: "Tagihan Saya", exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Data Warga", exact: true }).count(), 0);
  assert.equal(await page.getByRole("button", { name: "Pengaturan", exact: true }).count(), 0);
  const html = await (await ctx.request.get(base + "/dashboard")).text();
  assert(!html.includes("Data Warga Rahasia Uji"));
  const [registered] = await db.select().from(users).where(eq(users.username, residentUsername));
  assert.equal(registered.role, "warga"); assert.equal(registered.residentId, resident.id);
  assert(registered.passwordHash.startsWith("scrypt-v1$")); assert(!registered.passwordHash.includes(password));
  assert.equal(await page.evaluate(() => localStorage.getItem("token")), null);
  assert.equal((await ctx.request.get(base + "/api/admin/users")).status(), 403);
  assert.equal((await post(ctx.request, "/api/admin/residents", { nik: "0000000000000000" })).status(), 403);
  await page.screenshot({ path: "/tmp/kasrt-warga-dashboard.png", fullPage: true });
  report("Signup NIK, hash password, sesi setelah refresh, dan pembatasan data warga lulus");

  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6pgAAAABJRU5ErkJggg==", "base64");
  const proof = id => ctx.request.post(base + "/api/payments", { headers: { Origin: new URL(base).origin }, multipart: { billId: String(id), proof: { name: "proof.png", mimeType: "image/png", buffer: png } } });
  assert.equal((await proof(createdBills[1])).status(), 403);
  assert.equal((await proof(createdBills[0])).status(), 201);
  const [pendingBill] = await db.select().from(bills).where(eq(bills.id, createdBills[0]));
  assert.equal(pendingBill.status, "belum_lunas");
  assert.equal((await post(ctx.request, "/api/admin/payments", { billId: createdBills[0] })).status(), 403);
  report("Warga tidak dapat membayar tagihan orang lain atau menyetujui pembayaran sendiri");

  const anonymous = await playwrightRequest.newContext();
  assert.equal((await post(anonymous, "/api/auth/verify-nik", { nik })).status(), 400);
  assert.equal((await post(anonymous, "/api/auth/verify-nik", { nik: otherNik })).status(), 200);
  assert.equal((await post(anonymous, "/api/auth/register", { username: residentUsername, password, confirmPassword: password, role: "admin" })).status(), 409);
  const forced = await post(anonymous, "/api/auth/register", { username: residentUsername + "_alt", password, confirmPassword: password, role: "admin" });
  assert.equal(forced.status(), 201);
  assert.equal((await (await anonymous.get(base + "/api/auth/me")).json()).user.role, "warga");
  report("Duplikasi NIK/username ditolak; parameter role admin di signup diabaikan");
  await anonymous.dispose();

  await db.update(sessions).set({ expiresAt: new Date(Date.now()-60000) }).where(eq(sessions.userId, registered.id));
  assert.equal((await ctx.request.get(base + "/api/auth/me")).status(), 401);
  await page.goto(base + "/dashboard"); await page.waitForURL("**/login");
  await page.locator('[name="username"]').fill(adminUsername.toUpperCase());
  await page.locator('[name="password"]').fill(password);
  await page.getByRole("button", { name: "Masuk Sekarang", exact: true }).click();
  await page.waitForURL("**/dashboard");
  const approved = await post(ctx.request, "/api/admin/payments", { billId: createdBills[0] });
  assert.equal(approved.status(), 200, await approved.text());
  await post(ctx.request, "/api/admin/payments", { billId: createdBills[0] });
  const bookings = await db.select().from(txs).where(like(txs.description, `Pembayaran tagihan #${createdBills[0]} - %`));
  assert.equal(bookings.length, 1);
  assert.equal((await db.select().from(bills).where(eq(bills.id, createdBills[0])))[0].status, "lunas");
  report("Sesi kedaluwarsa ditolak; admin menyetujui bukti dan pemasukan tidak tercatat ganda");

  const csrf = await ctx.request.post(base + "/api/auth/login", { headers: { Origin: "https://invalid.example" }, data: { username: adminUsername, password } });
  assert.equal(csrf.status(), 403);
  let rate;
  for(let i=0;i<11;i++) rate = await post(ctx.request, "/api/auth/login", { username: "rate_test_" + suffix, password: "wrong_password_99" });
  assert.equal(rate.status(), 429);
  await ctx.request.post(base + "/api/auth/logout", { headers: { Origin: new URL(base).origin } });
  await page.goto(base + "/login");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "/tmp/kasrt-login-mobile.png", fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  assert.equal(errors.length, 0, errors.join("\n"));
  report("Proteksi origin, batas percobaan login, dan tampilan mobile lulus");
} finally {
  if (browser) await browser.close();
  if (createdBills.length) {
    await db.delete(proofs).where(inArray(proofs.billId, createdBills));
    for(const id of createdBills) await db.delete(txs).where(like(txs.description, `Pembayaran tagihan #${id} - %`));
    await db.delete(bills).where(inArray(bills.id, createdBills));
  }
  await db.delete(users).where(inArray(users.username, [adminUsername, residentUsername, residentUsername + "_alt"]));
  if(createdResidents.length) await db.delete(residents).where(inArray(residents.id, createdResidents));
  if(newFee) await db.delete(fees).where(eq(fees.id, newFee));
  await db.delete(limits);
  await pool.end();
  console.log("Data pengujian sementara dibersihkan.");
}
