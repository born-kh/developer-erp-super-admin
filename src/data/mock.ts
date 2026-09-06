export type Company = {
  id: string;
  name: string;
  city: string;
  package: "basic" | "pro";
  status: "active" | "trial" | "suspended";
  image: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
  description: string;
};

export const cities = [
  "Ташкент",
  "Самарканд",
  "Бухара",
  "Фергана",
  "Наманган",
  "Андижан",
  "Хива",
  "Нукус",
  "Карши",
  "Термез",
  "Джизак",
  "Гулистан",
  "Ургенч",
  "Коканд",
];

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

export type Region = {
  id: string;
  name: string;
  description?: string;
};

export const regions: Region[] = [
  { id: "tashkent-region", name: "Ташкентская область", description: "Область, окружающая столицу Ташкент." },
  { id: "samarkand-region", name: "Самаркандская область", description: "Область с центром в городе Самарканд." },
  { id: "bukhara-region", name: "Бухарская область", description: "Область с центром в городе Бухара." },
  {
    id: "fergana-region",
    name: "Ферганская область",
    description: "Область в Ферганской долине с центром в городе Фергана.",
  },
  {
    id: "namangan-region",
    name: "Наманганская область",
    description: "Область в Ферганской долине с центром в городе Наманган.",
  },
  {
    id: "andijan-region",
    name: "Андижанская область",
    description: "Область в Ферганской долине с центром в городе Андижан.",
  },
  {
    id: "khorezm-region",
    name: "Хорезмская область",
    description: "Область на северо-западе страны с центром в городе Ургенч.",
  },
  {
    id: "karakalpakstan",
    name: "Республика Каракалпакстан",
    description: "Автономная республика на северо-западе Узбекистана с центром в городе Нукус.",
  },
  {
    id: "kashkadarya-region",
    name: "Кашкадарьинская область",
    description: "Область на юге страны с центром в городе Карши.",
  },
  {
    id: "surkhandarya-region",
    name: "Сурхандарьинская область",
    description: "Область на юге страны с центром в городе Термез.",
  },
  { id: "jizzakh-region", name: "Джизакская область", description: "Область с центром в городе Джизак." },
  { id: "syrdarya-region", name: "Сырдарьинская область", description: "Область с центром в городе Гулистан." },
];

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

