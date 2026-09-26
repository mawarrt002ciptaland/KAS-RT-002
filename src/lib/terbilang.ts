// Indonesian number-to-words (terbilang)
const SATUAN = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];

function puluhan(n: number): string {
  if (n < 12) return SATUAN[n];
  if (n < 20) return SATUAN[n - 10] + " belas";
  const p = Math.floor(n / 10);
  const s = n % 10;
  return SATUAN[p] + " puluh" + (s ? " " + SATUAN[s] : "");
}

function ratusan(n: number): string {
  const r = Math.floor(n / 100);
  const sisa = n % 100;
  let out = "";
  if (r === 1) out = "seratus";
  else if (r > 1) out = SATUAN[r] + " ratus";
  if (sisa) out += (out ? " " : "") + puluhan(sisa);
  return out;
}

export function terbilang(n: number): string {
  const v = Math.floor(Math.abs(n));
  if (v === 0) return "nol";
  const units: [number, string][] = [
    [1_000_000_000_000, "triliun"],
    [1_000_000_000, "miliar"],
    [1_000_000, "juta"],
    [1_000, "ribu"],
  ];
  const parts: string[] = [];
  let rest = v;
  for (const [val, name] of units) {
    const q = Math.floor(rest / val);
    if (q) {
      if (val === 1000 && q === 1) parts.push("seribu");
      else parts.push(ratusan(q) + " " + name);
      rest %= val;
    }
  }
  if (rest) parts.push(ratusan(rest));
  return (n < 0 ? "minus " : "") + parts.join(" ");
}

export function terbilangRupiah(n: number): string {
  const t = terbilang(n);
  return t.charAt(0).toUpperCase() + t.slice(1) + " rupiah";
}
