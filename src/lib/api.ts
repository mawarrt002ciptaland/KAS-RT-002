const configuredBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const API_BASE = configuredBase
  ? configuredBase.replace(/\/$/, "")
  : import.meta.env.DEV
    ? "http://localhost:8787"
    : "";
const API_BASE_STORAGE = "rt002-api-base-session";
const NEON_DATA_API_STORAGE = "rt002-neon-data-api-url";
const BUILD_NEON_DATA_API_URL = (import.meta.env.VITE_NEON_DATA_API_URL as string | undefined)?.trim() ?? "";

export function getNeonDataApiUrl(): string {
  try {
    return localStorage.getItem(NEON_DATA_API_STORAGE) ?? BUILD_NEON_DATA_API_URL;
  } catch {
    return BUILD_NEON_DATA_API_URL;
  }
}

export function setNeonDataApiUrl(value: string): boolean {
  try {
    const url = value.trim().replace(/\/$/, "");
    if (url) localStorage.setItem(NEON_DATA_API_STORAGE, url);
    else localStorage.removeItem(NEON_DATA_API_STORAGE);
    return true;
  } catch {
    return false;
  }
}
export function getAdminApiBase(): string {
  try {
    return sessionStorage.getItem(API_BASE_STORAGE) ?? "";
  } catch {
    return "";
  }
}

export function setAdminApiBase(value: string): boolean {
  try {
    const base = value.trim().replace(/\/$/, "");
    if (!base) sessionStorage.removeItem(API_BASE_STORAGE);
    else sessionStorage.setItem(API_BASE_STORAGE, base);
    return true;
  } catch {
    return false;
  }
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  const base = getAdminApiBase() || API_BASE;
  try {
    response = await fetch(`${base}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
      cache: "no-store",
      signal: init?.signal ?? AbortSignal.timeout(15000),
    });
  } catch {
    throw new ApiError("Server data belum terhubung.", 0);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new ApiError("Alamat ini menyajikan website, bukan API Neon. Masukkan Neon Data API URL atau deploy backend API.", response.status);
  }

  const payload = await response.json().catch(() => null) as { error?: string } | null;
  if (!response.ok) {
    throw new ApiError(payload?.error || "Data belum dapat dimuat.", response.status);
  }
  return payload as T;
}