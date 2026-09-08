export type PlatformUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  phone?: string;
  login?: string;
  password?: string;
  image?: string;
};

export const income = {
  thisMonth: 4820,
  lastMonth: 4120,
};

export type CityItem = {
  id: string;
  name: string;
  regionId: string;
  description?: string;
};

export const cityCatalog: CityItem[] = [
  { id: "tashkent", name: "Ташкент", regionId: "tashkent-region", description: "Столица Узбекистана." },
  {
    id: "samarkand",
    name: "Самарканд",
    regionId: "samarkand-region",
    description: "Древний город на Великом шёлковом пути.",
  },
  { id: "bukhara", name: "Бухара", regionId: "bukhara-region", description: "Город с богатым историческим центром." },
  { id: "fergana", name: "Фергана", regionId: "fergana-region", description: "Административный центр Ферганской области." },
  {
    id: "namangan",
    name: "Наманган",
    regionId: "namangan-region",
    description: "Административный центр Наманганской области.",
  },
  {
    id: "andijan",
    name: "Андижан",
    regionId: "andijan-region",
    description: "Административный центр Андижанской области.",
  },
  { id: "khiva", name: "Хива", regionId: "khorezm-region", description: "Город-музей под открытым небом." },
  { id: "nukus", name: "Нукус", regionId: "karakalpakstan", description: "Столица Республики Каракалпакстан." },
  {
    id: "karshi",
    name: "Карши",
    regionId: "kashkadarya-region",
    description: "Административный центр Кашкадарьинской области.",
  },
  {
    id: "termez",
    name: "Термез",
    regionId: "surkhandarya-region",
    description: "Административный центр Сурхандарьинской области.",
  },
  {
    id: "jizzakh",
    name: "Джизак",
    regionId: "jizzakh-region",
    description: "Административный центр Джизакской области.",
  },
  {
    id: "gulistan",
    name: "Гулистан",
    regionId: "syrdarya-region",
    description: "Административный центр Сырдарьинской области.",
  },
  {
    id: "urgench",
    name: "Ургенч",
    regionId: "khorezm-region",
    description: "Административный центр Хорезмской области.",
  },
  { id: "kokand", name: "Коканд", regionId: "fergana-region", description: "Один из крупных городов Ферганской долины." },
];

export const users: PlatformUser[] = [
  { id: "u1", name: "Азиз Рахимов", email: "aziz@oxa.uz", role: "owner", companyId: "oxa" },
  { id: "u2", name: "Нилуфар Саидова", email: "nilufar@oxa.uz", role: "admin", companyId: "oxa" },
  { id: "u3", name: "Жасур Каримов", email: "jasur@oxa.uz", role: "sales", companyId: "oxa" },
  { id: "u4", name: "Мадина Юсупова", email: "madina@oxa.uz", role: "cashier", companyId: "oxa" },
  { id: "u6", name: "Demo Owner", email: "owner@nurbuild.uz", role: "owner", companyId: "demo" },
  { id: "u7", name: "Саодат Каримова", email: "saodat@nurbuild.uz", role: "sales", companyId: "demo" },
];
