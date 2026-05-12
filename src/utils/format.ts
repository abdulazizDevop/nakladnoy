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
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

const units = [
  '', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять',
  'десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать',
  'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'
];

const tens = [
  '', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'
];

const hundreds = [
  '', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'
];

function numberToWordsHelper(n: number): string {
  if (n === 0) return '';
  if (n < 20) return units[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + units[n % 10] : '');
  if (n < 1000) return hundreds[Math.floor(n / 100)] + (n % 100 ? ' ' + numberToWordsHelper(n % 100) : '');
  if (n < 1000000) {
    const thousands = Math.floor(n / 1000);
    let prefix = '';
    if (thousands === 1) prefix = 'одна тысяча';
    else if (thousands === 2) prefix = 'две тысячи';
    else if (thousands >= 3 && thousands <= 4) prefix = numberToWordsHelper(thousands) + ' тысячи';
    else prefix = numberToWordsHelper(thousands) + ' тысяч';
    return prefix + (n % 1000 ? ' ' + numberToWordsHelper(n % 1000) : '');
  }
  if (n < 1000000000) {
    const millions = Math.floor(n / 1000000);
    let prefix = '';
    if (millions === 1) prefix = 'один миллион';
    else if (millions >= 2 && millions <= 4) prefix = numberToWordsHelper(millions) + ' миллиона';
    else prefix = numberToWordsHelper(millions) + ' миллионов';
    return prefix + (n % 1000000 ? ' ' + numberToWordsHelper(n % 1000000) : '');
  }
  return n.toString();
}

export function numberToWords(amount: number): string {
  const intPart = Math.floor(amount);
  const kopPart = Math.round((amount - intPart) * 100);
  
  if (intPart === 0) {
    return `Ноль руб. ${kopPart.toString().padStart(2, '0')} коп.`;
  }
  
  const words = numberToWordsHelper(intPart);
  const capitalized = words.charAt(0).toUpperCase() + words.slice(1);
  return `${capitalized} руб. ${kopPart.toString().padStart(2, '0')} коп.`;
}
