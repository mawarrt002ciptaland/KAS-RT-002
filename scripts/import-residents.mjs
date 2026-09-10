import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, serial, text, integer, date, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

if (!process.env.DATABASE_URL) throw new Error("Isi DATABASE_URL pada environment lokal; jangan mengirim URL ke chat.");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);
const legacy = pgTable("warga", { nik: text("nik"), name: text("nama"), address: text("no_rumah"), phone: text("telepon"), status: text("status"), createdAt: timestamp("created_at") });
const residents = pgTable("residents", { id: serial("id").primaryKey(), nik: text("nik"), name: text("name"), address: text("address"), phone: text("phone"), status: text("status"), familyMembers: integer("family_members"), joinedAt: date("joined_at") });
try {
  const exists = await db.execute(sql`select to_regclass('public.warga') as name`);
  if (!exists.rows[0]?.name) { console.log("Tabel warga tidak ditemukan; tidak ada data yang diubah."); }
  else {
    const rows = await db.select().from(legacy);
    let inserted = 0, skipped = 0;
    for (const row of rows) {
      if (!/^\d{16}$/.test(row.nik || "") || !row.name) { skipped++; continue; }
      const result = await db.insert(residents).values({ nik: row.nik, name: row.name, address: row.address || "-", phone: row.phone || "", status: row.status === "aktif" ? "aktif" : "nonaktif", familyMembers: 1, joinedAt: row.createdAt?.toISOString().slice(0,10) || new Date().toISOString().slice(0,10) }).onConflictDoNothing().returning({ id: residents.id });
      inserted += result.length;
    }
    console.log(`Import selesai: ${inserted} warga ditambahkan; ${skipped} baris tidak valid dilewati. Data sumber tetap utuh.`);
  }
} finally { await pool.end(); }
