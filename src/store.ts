import { AppData, Buyer, Product, Invoice, defaultAppData } from './types';

const STORAGE_KEY = 'invoice_app_data';

// Загрузить данные
export function loadData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultAppData, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Ошибка загрузки данных:', e);
  }
  return { ...defaultAppData };
}

// Сохранить данные
export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Ошибка сохранения данных:', e);
  }
}

// Генерация ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

// === Покупатели ===
export function findBuyerByName(data: AppData, name: string): Buyer | undefined {
  const key = normalize(name);
  return data.buyers.find(b => normalize(b.name) === key);
}

export function addBuyer(data: AppData, name: string): { data: AppData; buyer: Buyer } {
  const trimmed = name.trim();
  const existing = findBuyerByName(data, trimmed);
  if (existing) {
    return { data, buyer: existing };
  }
  const buyer: Buyer = {
    id: generateId(),
    name: trimmed,
    createdAt: new Date().toISOString(),
  };
  const updated = { ...data, buyers: [...data.buyers, buyer] };
  saveData(updated);
  return { data: updated, buyer };
}

export function updateBuyer(data: AppData, id: string, name: string): AppData {
  const updated = {
    ...data,
    buyers: data.buyers.map(b => (b.id === id ? { ...b, name: name.trim() } : b)),
  };
  saveData(updated);
  return updated;
}

export function deleteBuyer(data: AppData, id: string): AppData {
  const updated = { ...data, buyers: data.buyers.filter(b => b.id !== id) };
  saveData(updated);
  return updated;
}

// === Товары ===
export function findProductByName(data: AppData, name: string): Product | undefined {
  const key = normalize(name);
  return data.products.find(p => normalize(p.name) === key);
}

export function addProduct(
  data: AppData,
  product: Omit<Product, 'id' | 'createdAt'>
): { data: AppData; product: Product } {
  const existing = findProductByName(data, product.name);
  if (existing) {
    return { data, product: existing };
  }
  const newProduct: Product = {
    id: generateId(),
    ...product,
    name: product.name.trim(),
    createdAt: new Date().toISOString(),
  };
  const updated = { ...data, products: [...data.products, newProduct] };
  saveData(updated);
  return { data: updated, product: newProduct };
}

export function updateProduct(
  data: AppData,
  id: string,
  patch: Partial<Omit<Product, 'id' | 'createdAt'>>
): AppData {
  const updated = {
    ...data,
    products: data.products.map(p =>
      p.id === id ? { ...p, ...patch, name: (patch.name ?? p.name).trim() } : p
    ),
  };
  saveData(updated);
  return updated;
}

export function deleteProduct(data: AppData, id: string): AppData {
  const updated = { ...data, products: data.products.filter(p => p.id !== id) };
  saveData(updated);
  return updated;
}

// === Накладные ===
export function peekNextInvoiceNumber(data: AppData): string {
  return String(data.invoiceCounter + 1);
}

export function saveInvoice(data: AppData, invoice: Invoice): AppData {
  const exists = data.invoices.findIndex(inv => inv.id === invoice.id);
  let invoices: Invoice[];
  let invoiceCounter = data.invoiceCounter;
  if (exists >= 0) {
    invoices = [...data.invoices];
    invoices[exists] = invoice;
  } else {
    invoices = [...data.invoices, invoice];
    const num = parseInt(invoice.invoiceNumber, 10);
    if (!Number.isNaN(num)) {
      invoiceCounter = Math.max(invoiceCounter, num);
    }
  }
  const updated = { ...data, invoices, invoiceCounter };
  saveData(updated);
  return updated;
}

export function deleteInvoice(data: AppData, id: string): AppData {
  const updated = { ...data, invoices: data.invoices.filter(inv => inv.id !== id) };
  saveData(updated);
  return updated;
}

// === Поставщик ===
export function setSupplierName(data: AppData, name: string): AppData {
  const updated = { ...data, supplierName: name };
  saveData(updated);
  return updated;
}
