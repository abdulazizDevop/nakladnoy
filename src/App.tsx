import { useState, useEffect } from 'react';
import { AppData, Invoice } from './types';
import {
  loadData,
  loadFromDisk,
  saveInvoice,
  setSupplierName,
  deleteInvoice,
  addBuyer,
  addProduct,
  addSupplier,
} from './store';
import InvoiceForm from './components/InvoiceForm';
import InvoicePrint from './components/InvoicePrint';
import InvoiceHistory from './components/InvoiceHistory';
import Settings from './components/Settings';

type View = 'form' | 'preview' | 'history' | 'settings';

export default function App() {
  const [data, setData] = useState<AppData>(loadData);
  const [view, setView] = useState<View>('form');
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // On Electron, prefer the on-disk file (authoritative across reinstalls)
  useEffect(() => {
    loadFromDisk().then(fileData => {
      if (fileData) setData(fileData);
    });
  }, []);

  const handleDataChange = (newData: AppData) => {
    setData(newData);
  };

  const handleGenerate = (invoice: Invoice, appData: AppData) => {
    let updatedData = appData;

    // Auto-save supplier name into the suppliers directory so it appears in
    // the autocomplete next time. supplierName also gets updated so the next
    // new invoice pre-fills with the most recently used supplier.
    if (invoice.supplierFrom.trim()) {
      const res = addSupplier(updatedData, invoice.supplierFrom);
      updatedData = res.data;
      if (invoice.supplierFrom !== updatedData.supplierName) {
        updatedData = setSupplierName(updatedData, res.supplier.name);
      }
    }

    // Auto-save new buyer if name doesn't match an existing one
    let buyerId = invoice.buyerId;
    if (invoice.buyerName.trim()) {
      const res = addBuyer(updatedData, invoice.buyerName);
      updatedData = res.data;
      buyerId = res.buyer.id;
    }

    // Auto-save new products from items
    const items = invoice.items.map(item => {
      if (!item.name.trim()) return item;
      const res = addProduct(updatedData, {
        name: item.name,
        unit: item.unit,
        price: item.price,
      });
      updatedData = res.data;
      return { ...item, productId: item.productId ?? res.product.id };
    });

    const enriched: Invoice = { ...invoice, buyerId, items };
    updatedData = saveInvoice(updatedData, enriched);
    setData(updatedData);
    setCurrentInvoice(enriched);
    setEditingInvoice(null);
    setView('preview');
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setView('form');
    setCurrentInvoice(null);
    setEditingInvoice(null);
    // Reload data to get fresh invoice number
    setData(loadData());
    window.scrollTo(0, 0);
  };

  const handleShowHistory = () => {
    setView('history');
  };

  const handleShowSettings = () => {
    setView('settings');
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setCurrentInvoice(invoice);
    setView('preview');
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setView('form');
    window.scrollTo(0, 0);
  };

  const handleCancelEdit = () => {
    setEditingInvoice(null);
    setView('history');
  };

  const handleDeleteInvoice = (id: string) => {
    const updated = deleteInvoice(data, id);
    setData(updated);
  };

  if (view === 'history') {
    return (
      <InvoiceHistory
        invoices={data.invoices}
        onView={handleViewInvoice}
        onEdit={handleEditInvoice}
        onDelete={handleDeleteInvoice}
        onClose={() => setView('form')}
      />
    );
  }

  if (view === 'settings') {
    return (
      <Settings
        data={data}
        onDataChange={handleDataChange}
        onClose={() => setView('form')}
      />
    );
  }

  if (view === 'preview' && currentInvoice) {
    return <InvoicePrint invoice={currentInvoice} onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 pb-12">
      <InvoiceForm
        // remounting on switch keeps form state in sync with the
        // editingInvoice argument (state initializers re-run on mount)
        key={editingInvoice ? `edit-${editingInvoice.id}` : 'new'}
        data={data}
        onDataChange={handleDataChange}
        onGenerate={handleGenerate}
        onShowHistory={handleShowHistory}
        onShowSettings={handleShowSettings}
        editingInvoice={editingInvoice}
        onCancelEdit={handleCancelEdit}
      />
    </div>
  );
}
