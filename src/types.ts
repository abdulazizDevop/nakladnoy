// Контрагент (покупатель)
export interface Buyer {
  id: string;
  name: string;
  createdAt: string;
}

// Поставщик (продавец) — собственные реквизиты пользователя или его фирм
export interface Supplier {
  id: string;
  name: string;
  createdAt: string;
}

// Товар в справочнике
export interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
  createdAt: string;
}

// Позиция в накладной
export interface InvoiceItem {
  id: string;
  productId?: string;
  name: string;
  unit: string;
  quantity: number;
  price: number;
  amount: number;
}

// Накладная
export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  supplierFrom: string;
  buyerId?: string;
  buyerName: string;
  items: InvoiceItem[];
  totalQuantity: number;
  totalAmount: number;
  note: string;
  createdAt: string;
}

// Данные приложения
export interface AppData {
  buyers: Buyer[];
  suppliers: Supplier[];
  products: Product[];
  invoices: Invoice[];
  invoiceCounter: number;
  // Имя последнего использованного поставщика — подставляется в новую накладную
  supplierName: string;
}

export const defaultAppData: AppData = {
  buyers: [],
  suppliers: [],
  products: [],
  invoices: [],
  invoiceCounter: 0,
  supplierName: '',
};
