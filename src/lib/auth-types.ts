export type SessionUser = { id: number; username: string; name: string; role: "admin" | "warga"; residentId: number | null };
export type AuthStatus = { ready: boolean; hasAdmin: boolean; setupEnabled: boolean };
export const roleLabel = (role: SessionUser["role"]) => role === "admin" ? "Admin RT" : "Warga";
