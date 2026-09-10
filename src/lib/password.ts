import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password, salt, 64, options, (error, result) => error ? reject(error) : resolve(result)));
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = await derive(password, salt);
  return `scrypt-v1$${salt}$${hash.toString("hex")}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [version, salt, encoded] = stored.split("$");
  if (version !== "scrypt-v1" || !/^[a-f0-9]{32}$/.test(salt ?? "") || !/^[a-f0-9]{128}$/.test(encoded ?? "")) {
    // Same expensive path even for an unknown username or a malformed hash.
    await derive(password, "00000000000000000000000000000000");
    return false;
  }
  const actual = await derive(password, salt);
  const expected = Buffer.from(encoded, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function validPassword(password: string) {
  return password.length >= 10 && password.length <= 128 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}
