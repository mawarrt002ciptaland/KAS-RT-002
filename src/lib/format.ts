// Format helpers for SISTEM INFORMASI RT 002 (locale id-ID)

export const BULAN_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
export const BULAN_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export const HARI_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function groupThousands(v: number): string {
  const neg = v < 0;
  const s = Math.round(Math.abs(v)).toString();
  const out = s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (neg ? "-" : "") + out;
}

/** Rp 8.002.313 */
export function formatRupiah(n: number | null | undefined): string {
  return "Rp " + groupThousands(Number(n ?? 0));
}

/** Rp 8 jt (compact) */
export function formatRupiahCompact(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  const a = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (a >= 1_000_000_000) return sign + "Rp " + trimZero((a / 1_000_000_000).toFixed(1)) + " M";
  if (a >= 1_000_000) return sign + "Rp " + trimZero((a / 1_000_000).toFixed(1)) + " jt";
  if (a >= 1_000) return sign + "Rp " + Math.round(a / 1_000) + " rb";
  return formatRupiah(v);
}
function trimZero(s: string) {
  return s.replace(/\.0$/, "").replace(".", ",");
}

/** Number with thousand separators: 8.002.313 */
export function formatNumber(n: number | null | undefined): string {
  return groupThousands(Number(n ?? 0));
}

/** Strip non-digits and parse */
export function parseRupiahInput(s: string): number {
  const cleaned = s.replace(/[^\d]/g, "");
  return cleaned ? parseInt(cleaned, 10) : 0;
}

/** Grouped input display: 8.002.313 */
export function toThousandInput(n: number): string {
  if (!n) return "";
  return groupThousands(n);
}

/** 31 Agustus 2026 */
export function formatTanggalID(d: Date | string | number): string {
  const date = new Date(d);
  if (isNaN(date.getTime())) return "-";
  return `${date.getDate()} ${BULAN_ID[date.getMonth()]} ${date.getFullYear()}`;
}

/** 31 Agu 2026 */
export function formatTanggalPendek(d: Date | string | number): string {
  const date = new Date(d);
  if (isNaN(date.getTime())) return "-";
  return `${date.getDate()} ${BULAN_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

/** Senin, 31 Agustus 2026 */
export function formatTanggalLengkapID(d: Date | string | number): string {
  const date = new Date(d);
  if (isNaN(date.getTime())) return "-";
  return `${HARI_ID[date.getDay()]}, ${date.getDate()} ${BULAN_ID[date.getMonth()]} ${date.getFullYear()}`;
}

/** yyyy-mm-dd for input[type=date] */
export function toISODate(d: Date | string | number): string {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 14:30 */
export function formatJam(d: Date | string | number): string {
  const date = new Date(d);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** "2 jam lalu" */
export function relativeTime(d: Date | string | number): string {
  const date = new Date(d);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 0) {
    const ahead = -diff;
    if (ahead < 86400) return "hari ini";
    if (ahead < 86400 * 2) return "besok";
    if (ahead < 604800) return Math.floor(ahead / 86400) + " hari lagi";
    return formatTanggalID(date);
  }
  if (diff < 60) return "baru saja";
  if (diff < 3600) return Math.floor(diff / 60) + " menit lalu";
  if (diff < 86400) return Math.floor(diff / 3600) + " jam lalu";
  if (diff < 604800) return Math.floor(diff / 86400) + " hari lalu";
  return formatTanggalID(date);
}

/** "2026-08" */
export function monthKey(d: Date | string | number): string {
  const date = new Date(d);
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
}

/** "Agu 26" */
export function shortMonthLabel(d: Date | string | number): string {
  const date = new Date(d);
  return `${BULAN_SHORT[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`;
}

/** "2026-08" -> "Agustus 2026" */
export function periodeLabel(p: string): string {
  const [y, m] = p.split("-").map(Number);
  if (!y || !m) return p;
  return `${BULAN_ID[m - 1]} ${y}`;
}

/** 081200000055 -> 08********55 */
export function maskPhone(p?: string | null): string {
  if (!p) return "-";
  if (p.length <= 4) return p;
  return p.slice(0, 2) + "*".repeat(Math.max(4, p.length - 4)) + p.slice(-2);
}

/** 0812... -> 62812... */
export function toWaNumber(p?: string | null): string {
  if (!p) return "";
  let s = p.replace(/[^\d]/g, "");
  if (s.startsWith("0")) s = "62" + s.slice(1);
  return s;
}

export function initials(name?: string | null): string {
  if (!name) return "?";
  const clean = name.replace(/^(Bapak|Ibu|H\.|Hj\.)\s+/i, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function pct(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function daysBetween(a: Date | string, b: Date | string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}
