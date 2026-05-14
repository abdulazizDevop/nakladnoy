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

    if (invoice.supplierFrom && invoice.supplierFrom !== appData.supplierName) {
      updatedData = setSupplierName(updatedData, invoice.supplierFrom);
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
    setView('preview');
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setView('form');
    setCurrentInvoice(null);
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

  const handleDeleteInvoice = (id: string) => {
    const updated = deleteInvoice(data, id);
    setData(updated);
  };

  if (view === 'history') {
    return (
      <InvoiceHistory
        invoices={data.invoices}
        onView={handleViewInvoice}
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
        data={data}
        onDataChange={handleDataChange}
        onGenerate={handleGenerate}
        onShowHistory={handleShowHistory}
        onShowSettings={handleShowSettings}
      />
    </div>
  );
}
