export type FallbackAuthUser = {
  id: number;
  nik: string | null;
  username: string;
  password: string;
  name: string;
  role: "admin" | "ketua_rt" | "bendahara" | "warga";
  phone: string;
  houseNumber: string;
  avatar: string;
};

export const FALLBACK_USERS: FallbackAuthUser[] = [
  {
    id: 1,
    nik: null,
    username: "admin",
    password: "admin123",
    name: "Administrator RT",
    role: "admin",
    phone: "081100000001",
    houseNumber: "Sekretariat",
    avatar: "AD",
  },
  {
    id: 2,
    nik: "3201140102850001",
    username: "ketuart",
    password: "ketua123",
    name: "Bambang Sudik Pamarto",
    role: "ketua_rt",
    phone: "081234567890",
    houseNumber: "M-01",
    avatar: "BP",
  },
  {
    id: 3,
    nik: "3201140504900002",
    username: "bendahara",
    password: "bendahara123",
    name: "Ahmad Suryana",
    role: "bendahara",
    phone: "081398765432",
    houseNumber: "M-03",
    avatar: "AS",
  },
  {
    id: 4,
    nik: "3201141208920003",
    username: "bayu",
    password: "warga123",
    name: "Bayu Sudik Pamarto",
    role: "warga",
    phone: "081298765431",
    houseNumber: "M-02",
    avatar: "BY",
  },
];

export function findFallbackUser(usernameOrNik: string, password: string) {
  const key = usernameOrNik.trim();
  return FALLBACK_USERS.find(
    (user) =>
      (user.username === key || (user.nik && user.nik === key)) && user.password === password
  );
}

export function toSafeSessionUser(user: FallbackAuthUser) {
  return {
    id: user.id,
    nik: user.nik,
    username: user.username,
    name: user.name,
    role: user.role,
    phone: user.phone,
    houseNumber: user.houseNumber,
    avatar: user.avatar,
  };
}
