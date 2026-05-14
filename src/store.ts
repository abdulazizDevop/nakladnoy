import { AppData, Buyer, Product, Invoice, Supplier, defaultAppData } from './types';

const STORAGE_KEY = 'invoice_app_data';

export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
}

// Подтянуть старое сохранение к актуальной схеме. Например, до 1.3.0 поставщик
// хранился одной строкой supplierName — теперь это полноценная коллекция
// suppliers, а supplierName остаётся как «последний выбранный».
function migrate(raw: Partial<AppData> | null | undefined): AppData {
  const merged: AppData = { ...defaultAppData, ...(raw ?? {}) };
  if (!Array.isArray(merged.suppliers)) {
    merged.suppliers = [];
  }
  // Если в старой базе был supplierName, но нет такого поставщика в списке —
  // добавим его автоматически, чтобы пользователь сразу увидел подсказку.
  const lastName = (merged.supplierName || '').trim();
  if (lastName) {
    const exists = merged.suppliers.some(
      s => normalize(s.name) === normalize(lastName)
    );
    if (!exists) {
      merged.suppliers = [
        ...merged.suppliers,
        {
          id: generateId(),
          name: lastName,
          createdAt: new Date().toISOString(),
        },
      ];
    }
  }
  return merged;
}

// Загрузить данные синхронно (из localStorage — быстрый старт)
export function loadData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return migrate(JSON.parse(stored));
    }
  } catch (e) {
    console.error('Ошибка загрузки данных:', e);
  }
  return { ...defaultAppData };
}

// При запуске в Electron подтягиваем данные из файла на диске
export async function loadFromDisk(): Promise<AppData | null> {
  if (!isElectron()) return null;
  try {
    const fileData = await window.electronAPI!.loadData();
    if (!fileData) return null;
    const merged = migrate(fileData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.error('Ошибка чтения файла:', e);
    return null;
  }
}

// Сохранить: localStorage (мгновенно) + файл (если есть Electron)
export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Ошибка localStorage:', e);
  }
  if (isElectron()) {
    window.electronAPI!.saveData(data).catch(err => {
      console.error('Ошибка записи файла:', err);
    });
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

// === Поставщики (продавцы) ===
export function findSupplierByName(data: AppData, name: string): Supplier | undefined {
  const key = normalize(name);
  return data.suppliers.find(s => normalize(s.name) === key);
}

export function addSupplier(
  data: AppData,
  name: string
): { data: AppData; supplier: Supplier } {
  const trimmed = name.trim();
  const existing = findSupplierByName(data, trimmed);
  if (existing) {
    return { data, supplier: existing };
  }
  const supplier: Supplier = {
    id: generateId(),
    name: trimmed,
    createdAt: new Date().toISOString(),
  };
  const updated = { ...data, suppliers: [...data.suppliers, supplier] };
  saveData(updated);
  return { data: updated, supplier };
}

export function updateSupplier(data: AppData, id: string, name: string): AppData {
  const updated = {
    ...data,
    suppliers: data.suppliers.map(s =>
      s.id === id ? { ...s, name: name.trim() } : s
    ),
  };
  saveData(updated);
  return updated;
}

export function deleteSupplier(data: AppData, id: string): AppData {
  const updated = { ...data, suppliers: data.suppliers.filter(s => s.id !== id) };
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
