export type Company = {
  id: string;
  name: string;
  city: string;
  package: "basic" | "pro";
  status: "active" | "trial" | "suspended";
};

export type PlatformUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
};

export type PackagePlan = {
  id: "basic" | "pro";
  name: string;
  price: number;
  active: boolean;
  modules: string[];
};

export const packages: PackagePlan[] = [
  {
    id: "basic",
    name: "Basic",
    price: 99,
    active: true,
    modules: ["Шахматка", "Отдел продаж", "Календарь платежей", "Администратор", "Dashboard и отчёты"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 249,
    active: false,
    modules: ["Всё из Basic", "Склад", "Закупки", "Подрядчики"],
  },
];

export const companies: Company[] = [
  { id: "oxa", name: "OXA Construction", city: "Ташкент", package: "basic", status: "active" },
  { id: "demo", name: "Nur Build Group", city: "Самарканд", package: "basic", status: "trial" },
];

export const users: PlatformUser[] = [
  { id: "u1", name: "Азиз Рахимов", email: "aziz@oxa.uz", role: "owner", companyId: "oxa" },
  { id: "u2", name: "Нилуфар Саидова", email: "nilufar@oxa.uz", role: "admin", companyId: "oxa" },
  { id: "u3", name: "Жасур Каримов", email: "jasur@oxa.uz", role: "sales", companyId: "oxa" },
  { id: "u4", name: "Мадина Юсупова", email: "madina@oxa.uz", role: "cashier", companyId: "oxa" },
  { id: "u6", name: "Demo Owner", email: "owner@nurbuild.uz", role: "owner", companyId: "demo" },
  { id: "u7", name: "Саодат Каримова", email: "saodat@nurbuild.uz", role: "sales", companyId: "demo" },
];

export const roleCards = [
  { title: "Super Admin", text: "Создание компаний, тарифы, глобальные пользователи" },
  { title: "Админ компании", text: "Здания, роли внутри пакета, сотрудники своей компании" },
  { title: "Продажи", text: "Шахматка, бронь, договоры, покупатели" },
  { title: "Касса", text: "Приём платежей, календарь, история оплат" },
];
