const DATE_LOCALES: Record<string, string> = { ru: "ru-RU", en: "en-US", tj: "tg-TJ" };

// Browsers ship no ICU data for "tg"/"tg-TJ", so Intl silently falls back to en-US.
// Tajik month names are spelled out manually instead of relying on Intl for them.
const TJ_MONTHS_SHORT = ["янв.", "фев.", "мар.", "апр.", "май", "июн.", "июл.", "авг.", "сен.", "окт.", "ноя.", "дек."];
const TJ_MONTHS_LONG = [
  "январ",
  "феврал",
  "март",
  "апрел",
  "май",
  "июн",
  "июл",
  "август",
  "сентябр",
  "октябр",
  "ноябр",
  "декабр",
];

function monthShort(date: Date, language: string) {
  if (language === "tj") return TJ_MONTHS_SHORT[date.getMonth()];
  return new Intl.DateTimeFormat(DATE_LOCALES[language] ?? language, { month: "short" }).format(date);
}

export function formatDateTime(iso: string, language: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const locale = DATE_LOCALES[language] ?? language;
  const datePart = `${date.getDate()} ${monthShort(date, language)}`;
  const timePart = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  return `${datePart} ${date.getFullYear()}, ${timePart}`;
}

export function formatDate(iso: string, language: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  if (language === "tj") return `${date.getDate()} ${TJ_MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
  return new Intl.DateTimeFormat(DATE_LOCALES[language] ?? language, {
    dateStyle: "long",
  }).format(date);
}

export function formatTime(iso: string, language: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(DATE_LOCALES[language] ?? language, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export const usd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export const formatMoney = (n: number, currencyCode?: string | null) =>
  `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)} ${currencyCode || "USD"}`;

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "",
  э: "e", ю: "yu", я: "ya", ў: "o", қ: "q", ғ: "g", ҳ: "h",
};

const transliterate = (text: string) =>
  text
    .toLowerCase()
    .split("")
    .map((ch) => CYRILLIC_TO_LATIN[ch] ?? ch)
    .join("");

export const slugify = (text: string) =>
  transliterate(text)
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

export const randomPassword = (length = 10) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};
