import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  let target = "/login";
  try {
    const user = await getSessionUser();
    if (user) target = "/dashboard";
  } catch {
    // Database belum siap/tidak terjangkau — tetap arahkan ke login
    // agar halaman tidak crash. Diagnosa ditampilkan di halaman login.
  }
  redirect(target);
}
