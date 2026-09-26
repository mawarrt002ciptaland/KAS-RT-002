const configuredBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const API_BASE = configuredBase
  ? configuredBase.replace(/\/$/, "")
  : import.meta.env.DEV
    ? "http://localhost:8787"
    : "";
const API_KEY_STORAGE = "rt002-api-key-session";

export function getAdminApiKey(): string {
  try {
    return sessionStorage.getItem(API_KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}

export function setAdminApiKey(value: string): boolean {
  try {
    if (value.trim()) sessionStorage.setItem(API_KEY_STORAGE, value.trim());
    else sessionStorage.removeItem(API_KEY_STORAGE);
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
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(getAdminApiKey() ? { "X-RT-Admin-Key": getAdminApiKey() } : {}),
        ...init?.headers,
      },
      cache: "no-store",
      signal: init?.signal ?? AbortSignal.timeout(15000),
    });
  } catch {
    throw new ApiError("Server data belum terhubung.", 0);
  }

  const payload = await response.json().catch(() => null) as { error?: string } | null;
  if (!response.ok) {
    throw new ApiError(payload?.error || "Data belum dapat dimuat.", response.status);
  }
  return payload as T;
}