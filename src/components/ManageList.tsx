import { useMemo, useState } from 'react';
import Modal from './Modal';

interface Item {
  id: string;
  name: string;
  meta?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: Item[];
  emptyText: string;
  onDelete: (id: string) => void;
  onRename?: (id: string, name: string) => void;
}

export default function ManageList({
  isOpen,
  onClose,
  title,
  items,
  emptyText,
  onDelete,
  onRename,
}: Props) {
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(it => it.name.toLowerCase().includes(q));
  }, [items, query]);

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setEditValue(item.name);
  };

  const saveEdit = () => {
    if (editingId && onRename && editValue.trim()) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
    setEditValue('');
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-3">
        <input
          type="text"
          className={inputClass}
          placeholder="Поиск..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        <div className="text-xs text-gray-500">
          Всего: <span className="font-semibold text-gray-700">{items.length}</span>
          {query && (
            <>
              {' '}
              · Найдено:{' '}
              <span className="font-semibold text-gray-700">{filtered.length}</span>
            </>
          )}
        </div>

        <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-gray-200">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              {items.length === 0 ? emptyText : 'Ничего не найдено'}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map(item => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50"
                >
                  {editingId === item.id ? (
                    <>
                      <input
                        autoFocus
                        type="text"
                        className={inputClass}
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <button
                        type="button"
                        onClick={saveEdit}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-300"
                      >
                        Отмена
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm text-gray-900">{item.name}</p>
                        {item.meta && (
                          <p className="text-xs text-gray-500">{item.meta}</p>
                        )}
                      </div>
                      {onRename && (
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="rounded-lg p-1.5 text-blue-500 hover:bg-blue-50"
                          title="Изменить"
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Удалить «${item.name}»?`)) onDelete(item.id);
                        }}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
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
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
