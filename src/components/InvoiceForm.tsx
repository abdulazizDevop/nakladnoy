import { useState, useEffect } from 'react';
import { AppData, Invoice, InvoiceItem } from '../types';
import {
  generateId,
  peekNextInvoiceNumber,
  addBuyer,
  addProduct,
  deleteBuyer,
  deleteProduct,
  updateBuyer,
  updateProduct,
} from '../store';
import SearchInput from './SearchInput';
import Modal from './Modal';
import ManageList from './ManageList';

interface Props {
  data: AppData;
  onDataChange: (data: AppData) => void;
  onGenerate: (invoice: Invoice, data: AppData) => void;
  onShowHistory: () => void;
}

export default function InvoiceForm({ data, onDataChange, onGenerate, onShowHistory }: Props) {
  const invoiceNumber = peekNextInvoiceNumber(data);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierFrom, setSupplierFrom] = useState(data.supplierName || '');
  const [buyerName, setBuyerName] = useState('');
  const [buyerId, setBuyerId] = useState<string | undefined>();
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: generateId(), name: '', unit: 'шт.', quantity: 1, price: 0, amount: 0 },
  ]);
  const [note, setNote] = useState('');

  // Modals
  const [showAddBuyer, setShowAddBuyer] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showManageBuyers, setShowManageBuyers] = useState(false);
  const [showManageProducts, setShowManageProducts] = useState(false);
  const [newBuyerName, setNewBuyerName] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', unit: 'шт.', price: 0 });

  // Update supplier from data
  useEffect(() => {
    setSupplierFrom(data.supplierName || '');
  }, [data.supplierName]);

  const buyerOptions = data.buyers.map(b => ({ id: b.id, label: b.name }));
  const productOptions = data.products.map(p => ({ 
    id: p.id, 
    label: p.name,
    unit: p.unit,
    price: p.price,
  }));

  const addItem = () => {
    setItems(prev => [
      ...prev,
      { id: generateId(), name: '', unit: 'шт.', quantity: 1, price: 0, amount: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'price') {
          updated.amount = Number(updated.quantity) * Number(updated.price);
        }
        return updated;
      })
    );
  };

  const selectProduct = (itemId: string, product: { id: string; label: string; unit?: string; price?: number }) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item;
        const price = (product.price as number) || item.price;
        const unit = (product.unit as string) || item.unit;
        return {
          ...item,
          productId: product.id,
          name: product.label,
          unit,
          price,
          amount: item.quantity * price,
        };
      })
    );
  };

  const handleAddBuyer = () => {
    if (!newBuyerName.trim()) return;
    const { data: updated, buyer } = addBuyer(data, newBuyerName);
    onDataChange(updated);
    setBuyerName(buyer.name);
    setBuyerId(buyer.id);
    setNewBuyerName('');
    setShowAddBuyer(false);
  };

  const handleAddProduct = () => {
    if (!newProduct.name.trim()) return;
    const { data: updated } = addProduct(data, {
      name: newProduct.name.trim(),
      unit: newProduct.unit,
      price: newProduct.price,
    });
    onDataChange(updated);
    setNewProduct({ name: '', unit: 'шт.', price: 0 });
    setShowAddProduct(false);
  };

  const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity), 0);
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const invoice: Invoice = {
      id: generateId(),
      invoiceNumber,
      invoiceDate,
      supplierFrom,
      buyerId,
      buyerName,
      items: items.map(item => ({
        ...item,
        amount: item.quantity * item.price,
      })),
      totalQuantity,
      totalAmount,
      note,
      createdAt: new Date().toISOString(),
    };

    onGenerate(invoice, data);
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200';
  const labelClass = 'block text-xs font-semibold text-gray-600 mb-1';

  return (
    <>
      <form onSubmit={handleSubmit} className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-3 shadow-lg shadow-blue-200">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h1 className="text-xl font-bold text-white">Товарная Накладная</h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddBuyer(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Добавить покупателя
          </button>
          <button
            type="button"
            onClick={() => setShowManageBuyers(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-green-600 bg-white px-3 py-2 text-sm font-semibold text-green-700 shadow-sm hover:bg-green-50"
            title="Управление покупателями"
          >
            📋 {data.buyers.length}
          </button>
          <button
            type="button"
            onClick={() => setShowAddProduct(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-purple-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Добавить товар
          </button>
          <button
            type="button"
            onClick={() => setShowManageProducts(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-purple-600 bg-white px-3 py-2 text-sm font-semibold text-purple-700 shadow-sm hover:bg-purple-50"
            title="Управление товарами"
          >
            📋 {data.products.length}
          </button>
          <button
            type="button"
            onClick={onShowHistory}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            История накладных ({data.invoices.length})
          </button>
        </div>

        {/* Invoice Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-800">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">1</span>
            Данные накладной
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Номер накладной</label>
              <input
                type="text"
                className={inputClass + ' bg-gray-50 font-bold text-blue-700'}
                value={invoiceNumber}
                readOnly
              />
            </div>
            <div>
              <label className={labelClass}>Дата накладной</label>
              <input
                type="date"
                className={inputClass}
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Supplier FROM */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-800">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">2</span>
            Поставщик
          </h2>
          <div>
            <label className={labelClass}>Название</label>
            <input
              type="text"
              className={inputClass}
              placeholder='ООО "Альфа"'
              value={supplierFrom}
              onChange={e => setSupplierFrom(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Buyer (with search) */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-800">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">3</span>
            Получатель
            <span className="ml-2 text-xs font-normal text-gray-500">({data.buyers.length} в базе)</span>
          </h2>
          <div>
            <label className={labelClass}>Название (поиск или введите новое)</label>
            <SearchInput
              value={buyerName}
              onChange={val => {
                setBuyerName(val);
                setBuyerId(undefined);
              }}
              onSelect={opt => {
                setBuyerName(opt.label);
                setBuyerId(opt.id);
              }}
              options={buyerOptions}
              placeholder="Начните вводить название..."
            />
          </div>
        </div>

        {/* Items */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-800">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">4</span>
            Товары
            <span className="ml-2 text-xs font-normal text-gray-500">({data.products.length} в справочнике)</span>
          </h2>

          <div className="space-y-3">
            {/* Table header - desktop */}
            <div className="hidden md:grid md:grid-cols-12 md:gap-2 md:px-1">
              <div className="col-span-1 text-xs font-semibold text-gray-500">№</div>
              <div className="col-span-4 text-xs font-semibold text-gray-500">Наименование (поиск)</div>
              <div className="col-span-1 text-xs font-semibold text-gray-500">Ед.</div>
              <div className="col-span-2 text-xs font-semibold text-gray-500">Кол-во</div>
              <div className="col-span-2 text-xs font-semibold text-gray-500">Цена</div>
              <div className="col-span-1 text-xs font-semibold text-gray-500">Сумма</div>
              <div className="col-span-1"></div>
            </div>

            {items.map((item, idx) => (
              <div
                key={item.id}
                className="rounded-lg border border-gray-100 bg-gray-50 p-3 md:grid md:grid-cols-12 md:items-center md:gap-2 md:border-0 md:bg-transparent md:p-0"
              >
                <div className="col-span-1 mb-2 text-sm font-bold text-gray-400 md:mb-0 md:text-center">
                  {idx + 1}
                </div>
                <div className="col-span-4 mb-2 md:mb-0">
                  <label className="mb-1 text-xs text-gray-500 md:hidden">Наименование</label>
                  <SearchInput
                    value={item.name}
                    onChange={val => updateItem(item.id, 'name', val)}
                    onSelect={opt => selectProduct(item.id, opt as { id: string; label: string; unit?: string; price?: number })}
                    options={productOptions}
                    placeholder="Поиск товара..."
                  />
                </div>
                <div className="col-span-1 mb-2 md:mb-0">
                  <label className="mb-1 text-xs text-gray-500 md:hidden">Ед. изм.</label>
                  <select
                    className={inputClass}
                    value={item.unit}
                    onChange={e => updateItem(item.id, 'unit', e.target.value)}
                  >
                    <option value="шт.">шт.</option>
                    <option value="кг">кг</option>
                    <option value="л">л</option>
                    <option value="м">м</option>
                    <option value="м²">м²</option>
                    <option value="м³">м³</option>
                    <option value="уп.">уп.</option>
                    <option value="т">т</option>
                    <option value="компл.">компл.</option>
                  </select>
                </div>
                <div className="col-span-2 mb-2 md:mb-0">
                  <label className="mb-1 text-xs text-gray-500 md:hidden">Количество</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    value={item.quantity || ''}
                    onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div className="col-span-2 mb-2 md:mb-0">
                  <label className="mb-1 text-xs text-gray-500 md:hidden">Цена</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    value={item.price || ''}
                    onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div className="col-span-1 mb-2 flex items-center md:mb-0">
                  <span className="text-sm font-semibold text-gray-700">
                    {(item.quantity * item.price).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                    disabled={items.length <= 1}
                    title="Удалить"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-blue-300 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-500 hover:bg-blue-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Добавить строку
          </button>

          {/* Total */}
          <div className="mt-4 flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
            <span className="text-sm font-semibold text-gray-600">Итого:</span>
            <span className="text-lg font-bold text-gray-900">
              {totalAmount.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} руб.
            </span>
          </div>
        </div>

        {/* Note */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-800">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">5</span>
            Примечание
          </h2>
          <textarea
            className={inputClass + ' min-h-[60px]'}
            placeholder="Дополнительная информация..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        {/* Submit */}
        <div className="flex justify-center">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-8 py-3 text-base font-bold text-white shadow-lg shadow-blue-200 transition hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl active:scale-[0.98]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Сформировать накладную
          </button>
        </div>
      </form>

      {/* Add Buyer Modal */}
      <Modal isOpen={showAddBuyer} onClose={() => setShowAddBuyer(false)} title="Добавить покупателя">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Название</label>
            <input
              type="text"
              className={inputClass}
              placeholder='ООО "Название"'
              value={newBuyerName}
              onChange={e => setNewBuyerName(e.target.value)}
              autoFocus
            />
          </div>
          <button
            type="button"
            onClick={handleAddBuyer}
            disabled={!newBuyerName.trim()}
            className="w-full rounded-lg bg-green-600 py-2.5 font-semibold text-white shadow hover:bg-green-700 disabled:opacity-50"
          >
            Добавить
          </button>
        </div>
      </Modal>

      {/* Add Product Modal */}
      <Modal isOpen={showAddProduct} onClose={() => setShowAddProduct(false)} title="Добавить товар в справочник">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Наименование товара</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Название товара"
              value={newProduct.name}
              onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Ед. измерения</label>
              <select
                className={inputClass}
                value={newProduct.unit}
                onChange={e => setNewProduct(p => ({ ...p, unit: e.target.value }))}
              >
                <option value="шт.">шт.</option>
                <option value="кг">кг</option>
                <option value="л">л</option>
                <option value="м">м</option>
                <option value="м²">м²</option>
                <option value="м³">м³</option>
                <option value="уп.">уп.</option>
                <option value="т">т</option>
                <option value="компл.">компл.</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Цена (руб.)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={newProduct.price || ''}
                onChange={e => setNewProduct(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddProduct}
            disabled={!newProduct.name.trim()}
            className="w-full rounded-lg bg-purple-600 py-2.5 font-semibold text-white shadow hover:bg-purple-700 disabled:opacity-50"
          >
            Добавить
          </button>
        </div>
      </Modal>

      {/* Manage Buyers */}
      <ManageList
        isOpen={showManageBuyers}
        onClose={() => setShowManageBuyers(false)}
        title="Покупатели"
        emptyText="Покупателей пока нет"
        items={data.buyers.map(b => ({ id: b.id, name: b.name }))}
        onDelete={id => onDataChange(deleteBuyer(data, id))}
        onRename={(id, name) => onDataChange(updateBuyer(data, id, name))}
      />

      {/* Manage Products */}
      <ManageList
        isOpen={showManageProducts}
        onClose={() => setShowManageProducts(false)}
        title="Товары"
        emptyText="Товаров пока нет"
        items={data.products.map(p => ({
          id: p.id,
          name: p.name,
          meta: `${p.unit} · ${p.price.toLocaleString('ru-RU')} руб.`,
        }))}
        onDelete={id => onDataChange(deleteProduct(data, id))}
        onRename={(id, name) => onDataChange(updateProduct(data, id, { name }))}
      />
    </>
  );
}
