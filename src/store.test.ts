import { describe, it, expect, beforeEach } from 'vitest';
import { defaultAppData, AppData, Invoice } from './types';
import {
  addBuyer,
  addProduct,
  addSupplier,
  saveInvoice,
  peekNextInvoiceNumber,
  findBuyerByName,
  findProductByName,
  findSupplierByName,
} from './store';

// Имитируем localStorage в Node-окружении — vitest по умолчанию его не имеет.
beforeEach(() => {
  const memory = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => {
      memory.set(k, v);
    },
    removeItem: (k: string) => {
      memory.delete(k);
    },
    clear: () => memory.clear(),
    key: () => null,
    length: 0,
  };
});

function emptyData(): AppData {
  return JSON.parse(JSON.stringify(defaultAppData));
}

describe('Поиск по имени — нечувствителен к регистру и пробелам', () => {
  it('findBuyerByName находит точное совпадение', () => {
    const { data } = addBuyer(emptyData(), 'ИП Сабит');
    expect(findBuyerByName(data, 'ИП Сабит')?.name).toBe('ИП Сабит');
  });

  it('findBuyerByName игнорирует регистр', () => {
    const { data } = addBuyer(emptyData(), 'ИП Сабит');
    expect(findBuyerByName(data, 'ип сабит')?.name).toBe('ИП Сабит');
  });

  it('findBuyerByName схлопывает пробелы', () => {
    const { data } = addBuyer(emptyData(), 'ИП Сабит');
    expect(findBuyerByName(data, '  ИП    Сабит  ')?.name).toBe('ИП Сабит');
  });

  it('findSupplierByName и findProductByName работают так же', () => {
    let data = emptyData();
    data = addSupplier(data, 'ООО Альфа').data;
    data = addProduct(data, { name: 'Сахар', unit: 'кг', price: 100 }).data;

    expect(findSupplierByName(data, 'ооо альфа')?.name).toBe('ООО Альфа');
    expect(findProductByName(data, ' сахар ')?.name).toBe('Сахар');
  });
});

describe('Дедупликация при добавлении', () => {
  it('addBuyer не создаёт дубликат при тех же буквах', () => {
    let data = emptyData();
    data = addBuyer(data, 'ИП Сабит').data;
    data = addBuyer(data, 'ип сабит').data;
    expect(data.buyers).toHaveLength(1);
  });

  it('addSupplier не создаёт дубликат', () => {
    let data = emptyData();
    data = addSupplier(data, 'ООО Альфа').data;
    data = addSupplier(data, '  ООО Альфа  ').data;
    expect(data.suppliers).toHaveLength(1);
  });

  it('addProduct не создаёт дубликат и не трогает цену существующего', () => {
    let data = emptyData();
    data = addProduct(data, { name: 'Сахар', unit: 'кг', price: 100 }).data;
    const second = addProduct(data, { name: 'Сахар', unit: 'кг', price: 999 });
    data = second.data;
    expect(data.products).toHaveLength(1);
    // Цена остаётся прежней — модалка «Добавить товар» сама решает, обновлять её
    expect(data.products[0].price).toBe(100);
  });
});

describe('Нумерация накладных', () => {
  function makeInvoice(num: string, id = 'i1'): Invoice {
    return {
      id,
      invoiceNumber: num,
      invoiceDate: '2026-05-15',
      supplierFrom: 'ООО Альфа',
      buyerName: 'ИП Сабит',
      items: [],
      totalQuantity: 0,
      totalAmount: 0,
      note: '',
      createdAt: new Date().toISOString(),
    };
  }

  it('peekNextInvoiceNumber возвращает counter + 1 без записи', () => {
    const data = { ...emptyData(), invoiceCounter: 5 };
    expect(peekNextInvoiceNumber(data)).toBe('6');
    // не должен трогать счётчик
    expect(data.invoiceCounter).toBe(5);
  });

  it('saveInvoice увеличивает счётчик при добавлении новой', () => {
    let data = emptyData();
    data = saveInvoice(data, makeInvoice('1', 'i1'));
    expect(data.invoiceCounter).toBe(1);
    data = saveInvoice(data, makeInvoice('2', 'i2'));
    expect(data.invoiceCounter).toBe(2);
  });

  it('saveInvoice не увеличивает счётчик при редактировании', () => {
    let data = emptyData();
    data = saveInvoice(data, makeInvoice('1', 'i1'));
    expect(data.invoiceCounter).toBe(1);

    const edited = makeInvoice('1', 'i1');
    edited.note = 'Изменено';
    data = saveInvoice(data, edited);

    expect(data.invoiceCounter).toBe(1);
    expect(data.invoices).toHaveLength(1);
    expect(data.invoices[0].note).toBe('Изменено');
  });

  it('saveInvoice держит counter как max использованных номеров', () => {
    let data = emptyData();
    data = saveInvoice(data, makeInvoice('1', 'i1'));
    data = saveInvoice(data, makeInvoice('5', 'i2'));
    // Хотя добавили только 2 накладных, counter подтянулся до 5.
    expect(data.invoiceCounter).toBe(5);
    expect(peekNextInvoiceNumber(data)).toBe('6');
  });
});
