"use client";

const TOKEN_KEY = "kasrt_token";

// Token di memori — selalu berfungsi walau localStorage/cookie diblokir
// (navigasi Next.js App Router bersifat client-side, module state bertahan)
let memoryToken: string | null = null;

export function getToken(): string | null {
  if (memoryToken) return memoryToken;
  if (typeof window === "undefined") return null;
  try {
    const t = window.localStorage.getItem(TOKEN_KEY);
    if (t) {
      memoryToken = t;
      return t;
    }
  } catch {
    // localStorage diblokir
  }
  try {
    const t = window.sessionStorage.getItem(TOKEN_KEY);
    if (t) {
      memoryToken = t;
      return t;
    }
  } catch {
    // sessionStorage diblokir
  }
  return null;
}

export function setToken(token: string) {
  memoryToken = token;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // diblokir — tidak masalah, memori tetap jalan
  }
  try {
    window.sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // diblokir
  }
}

export function clearToken() {
  memoryToken = null;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
  try {
    window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

// Buat credential token yang diverifikasi server per-request.
// Tidak butuh membaca respons login sama sekali — hanya status code.
export function makeCredToken(username: string, password: string): string {
  const raw = `${username.toLowerCase().trim()}:${password}`;
  // base64 unicode-safe
  const b64 = btoa(unescape(encodeURIComponent(raw)));
  return `cred.${b64}`;
}

export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  let finalUrl = url;
  if (token) {
    // 3 jalur sekaligus — tahan terhadap proxy yang menghapus header:
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("x-auth-token", token);
    // Query param tidak mungkin disaring proxy
    const sep = url.includes("?") ? "&" : "?";
    finalUrl = `${url}${sep}_auth=${encodeURIComponent(token)}`;
  }
  return fetch(finalUrl, { ...options, headers });
}
