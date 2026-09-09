const residentNames = [
  ["Budi Santoso","Blok Mawar A1 No. 02","0812-3456-7801",4],
  ["Siti Aminah","Blok Mawar A1 No. 03","0813-7721-8920",3],
  ["Agus Setiawan","Blok Mawar A2 No. 05","0857-1180-2341",5],
  ["Dewi Lestari","Blok Mawar A2 No. 06","0821-3320-7814",2],
  ["Hendra Wijaya","Blok Mawar B1 No. 01","0819-8812-6604",4],
  ["Rina Marlina","Blok Mawar B1 No. 04","0812-9011-2877",3],
  ["Dedi Kurniawan","Blok Mawar B2 No. 07","0878-4500-1192",6],
  ["Nina Kartika","Blok Mawar B2 No. 08","0852-2190-3378",2],
  ["Eko Prasetyo","Blok Mawar C1 No. 02","0813-7622-0019",4],
  ["Maya Permata","Blok Mawar C1 No. 05","0822-7891-2045",3],
  ["Rudi Hartono","Blok Mawar C2 No. 03","0817-5002-8811",5],
  ["Putri Ananda","Blok Mawar C2 No. 09","0896-1270-5513",2],
] as const;

export const fallbackResidents = residentNames.map((resident, index) => ({
  id: index + 1,
  nik: `32730112018${index}00${String(index + 1).padStart(2,"0")}`,
  name: resident[0],
  address: resident[1],
  phone: resident[2],
  familyMembers: resident[3],
  status: "aktif" as const,
  joinedAt: "2021-01-15",
  createdAt: "2021-01-15T00:00:00.000Z",
}));

const transactionValues = [
  [12,"masuk","Iuran Bulanan","Pembayaran awal April",450000,"2026-04-06"],
  [11,"keluar","Keamanan","Perawatan portal keamanan",240000,"2026-03-16"],
  [10,"masuk","Iuran Sampah","Iuran sampah Maret",275000,"2026-03-10"],
  [9,"masuk","Iuran Bulanan","Pembayaran iuran warga Maret",750000,"2026-03-08"],
  [8,"keluar","Kebersihan","Peralatan kerja bakti",185000,"2026-02-22"],
  [7,"keluar","Fasilitas","Perbaikan lampu jalan Blok B",375000,"2026-02-18"],
  [6,"masuk","Dana Sosial","Dana sosial warga Februari",220000,"2026-02-14"],
  [5,"masuk","Iuran Bulanan","Pembayaran iuran warga Februari",825000,"2026-02-09"],
  [4,"keluar","Keamanan","Operasional ronda malam",300000,"2026-01-28"],
  [3,"keluar","Kebersihan","Honor petugas kebersihan",450000,"2026-01-25"],
  [2,"masuk","Iuran Sampah","Iuran sampah Januari",300000,"2026-01-12"],
  [1,"masuk","Iuran Bulanan","Pembayaran iuran warga Januari",900000,"2026-01-08"],
] as const;

export const fallbackTransactions = transactionValues.map((item) => ({
  id: item[0], type: item[1], category: item[2], description: item[3], amount: item[4], transactionDate: item[5], createdAt: `${item[5]}T08:00:00.000Z`,
}));

export const fallbackFees = [
  { id:1, name:"Iuran Bulanan", amount:75000, description:"Operasional, keamanan, dan kebersihan lingkungan", active:true },
  { id:2, name:"Iuran Sampah", amount:25000, description:"Pengangkutan sampah rumah tangga bulanan", active:true },
  { id:3, name:"Dana Sosial", amount:20000, description:"Dana sosial dan kedukaan warga", active:true },
];

export const fallbackBills = fallbackResidents.map((resident, index) => {
  const paid = [0,1,2,4,6,7,9,11].includes(index);
  return {
    id:index + 1, residentId:resident.id, residentName:resident.name, residentAddress:resident.address,
    feeName:"Iuran Bulanan", period:"April 2026", amount:75000,
    status:(paid ? "lunas" : "belum_lunas") as "lunas"|"belum_lunas",
    dueDate:"2026-04-10", paidAt:paid ? "2026-04-06T08:00:00.000Z" : null,
  };
});
