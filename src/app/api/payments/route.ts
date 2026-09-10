import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bills, paymentProofs } from "@/db/schema";
import { apiError, AuthError, json, requireSameOrigin, requireUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const user = await requireUser();
    if (Number(request.headers.get("content-length")) > 2250000) throw new AuthError(413, "FILE_TOO_LARGE", "Bukti pembayaran maksimal 2 MB.");
    const form = await request.formData();
    const id = Number(form.get("billId"));
    const file = form.get("proof");
    if (!Number.isInteger(id) || !(file instanceof File) || file.size < 16 || file.size > 2 * 1024 * 1024) throw new AuthError(400, "INVALID_FILE", "Pilih tagihan dan gambar bukti PNG/JPG maksimal 2 MB.");
    const [bill] = await db.select().from(bills).where(eq(bills.id, id)).limit(1);
    if (!bill || (user.role !== "admin" && bill.residentId !== user.residentId)) throw new AuthError(403, "FORBIDDEN", "Anda hanya dapat mengirim bukti untuk tagihan sendiri.");
    if (bill.status === "lunas") throw new AuthError(409, "ALREADY_PAID", "Tagihan sudah lunas.");
    const bytes = Buffer.from(await file.arrayBuffer());
    const png = bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    if (!png && !jpeg) throw new AuthError(400, "INVALID_FILE", "Bukti harus berupa gambar PNG atau JPG asli.");
    const image = `data:image/${png ? "png" : "jpeg"};base64,${bytes.toString("base64")}`;
    const [created] = await db.insert(paymentProofs).values({ billId: id, userId: user.id, image }).onConflictDoNothing().returning({ id: paymentProofs.id });
    if (!created) throw new AuthError(409, "PENDING_REVIEW", "Bukti tagihan ini sudah diterima dan menunggu verifikasi pengurus.");
    return json({ ok: true, message: "Bukti diterima untuk verifikasi." }, 201);
  } catch (error) { return apiError(error); }
}
