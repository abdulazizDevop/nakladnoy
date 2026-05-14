import { useEffect, useState } from 'react';
import { AppData } from '../types';
import { BackupInfo } from '../electron';
import { isElectron } from '../store';

interface Props {
  data: AppData;
  onDataChange: (data: AppData) => void;
  onClose: () => void;
}

type ToastKind = 'success' | 'error' | 'info';
interface Toast {
  kind: ToastKind;
  text: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(2)} МБ`;
}

function formatDateRu(iso: string): string {
  // iso = "2026-05-12"
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export default function Settings({ data, onDataChange, onClose }: Props) {
  const [dataPath, setDataPath] = useState('');
  const [mirrorPath, setMirrorPath] = useState('');
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const electronAvailable = isElectron();

  const refreshBackups = async () => {
    if (!electronAvailable) return;
    const list = await window.electronAPI!.listBackups();
    setBackups(list);
  };

  useEffect(() => {
    if (!electronAvailable) return;
    (async () => {
      setDataPath(await window.electronAPI!.getDataPath());
      setMirrorPath(await window.electronAPI!.getMirrorPath());
      await refreshBackups();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (kind: ToastKind, text: string) => {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 3500);
  };

  const handleOpenFolder = async () => {
    if (!electronAvailable) return;
    await window.electronAPI!.openDataFolder();
  };

  const handleCreateBackup = async () => {
    if (!electronAvailable) return;
    setLoading(true);
    // Дожидаемся записи текущего состояния, чтобы бекап был свежим
    await window.electronAPI!.saveData(data);
    const res = await window.electronAPI!.createBackupNow();
    setLoading(false);
    if (res.ok) {
      showToast('success', 'Резервная копия создана');
      await refreshBackups();
    } else {
      showToast('error', res.error || 'Не удалось создать копию');
    }
  };

  const handleRestore = async (name: string) => {
    if (!electronAvailable) return;
    if (
      !confirm(
        `Восстановить базу из «${name}»?\n\nТекущие данные будут заменены. Перед заменой создаётся снимок текущего состояния.`
      )
    ) {
      return;
    }
    setLoading(true);
    const res = await window.electronAPI!.restoreBackup(name);
    setLoading(false);
    if (res.ok && res.data) {
      onDataChange(res.data);
      showToast('success', 'Данные восстановлены');
      await refreshBackups();
    } else {
      showToast('error', res.error || 'Не удалось восстановить');
    }
  };

  const handleExport = async () => {
    if (!electronAvailable) return;
    setLoading(true);
    await window.electronAPI!.saveData(data);
    const res = await window.electronAPI!.exportData();
    setLoading(false);
    if (res.ok) {
      showToast('success', `Сохранено: ${res.path}`);
    } else if (!res.cancelled) {
      showToast('error', res.error || 'Не удалось сохранить');
    }
  };

  const handleImport = async () => {
    if (!electronAvailable) return;
    if (
      !confirm(
        'Импортировать базу из файла? Текущие данные будут заменены (предыдущая версия сохраняется автоматически).'
      )
    ) {
      return;
    }
    setLoading(true);
    const res = await window.electronAPI!.importData();
    setLoading(false);
    if (res.ok) {
      if (res.data) {
        onDataChange(res.data);
        showToast('success', 'Данные импортированы');
        await refreshBackups();
      }
    } else if (!res.cancelled) {
      showToast('error', res.error || 'Не удалось импортировать');
    }
  };

  const sectionCard = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm';
  const btnPrimary =
    'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50';
  const btnSecondary =
    'inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50';

  return (
    <div className="fixed inset-0 z-100 flex flex-col bg-gray-100">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <h1 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <svg
              className="h-5 w-5 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Настройки и резервные копии
          </h1>
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Закрыть
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed left-1/2 top-16 z-200 -translate-x-1/2 px-4">
          <div
            className={`rounded-lg px-4 py-2 text-sm font-semibold shadow-lg ${
              toast.kind === 'success'
                ? 'bg-green-600 text-white'
                : toast.kind === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-blue-600 text-white'
            }`}
          >
            {toast.text}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-4xl space-y-4">
          {!electronAvailable && (
            <div className={sectionCard + ' border-amber-200 bg-amber-50'}>
              <p className="text-sm text-amber-900">
                ⚠ Эти функции доступны только в установленной программе на компьютере.
                В браузере резервные копии не сохраняются.
              </p>
            </div>
          )}

          {/* Путь к данным */}
          <div className={sectionCard}>
            <h2 className="mb-3 text-base font-bold text-gray-900">
              📂 Где хранятся данные
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Основной файл:</span>
                <div className="mt-1 break-all rounded-lg bg-gray-50 px-3 py-2 font-mono text-xs text-gray-800">
                  {dataPath || '—'}
                </div>
              </div>
              <div>
                <span className="text-gray-500">
                  Дополнительная копия (на случай удаления):
                </span>
                <div className="mt-1 break-all rounded-lg bg-gray-50 px-3 py-2 font-mono text-xs text-gray-800">
                  {mirrorPath || '—'}
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={handleOpenFolder}
                disabled={!electronAvailable}
                className={btnSecondary}
              >
                Открыть папку с данными
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              При каждом сохранении создаётся резервная копия (data.previous.json) и
              ежедневный снимок в подпапке «backups». Дополнительная копия пишется в
              «Документы\Nakladnoy-Backup» — её можно использовать, если основная папка
              случайно удалена.
            </p>
          </div>

          {/* Резервные копии */}
          <div className={sectionCard}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">
                🗄 Резервные копии
                <span className="ml-2 text-xs font-normal text-gray-500">
                  ({backups.length}, хранятся последние 30 дней)
                </span>
              </h2>
              <button
                onClick={handleCreateBackup}
                disabled={!electronAvailable || loading}
                className={btnPrimary}
              >
                Создать копию сейчас
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200">
              {backups.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Резервных копий пока нет — они появятся после первого сохранения.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {backups.map(b => (
                    <li
                      key={b.name}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatDateRu(b.date)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {b.name} · {formatSize(b.size)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRestore(b.name)}
                        disabled={loading}
                        className="rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-semibold text-orange-800 hover:bg-orange-200 disabled:opacity-50"
                      >
                        Восстановить
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Экспорт / Импорт */}
          <div className={sectionCard}>
            <h2 className="mb-3 text-base font-bold text-gray-900">
              💾 Перенос базы (USB, другой компьютер)
            </h2>
            <p className="mb-3 text-xs text-gray-500">
              Экспорт сохраняет базу в один файл .json. Импорт — загружает базу из
              такого файла (перед заменой текущие данные автоматически сохраняются как
              предыдущая версия).
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExport}
                disabled={!electronAvailable || loading}
                className={btnPrimary}
              >
                ⬇ Экспорт базы
              </button>
              <button
                onClick={handleImport}
                disabled={!electronAvailable || loading}
                className={btnSecondary}
              >
                ⬆ Импорт базы
              </button>
            </div>
          </div>

          {/* Статистика */}
          <div className={sectionCard}>
            <h2 className="mb-3 text-base font-bold text-gray-900">📊 В базе</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-green-50 py-3">
                <div className="text-2xl font-bold text-green-700">
                  {data.buyers.length}
                </div>
                <div className="text-xs text-green-700">покупателей</div>
              </div>
              <div className="rounded-lg bg-purple-50 py-3">
                <div className="text-2xl font-bold text-purple-700">
                  {data.products.length}
                </div>
                <div className="text-xs text-purple-700">товаров</div>
              </div>
              <div className="rounded-lg bg-blue-50 py-3">
                <div className="text-2xl font-bold text-blue-700">
                  {data.invoices.length}
                </div>
                <div className="text-xs text-blue-700">накладных</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