export const companies: Company[] = [
  {
    id: "oxa",
    name: "OXA Construction",
    city: "Ташкент",
    package: "basic",
    status: "active",
    image: "https://picsum.photos/seed/oxa/480/320",
    phone: "+998 71 200 10 10",
    email: "info@oxa.uz",
    address: "г. Ташкент, Мирзо-Улугбекский р-н, ул. Амира Темура, 45",
    createdAt: "2023-02-14",
    description: "Девелопер жилых комплексов бизнес-класса. Использует Basic-пакет для продаж и шахматки.",
  },
  {
    id: "demo",
    name: "Nur Build Group",
    city: "Самарканд",
    package: "basic",
    status: "trial",
    image: "https://picsum.photos/seed/demo/480/320",
    phone: "+998 66 233 44 55",
    email: "owner@nurbuild.uz",
    address: "г. Самарканд, ул. Регистан, 12",
    createdAt: "2024-06-01",
    description: "Пробный период. Строительная компания среднего сегмента, тестирует модуль продаж.",
  },
  {
    id: "buxara-1",
    name: "Buxoro Uy Qurilish",
    city: "Бухара",
    package: "pro",
    status: "active",
    image: "https://picsum.photos/seed/buxara-1/480/320",
    phone: "+998 65 224 10 20",
    email: "office@buxorouy.uz",
    address: "г. Бухара, ул. Бахоуддина Накшбанди, 8",
    createdAt: "2022-11-03",
    description: "Крупный застройщик региона, использует складской и закупочный модули.",
  },
  {
    id: "fergana-1",
    name: "Fergana Homes",
    city: "Фергана",
    package: "basic",
    status: "active",
    image: "https://picsum.photos/seed/fergana-1/480/320",
    phone: "+998 73 244 30 12",
    email: "sales@ferganahomes.uz",
    address: "г. Фергана, ул. Мустакиллик, 21",
    createdAt: "2023-08-19",
    description: "Малоэтажное строительство, отдел продаж на два города.",
  },
  {
    id: "namangan-1",
    name: "Namangan Invest Qurilish",
    city: "Наманган",
    package: "pro",
    status: "suspended",
    image: "https://picsum.photos/seed/namangan-1/480/320",
    phone: "+998 69 227 55 61",
    email: "admin@ninq.uz",
    address: "г. Наманган, пр. Атабекова, 3",
    createdAt: "2022-04-27",
    description: "Аккаунт приостановлен: истёк срок оплаты пакета Pro.",
  },
  {
    id: "andijan-1",
    name: "Andijon Uylari",
    city: "Андижан",
    package: "basic",
    status: "active",
    image: "https://picsum.photos/seed/andijan-1/480/320",
    phone: "+998 74 223 90 00",
    email: "info@andijonuylari.uz",
    address: "г. Андижан, ул. Бабура, 56",
    createdAt: "2023-12-05",
    description: "Небольшой застройщик, две площадки в активной продаже.",
  },
  {
    id: "xiva-1",
    name: "Xiva Ota Meros",
    city: "Хива",
    package: "basic",
    status: "trial",
    image: "https://picsum.photos/seed/xiva-1/480/320",
    phone: "+998 62 375 12 44",
    email: "hello@xivaotameros.uz",
    address: "г. Хива, ул. Ичан-Кала, 2",
    createdAt: "2024-11-20",
    description: "Новый клиент, подключён на пробный период две недели назад.",
  },
  {
    id: "nukus-1",
    name: "Nukus Qurilish Servis",
    city: "Нукус",
    package: "pro",
    status: "active",
    image: "https://picsum.photos/seed/nukus-1/480/320",
    phone: "+998 61 222 18 09",
    email: "office@nqs.uz",
    address: "г. Нукус, пр. Дустлик, 14",
    createdAt: "2023-05-30",
    description: "Использует полный пакет модулей, включая подрядчиков и закупки.",
  },
  {
    id: "qarshi-1",
    name: "Qarshi Yangi Uy",
    city: "Карши",
    package: "basic",
    status: "active",
    image: "https://picsum.photos/seed/qarshi-1/480/320",
    phone: "+998 75 225 61 30",
    email: "sales@qarshiyangiuy.uz",
    address: "г. Карши, ул. Мустакиллик, 100",
    createdAt: "2023-09-11",
    description: "Три объекта в продаже, стабильный оборот платежей.",
  },
  {
    id: "termez-1",
    name: "Termiz Bunyodkor",
    city: "Термез",
    package: "basic",
    status: "suspended",
    image: "https://picsum.photos/seed/termez-1/480/320",
    phone: "+998 76 226 40 18",
    email: "info@termizbunyodkor.uz",
    address: "г. Термез, ул. Алпомиш, 9",
    createdAt: "2022-07-02",
    description: "Аккаунт приостановлен по запросу компании на реорганизацию.",
  },
  {
    id: "jizzax-1",
    name: "Jizzax Turar Joy",
    city: "Джизак",
    package: "pro",
    status: "active",
    image: "https://picsum.photos/seed/jizzax-1/480/320",
    phone: "+998 72 226 77 40",
    email: "office@jizzaxtj.uz",
    address: "г. Джизак, ул. Шарк Юлдузи, 5",
    createdAt: "2023-03-22",
    description: "Активно расширяется, недавно перешла на пакет Pro.",
  },
  {
    id: "guliston-1",
    name: "Guliston Qurilish Kompaniyasi",
    city: "Гулистан",
    package: "basic",
    status: "trial",
    image: "https://picsum.photos/seed/guliston-1/480/320",
    phone: "+998 67 225 33 21",
    email: "hello@gqk.uz",
    address: "г. Гулистан, ул. Мустакиллик, 30",
    createdAt: "2024-08-14",
    description: "Пробный период, оценивает удобство шахматки продаж.",
  },
  {
    id: "urganch-1",
    name: "Urganch Yangi Shahar",
    city: "Ургенч",
    package: "basic",
    status: "active",
    image: "https://picsum.photos/seed/urganch-1/480/320",
    phone: "+998 62 226 15 90",
    email: "sales@uys.uz",
    address: "г. Ургенч, ул. Ал-Хорезми, 18",
    createdAt: "2023-10-08",
    description: "Средний темп продаж, использует базовый пакет уже второй год.",
  },
  {
    id: "kokand-1",
    name: "Qo'qon Zamin Qurilish",
    city: "Коканд",
    package: "pro",
    status: "active",
    image: "https://picsum.photos/seed/kokand-1/480/320",
    phone: "+998 73 553 20 11",
    email: "info@qzq.uz",
    address: "г. Коканд, ул. Мукими, 7",
    createdAt: "2022-09-16",
    description: "Один из самых давних клиентов платформы, полный пакет модулей.",
  },
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
