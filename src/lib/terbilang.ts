const SATUAN = [
  "",
  "Satu",
  "Dua",
  "Tiga",
  "Empat",
  "Lima",
  "Enam",
  "Tujuh",
  "Delapan",
  "Sembilan",
  "Sepuluh",
  "Sebelas",
];

function toWords(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n < 12) return SATUAN[n];
  if (n < 20) return `${toWords(n - 10)} Belas`;
  if (n < 100) {
    const sisa = n % 10;
    return `${toWords(Math.floor(n / 10))} Puluh${sisa ? " " + toWords(sisa) : ""}`;
  }
  if (n < 200) {
    const sisa = n - 100;
    return `Seratus${sisa ? " " + toWords(sisa) : ""}`;
  }
  if (n < 1000) {
    const sisa = n % 100;
    return `${toWords(Math.floor(n / 100))} Ratus${sisa ? " " + toWords(sisa) : ""}`;
  }
  if (n < 2000) {
    const sisa = n - 1000;
    return `Seribu${sisa ? " " + toWords(sisa) : ""}`;
  }
  if (n < 1000000) {
    const sisa = n % 1000;
    return `${toWords(Math.floor(n / 1000))} Ribu${sisa ? " " + toWords(sisa) : ""}`;
  }
  if (n < 1000000000) {
    const sisa = n % 1000000;
    return `${toWords(Math.floor(n / 1000000))} Juta${sisa ? " " + toWords(sisa) : ""}`;
  }
  const sisa = n % 1000000000;
  return `${toWords(Math.floor(n / 1000000000))} Miliar${sisa ? " " + toWords(sisa) : ""}`;
}

export function terbilang(n: number): string {
  if (!n || n === 0) return "Nol Rupiah";
  return `${toWords(n)} Rupiah`;
}
