import { useMemo, useState } from "react";
import { Send, MessageCircle, Copy, Users, CheckSquare, Square, ExternalLink, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/data/store";
import { useLoadState, usePendingSearch } from "@/hooks";
import { RT_INFO } from "@/lib/constants";
import { maskPhone, toWaNumber, formatRupiah, periodeLabel } from "@/lib/format";
import { cn, openWhatsApp, copyText } from "@/lib/utils";
import { Button, Textarea, Tabs, Field, Badge } from "@/components/ui";
import { PageHeader, SectionTitle, ErrorState, ListSkeleton, Avatar, SearchInput } from "@/components/shared";

type Filter = "semua" | "warga" | "pengurus" | "menunggak";

const TEMPLATES = [
  { key: "iuran", label: "Pengingat Iuran", text: "Assalamu'alaikum Wr. Wb.\n\nYth. {nama} ({rumah}),\nKami mengingatkan pembayaran iuran bulan ini sebesar {iuran}. Pembayaran dapat dilakukan tunai ke Bendahara, transfer {bank}, atau QRIS.\n\nTerima kasih atas partisipasinya 🙏\nPengurus RT 002 Blok Mawar" },
  { key: "rapat", label: "Undangan Rapat", text: "Yth. Bapak/Ibu {nama},\n\nMengundang seluruh warga RT 002 Blok Mawar untuk hadir pada Pertemuan Rutin Warga:\n📅 Hari/Tanggal: ……\n⏰ Pukul: 20.00 WIB\n📍 Tempat: Pos RT 002\n\nMohon kehadirannya. Terima kasih.\nPengurus RT 002" },
  { key: "kerja_bakti", label: "Kerja Bakti", text: "Yth. Bapak/Ibu {nama},\n\nMari bergotong royong! Kerja bakti bersih lingkungan Blok Mawar akan dilaksanakan pada:\n📅 Senin, 24 Agustus 2026\n⏰ 07.00 WIB\n📍 Sepanjang Jalan Mawar\n\nBawa alat kebersihan masing-masing ya 💪\nPengurus RT 002" },
  { key: "pengumuman", label: "Pengumuman Umum", text: "📢 *PENGUMUMAN RT 002 BLOK MAWAR*\n\nYth. Bapak/Ibu {nama},\n\n……\n\nDemikian disampaikan, terima kasih.\nPengurus RT 002 RW 014" },
];

export default function WhatsappView() {
  const warga = useData((s) => s.warga);
  const tagihan = useData((s) => s.tagihan);
  const pengaturan = useData((s) => s.pengaturan);
  const { loading, error, refetch } = useLoadState();
  const seeded = usePendingSearch("whatsapp");
  const [filter, setFilter] = useState<Filter>("semua");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [tpl, setTpl] = useState(seeded ? "" : "iuran");
  const [msg, setMsg] = useState(seeded || TEMPLATES[0].text);
  const [sent, setSent] = useState<string[]>([]);

  const menunggak = useMemo(() => new Set(tagihan.filter((t) => t.status !== "lunas").map((t) => t.wargaId)), [tagihan]);
  const candidates = useMemo(() => { const s = q.trim().toLowerCase(); return warga.filter((w) => w.telepon && w.status === "aktif").filter((w) => filter === "semua" || (filter === "menunggak" ? menunggak.has(w.id) : w.role === filter)).filter((w) => !s || w.nama.toLowerCase().includes(s) || w.noRumah.toLowerCase().includes(s)); }, [warga, filter, q, menunggak]);
  const allSelected = candidates.length > 0 && candidates.every((c) => selected.includes(c.id));
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  function personalize(text: string, w: (typeof warga)[number]) {
    const tunggakan = tagihan.filter((t) => t.wargaId === w.id && t.status !== "lunas");
    const iuran = tunggakan.length ? `${formatRupiah(tunggakan.reduce((a, t) => a + t.jumlah + t.denda, 0))} (${tunggakan.map((t) => periodeLabel(t.periode)).join(", ")})` : formatRupiah(Number(pengaturan.iuran_bulanan) || 25000);
    return text.replace(/{nama}/g, w.nama).replace(/{rumah}/g, w.noRumah).replace(/{iuran}/g, iuran).replace(/{bank}/g, `${pengaturan.bank_nama} ${pengaturan.bank_rekening} a.n. ${pengaturan.bank_pemilik}`);
  }
  function kirim(w: (typeof warga)[number]) { openWhatsApp(toWaNumber(w.telepon), personalize(msg, w)); setSent((s) => Array.from(new Set([...s, w.id]))); }
  function kirimSemua() {
    const targets = candidates.filter((c) => selected.includes(c.id));
    if (!targets.length) return toast.error("Pilih penerima terlebih dahulu");
    if (!msg.trim()) return toast.error("Pesan tidak boleh kosong");
    kirim(targets[0]);
    toast.success(targets.length > 1 ? `WhatsApp dibuka untuk ${targets[0].nama}. Lanjutkan penerima lain dengan tombol "Buka".` : `WhatsApp dibuka untuk ${targets[0].nama}`);
  }

  return (
    <div className="space-y-5">
      <PageHeader title="WhatsApp Broadcast" description="Kirim pesan massal ke warga RT 002 via WhatsApp" icon={<Send className="h-5 w-5" />} />
      {loading ? <ListSkeleton /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Composer */}
          <div className="space-y-4 lg:col-span-3">
            <div className="flex items-center gap-3 rounded-xl border bg-[#25D366]/10 p-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white"><MessageCircle className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">Admin RT 002</p><p className="text-xs text-muted-foreground">+{pengaturan.whatsapp_admin || RT_INFO.whatsappAdmin}</p></div><Button variant="whatsapp" size="sm" onClick={() => openWhatsApp(pengaturan.whatsapp_admin || RT_INFO.whatsappAdmin, RT_INFO.pesanAduan)}>Chat</Button></div>
            <div className="rounded-xl border bg-card p-4">
              <SectionTitle title="Template Pesan" />
              <Tabs value={tpl} onChange={(k) => { setTpl(k); const t = TEMPLATES.find((x) => x.key === k); if (t) setMsg(t.text); }} size="sm" items={TEMPLATES.map((t) => ({ value: t.key, label: t.label }))} />
              <Field label="Isi pesan" htmlFor="wa-msg" hint="Variabel: {nama}, {rumah}, {iuran}, {bank} akan diganti otomatis per penerima." className="mt-3"><Textarea id="wa-msg" rows={9} value={msg} onChange={(e) => { setMsg(e.target.value); setTpl(""); }} /></Field>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" leftIcon={<Copy className="h-4 w-4" />} onClick={async () => { (await copyText(msg)) ? toast.success("Pesan disalin") : toast.error("Gagal menyalin"); }}>Salin Pesan</Button>
                <Button variant="whatsapp" className="flex-1" leftIcon={<Send className="h-4 w-4" />} onClick={kirimSemua}>Kirim via WhatsApp ({selected.length})</Button>
              </div>
            </div>
            {selected.length > 0 && (
              <div className="rounded-xl border bg-card p-4">
                <SectionTitle title={`Penerima terpilih (${selected.length})`} action={<span className="text-xs text-muted-foreground">{sent.length} terkirim</span>} />
                <ul className="divide-y">
                  {warga.filter((w) => selected.includes(w.id)).map((w) => (
                    <li key={w.id} className="flex items-center gap-3 py-2"><Avatar name={w.nama} size="sm" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{w.nama}</span><span className="block text-xs text-muted-foreground">{w.noRumah} • {maskPhone(w.telepon)}</span></span>{sent.includes(w.id) ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-success"><CheckCircle2 className="h-4 w-4" />Dibuka</span> : <Button size="sm" variant="outline" leftIcon={<ExternalLink className="h-3.5 w-3.5" />} onClick={() => kirim(w)}>Buka</Button>}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recipients */}
          <div className="rounded-xl border bg-card p-4 lg:col-span-2">
            <SectionTitle title="Pilih Penerima" action={<Badge tone="primary"><Users className="mr-1 h-3 w-3" />{candidates.length}</Badge>} />
            <Tabs value={filter} onChange={setFilter} size="sm" items={[{ value: "semua", label: "Semua" }, { value: "warga", label: "Warga" }, { value: "pengurus", label: "Pengurus" }, { value: "menunggak", label: "Menunggak", count: warga.filter((w) => menunggak.has(w.id)).length }]} />
            <div className="mt-3"><SearchInput value={q} onChange={setQ} placeholder="Cari nama / no. rumah" /></div>
            <div className="mt-3 flex gap-2"><Button size="sm" variant="soft" onClick={() => setSelected(allSelected ? selected.filter((id) => !candidates.some((c) => c.id === id)) : Array.from(new Set([...selected, ...candidates.map((c) => c.id)])))}>{allSelected ? "Kosongkan" : "Pilih Semua"}</Button>{selected.length > 0 && <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Reset</Button>}</div>
            <ul className="mt-3 max-h-[420px] divide-y overflow-y-auto scrollbar-thin">
              {candidates.map((w) => { const on = selected.includes(w.id); return (
                <li key={w.id}>
                  <button onClick={() => toggle(w.id)} aria-pressed={on} className={cn("flex min-h-[52px] w-full items-center gap-3 py-2 text-left", on && "bg-primary/5")}>
                    {on ? <CheckSquare className="h-5 w-5 shrink-0 text-primary" /> : <Square className="h-5 w-5 shrink-0 text-muted-foreground" />}
                    <Avatar name={w.nama} size="sm" />
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{w.nama}</span><span className="block text-xs text-muted-foreground">{w.noRumah} • {maskPhone(w.telepon)}</span></span>
                    {menunggak.has(w.id) && <Badge tone="warning">Menunggak</Badge>}
                  </button>
                </li>
              ); })}
              {candidates.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">Tidak ada penerima</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
