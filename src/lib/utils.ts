export { cn } from "@/utils/cn";

/** Simple unique id */
export function uid(prefix = ""): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Deterministic PRNG (mulberry32) */
export function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Open WhatsApp (app on mobile, web on desktop) */
export function openWhatsApp(number: string, message?: string) {
  const n = number.replace(/[^\d]/g, "");
  const url = `https://wa.me/${n}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
  const w = window.open(url, "_blank", "noopener,noreferrer");
  if (!w) window.location.href = url;
}

export function openExternal(url: string) {
  const w = window.open(url, "_blank", "noopener,noreferrer");
  if (!w) window.location.href = url;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
}

export async function shareContent(data: { title: string; text: string; url?: string }): Promise<"shared" | "copied" | "failed"> {
  try {
    if (typeof navigator !== "undefined" && "share" in navigator && navigator.canShare?.({ text: data.text })) {
      await navigator.share(data);
      return "shared";
    }
  } catch (e) {
    if ((e as Error).name === "AbortError") return "failed";
  }
  const ok = await copyText(`${data.title}\n${data.text}${data.url ? `\n${data.url}` : ""}`);
  return ok ? "copied" : "failed";
}

export function downloadBlob(filename: string, content: BlobPart, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadCSV(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const s = String(v ?? "");
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.map(esc).join(";"), ...rows.map((r) => r.map(esc).join(";"))].join("\n");
  downloadBlob(filename, "\uFEFF" + csv, "text/csv;charset=utf-8");
}

/** Open a printable document in a new window (escapes modal overflow); falls back to blob download */
export function printHtmlDocument(title: string, html: string, filenameFallback: string) {
  const doc = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body>${html}</body></html>`;
  const w = window.open("", "_blank");
  if (w) {
    w.document.open();
    w.document.write(doc);
    w.document.close();
    w.focus();
    setTimeout(() => {
      try { w.print(); } catch { /* ignore */ }
    }, 400);
    return "opened" as const;
  }
  downloadBlob(filenameFallback, doc, "text/html;charset=utf-8");
  return "downloaded" as const;
}

/** Read file as data URL */
export function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/** Compress image to max dimension (keeps localStorage light) */
export async function compressImage(file: File, maxDim = 1200, quality = 0.8): Promise<string> {
  const dataUrl = await readAsDataURL(file);
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") return dataUrl;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function isValidUrl(s: string) {
  return /^https?:\/\/.+/i.test(s.trim());
}

export function clampText(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export function escapeHtml(s: string | number | null | undefined) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}
