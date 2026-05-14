import { Invoice } from '../types';
import { formatDate, formatNumber } from '../utils/format';

interface Props {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function InvoiceHistory({
  invoices,
  onView,
  onEdit,
  onDelete,
  onClose,
}: Props) {
  const sorted = [...invoices].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="fixed inset-0 z-100 flex flex-col bg-gray-100">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900">📋 История накладных</h1>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Закрыть
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-4xl space-y-3">
          {sorted.length === 0 ? (
            <div className="rounded-xl bg-white p-10 text-center shadow">
              <p className="text-gray-500">Накладных пока нет</p>
            </div>
          ) : (
            sorted.map(inv => (
              <div
                key={inv.id}
                className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow transition hover:shadow-md sm:flex-nowrap"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                  #{inv.invoiceNumber}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900">
                    {inv.buyerName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(inv.invoiceDate)} • {inv.items.length} поз. •{' '}
                    {formatNumber(inv.totalAmount)} руб.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onView(inv)}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
                  >
                    Открыть
                  </button>
                  <button
                    onClick={() => onEdit(inv)}
                    className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-amber-600"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Удалить накладную №' + inv.invoiceNumber + '?')) {
                        onDelete(inv.id);
                      }
                    }}
                    className="rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-200"
                    title="Удалить"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
