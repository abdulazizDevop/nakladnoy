import { useRef, useEffect, useState, useCallback } from 'react';
import { Invoice } from '../types';
import { formatNumber, formatDate, numberToWords } from '../utils/format';

interface Props {
  invoice: Invoice;
  onBack: () => void;
}

const A4_WIDTH = 794;
const A4_MIN_HEIGHT = 1123;
const PAGE_PAD = 60;

export default function InvoicePrint({ invoice, onBack }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [copies, setCopies] = useState(1);

  const recalcScale = useCallback(() => {
    if (!wrapperRef.current) return;
    const available = wrapperRef.current.clientWidth - 40;
    if (available < A4_WIDTH) {
      setScale(available / A4_WIDTH);
    } else {
      setScale(1);
    }
  }, []);

  useEffect(() => {
    recalcScale();
    window.addEventListener('resize', recalcScale);
    return () => window.removeEventListener('resize', recalcScale);
  }, [recalcScale]);

  const handlePrint = () => {
    window.print();
  };

  // Generate pages for print (multiple copies)
  const renderInvoicePage = (copyNum: number) => (
    <div 
      key={copyNum}
      className="a4-page bg-white border-2 border-gray-400 shadow-2xl print-page"
      style={{
        width: A4_WIDTH,
        minHeight: A4_MIN_HEIGHT,
        padding: PAGE_PAD,
        boxSizing: 'border-box',
        marginBottom: copyNum < copies ? 40 : 0,
      }}
    >
      {/* Копия */}
      {copies > 1 && (
        <div className="text-right text-xs text-gray-400 mb-2">
          Копия {copyNum} из {copies}
        </div>
      )}

      {/* Поставщик / Получатель */}
      <div style={{ marginBottom: 20, borderBottom: '1px solid #ddd', paddingBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 4, fontSize: 13 }}>
          <span style={{ color: '#777', fontWeight: 600, minWidth: 95 }}>Поставщик:</span>
          <span style={{ color: '#111', fontWeight: 600 }}>{invoice.supplierFrom}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, fontSize: 13 }}>
          <span style={{ color: '#777', fontWeight: 600, minWidth: 95 }}>Получатель:</span>
          <span style={{ color: '#111', fontWeight: 600 }}>{invoice.buyerName}</span>
        </div>
      </div>

      {/* Заголовок */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1, color: '#111', margin: 0 }}>
          ТОВАРНАЯ НАКЛАДНАЯ
        </h1>
        <p style={{ marginTop: 4, fontSize: 14, color: '#555' }}>
          №{' '}
          <span style={{ borderBottom: '1px solid #000', fontWeight: 700, color: '#000', padding: '0 6px', display: 'inline-block', minWidth: 30 }}>
            {invoice.invoiceNumber}
          </span>
          {' '}от{' '}
          <span style={{ borderBottom: '1px solid #000', fontWeight: 700, color: '#000', padding: '0 6px', display: 'inline-block', minWidth: 80 }}>
            {formatDate(invoice.invoiceDate)}
          </span>
        </p>
      </div>

      {/* Таблица */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 12,
          tableLayout: 'fixed',
        }}
      >
        <colgroup>
          <col style={{ width: '6%' }} />
          <col style={{ width: '40%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '16%' }} />
        </colgroup>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={thStyle}>№</th>
            <th style={{ ...thStyle, textAlign: 'left' }}>Наименование товара</th>
            <th style={thStyle}>Ед.</th>
            <th style={thStyle}>Кол-во</th>
            <th style={thStyle}>Цена, руб.</th>
            <th style={thStyle}>Сумма, руб.</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, idx) => (
            <tr key={item.id}>
              <td style={{ ...tdStyle, textAlign: 'center', color: '#666' }}>{idx + 1}</td>
              <td style={{ ...tdStyle, color: '#111', fontWeight: 500, wordBreak: 'break-word' }}>{item.name}</td>
              <td style={{ ...tdStyle, textAlign: 'center', color: '#666' }}>{item.unit}</td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(item.price)}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{formatNumber(item.quantity * item.price)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: '#f3f4f6', fontWeight: 700 }}>
            <td colSpan={3} style={{ ...tdStyle, textAlign: 'right', color: '#444' }}>Итого:</td>
            <td style={{ ...tdStyle, textAlign: 'center' }}>{invoice.totalQuantity}</td>
            <td style={{ ...tdStyle, textAlign: 'center', color: '#aaa' }}>—</td>
            <td style={{ ...tdStyle, textAlign: 'right', color: '#111' }}>{formatNumber(invoice.totalAmount)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Итого текстом */}
      <div style={{ marginTop: 16, fontSize: 12, color: '#333', lineHeight: 1.6 }}>
        <p style={{ margin: 0 }}>
          Всего наименований <strong>{invoice.items.length}</strong>, на сумму{' '}
          <strong>{formatNumber(invoice.totalAmount)} руб.</strong>
        </p>
        <p style={{ margin: '4px 0 0', fontStyle: 'italic' }}>{numberToWords(invoice.totalAmount)}</p>
      </div>

      {/* Примечание */}
      {invoice.note && (
        <div style={{ marginTop: 12, border: '1px solid #ddd', borderRadius: 4, background: '#fafafa', padding: 8, fontSize: 12, color: '#666' }}>
          <strong>Примечание:</strong> {invoice.note}
        </div>
      )}

      {/* Подписи */}
      <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, fontSize: 12 }}>
        <div>
          <p style={{ fontWeight: 700, color: '#333', marginBottom: 20 }}>Отпустил:</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
            <span style={{ color: '#888', whiteSpace: 'nowrap' }}>Подпись</span>
            <span style={{ flex: 1, borderBottom: '1px solid #555', minWidth: 50 }}>&nbsp;</span>
            <span style={{ color: '#bbb', padding: '0 4px' }}>/</span>
            <span style={{ flex: 1, borderBottom: '1px solid #555', minWidth: 50 }}>&nbsp;</span>
          </div>
        </div>
        <div>
          <p style={{ fontWeight: 700, color: '#333', marginBottom: 20 }}>Получил:</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
            <span style={{ color: '#888', whiteSpace: 'nowrap' }}>Подпись</span>
            <span style={{ flex: 1, borderBottom: '1px solid #555', minWidth: 50 }}>&nbsp;</span>
            <span style={{ color: '#bbb', padding: '0 4px' }}>/</span>
            <span style={{ flex: 1, borderBottom: '1px solid #555', minWidth: 50 }}>&nbsp;</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Toolbar */}
      <div className="no-print sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-[900px] px-3 py-2 sm:px-4 sm:py-3">
          {/* Row 1: Back + Print */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
            >
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </button>

            {/* Copies slider */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              <span className="text-xs text-gray-500 sm:text-sm sm:text-gray-600">Копий:</span>
              <input
                type="range"
                min={1}
                max={5}
                value={copies}
                onChange={e => setCopies(Number(e.target.value))}
                className="w-16 sm:w-24"
              />
              <span className="w-5 text-center text-sm font-bold text-blue-700 sm:w-6">{copies}</span>
            </div>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow transition hover:from-blue-700 hover:to-indigo-700 sm:gap-2 sm:px-5 sm:py-2 sm:text-sm sm:shadow-lg sm:shadow-blue-200"
            >
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="hidden sm:inline">Печать ({copies} {copies === 1 ? 'копия' : copies < 5 ? 'копии' : 'копий'})</span>
              <span className="sm:hidden">Печать ({copies})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preview (scaled) - NO PRINT */}
      <div ref={wrapperRef} className="a4-wrapper no-print flex justify-center py-6 md:py-10 px-2">
        <div
          style={{
            width: A4_WIDTH * scale,
            overflow: 'hidden',
          }}
        >
          <div
            ref={pageRef}
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            {Array.from({ length: copies }, (_, i) => renderInvoicePage(i + 1))}
          </div>
        </div>
      </div>

      {/* Print area - ONLY FOR PRINT */}
      <div className="print-only">
        {Array.from({ length: copies }, (_, i) => renderInvoicePage(i + 1))}
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  border: '1px solid #555',
  padding: '6px 8px',
  textAlign: 'center',
  fontWeight: 700,
  color: '#444',
};

const tdStyle: React.CSSProperties = {
  border: '1px solid #555',
  padding: '5px 8px',
};
