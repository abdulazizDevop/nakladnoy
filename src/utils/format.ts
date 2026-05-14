export function formatNumber(num: number): string {
  return num.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
}

// Числительные мужского рода (рубли, миллионы) и женского (тысячи) отличаются
// только в формах «один/одна» и «два/две».
const unitsMasculine = [
  '', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять',
  'десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать',
  'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать',
];

const unitsFeminine = [
  '', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять',
  'десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать',
  'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать',
];

const tens = [
  '', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто',
];

const hundreds = [
  '', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот',
];

type Gender = 'm' | 'f';

// Согласование существительного с количеством: «1 рубль / 2 рубля / 5 рублей».
function plural(n: number, [one, few, many]: [string, string, string]): string {
  const mod100 = Math.abs(n) % 100;
  const mod10 = mod100 % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

function group(n: number, gender: Gender): string {
  if (n === 0) return '';
  const units = gender === 'f' ? unitsFeminine : unitsMasculine;
  if (n < 20) return units[n];
  if (n < 100) {
    const t = tens[Math.floor(n / 10)];
    const u = n % 10 ? ' ' + units[n % 10] : '';
    return t + u;
  }
  const h = hundreds[Math.floor(n / 100)];
  const rest = n % 100 ? ' ' + group(n % 100, gender) : '';
  return h + rest;
}

function numberToWordsHelper(n: number): string {
  if (n === 0) return '';

  const billions = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1_000);
  const rest = n % 1_000;

  const parts: string[] = [];

  if (billions > 0) {
    parts.push(
      group(billions, 'm') +
        ' ' +
        plural(billions, ['миллиард', 'миллиарда', 'миллиардов'])
    );
  }
  if (millions > 0) {
    parts.push(
      group(millions, 'm') +
        ' ' +
        plural(millions, ['миллион', 'миллиона', 'миллионов'])
    );
  }
  if (thousands > 0) {
    parts.push(
      group(thousands, 'f') +
        ' ' +
        plural(thousands, ['тысяча', 'тысячи', 'тысяч'])
    );
  }
  if (rest > 0) {
    parts.push(group(rest, 'm'));
  }

  return parts.join(' ');
}

export function numberToWords(amount: number): string {
  const intPart = Math.floor(amount);
  const kopPart = Math.round((amount - intPart) * 100);

  const rubLabel = plural(intPart, ['рубль', 'рубля', 'рублей']);
  const kopLabel = plural(kopPart, ['копейка', 'копейки', 'копеек']);

  const words = intPart === 0 ? 'ноль' : numberToWordsHelper(intPart);
  const capitalized = words.charAt(0).toUpperCase() + words.slice(1);

  return `${capitalized} ${rubLabel} ${kopPart.toString().padStart(2, '0')} ${kopLabel}`;
}
