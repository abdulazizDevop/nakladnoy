const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = !app.isPackaged;

// === Пути ===
function dataDir() {
  return app.getPath('userData');
}
function dataFile() {
  return path.join(dataDir(), 'data.json');
}
function previousFile() {
  return path.join(dataDir(), 'data.previous.json');
}
function backupsDir() {
  return path.join(dataDir(), 'backups');
}
function mirrorFile() {
  // Дополнительная копия в Documents, чтобы пережить случайное удаление AppData
  return path.join(app.getPath('documents'), 'Nakladnoy-Backup', 'data.json');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function todayStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// === Атомарная запись ===
// Пишем во временный файл и переименовываем — если в момент записи погасло
// питание, старый файл остаётся целым.
function writeAtomic(targetPath, contents) {
  ensureDir(path.dirname(targetPath));
  const tmp = targetPath + '.tmp';
  fs.writeFileSync(tmp, contents, 'utf-8');
  fs.renameSync(tmp, targetPath);
}

function safeParse(raw) {
  if (!raw || !raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('JSON parse failed:', err.message);
    return null;
  }
}

// Минимальная проверка, что файл — это действительно база накладной, а не,
// скажем, чужой package.json или произвольный JSON.
function looksLikeAppData(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  const arrayKeys = ['buyers', 'products', 'invoices'];
  // Допускаем отсутствие ключа (старые версии), но если он есть — должен быть массивом
  for (const key of arrayKeys) {
    if (key in obj && !Array.isArray(obj[key])) return false;
  }
  // Хотя бы один из ключей должен присутствовать — иначе это что-то постороннее
  return arrayKeys.some(k => k in obj);
}

// === Бекапы ===
function listBackupFiles() {
  const dir = backupsDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter(name => /^data-\d{4}-\d{2}-\d{2}\.json$/.test(name))
    .sort()
    .reverse();
}

function pruneOldBackups(keep = 30) {
  const files = listBackupFiles(); // уже отсортированы по убыванию даты
  const toDelete = files.slice(keep);
  for (const name of toDelete) {
    try {
      fs.unlinkSync(path.join(backupsDir(), name));
    } catch (err) {
      console.error('Не удалось удалить старый бекап', name, err);
    }
  }
}

function makeDailyBackup(contents) {
  const dir = backupsDir();
  ensureDir(dir);
  const file = path.join(dir, `data-${todayStamp()}.json`);
  // Перезаписываем сегодняшний бекап на самое свежее состояние дня
  writeAtomic(file, contents);
  pruneOldBackups(30);
}

// === Чтение с восстановлением ===
function readData() {
  // 1. Основной файл
  try {
    if (fs.existsSync(dataFile())) {
      const raw = fs.readFileSync(dataFile(), 'utf-8');
      const parsed = safeParse(raw);
      if (parsed) return parsed;
      console.warn('data.json повреждён — пробуем восстановление');
    }
  } catch (err) {
    console.error('Чтение data.json:', err);
  }

  // 2. Предыдущая версия
  try {
    if (fs.existsSync(previousFile())) {
      const raw = fs.readFileSync(previousFile(), 'utf-8');
      const parsed = safeParse(raw);
      if (parsed) {
        console.warn('Восстановили из data.previous.json');
        // Сразу запишем восстановленные данные как основные
        writeAtomic(dataFile(), raw);
        return parsed;
      }
    }
  } catch (err) {
    console.error('Чтение data.previous.json:', err);
  }

  // 3. Самый свежий ежедневный бекап
  const backups = listBackupFiles();
  for (const name of backups) {
    try {
      const raw = fs.readFileSync(path.join(backupsDir(), name), 'utf-8');
      const parsed = safeParse(raw);
      if (parsed) {
        console.warn('Восстановили из бекапа', name);
        writeAtomic(dataFile(), raw);
        return parsed;
      }
    } catch (err) {
      console.error('Чтение бекапа', name, err);
    }
  }

  // 4. Зеркало в Documents
  try {
    if (fs.existsSync(mirrorFile())) {
      const raw = fs.readFileSync(mirrorFile(), 'utf-8');
      const parsed = safeParse(raw);
      if (parsed) {
        console.warn('Восстановили из зеркала Documents');
        writeAtomic(dataFile(), raw);
        return parsed;
      }
    }
  } catch (err) {
    console.error('Чтение зеркала:', err);
  }

  return null;
}

// === Запись ===
function writeData(data) {
  try {
    const contents = JSON.stringify(data, null, 2);

    // Сохраняем текущую версию как previous (только если основной файл существует
    // и парсится — иначе мы затрём хороший previous плохими данными)
    try {
      if (fs.existsSync(dataFile())) {
        const oldRaw = fs.readFileSync(dataFile(), 'utf-8');
        if (safeParse(oldRaw)) {
          writeAtomic(previousFile(), oldRaw);
        }
      }
    } catch (err) {
      console.error('Не удалось обновить previous:', err);
    }

    // Основная запись
    writeAtomic(dataFile(), contents);

    // Ежедневный снимок
    try {
      makeDailyBackup(contents);
    } catch (err) {
      console.error('Не удалось создать ежедневный бекап:', err);
    }

    // Зеркало в Documents (best effort)
    try {
      writeAtomic(mirrorFile(), contents);
    } catch (err) {
      console.error('Не удалось обновить зеркало:', err);
    }

    return true;
  } catch (err) {
    console.error('writeData failed:', err);
    return false;
  }
}

// === Окно ===
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 900,
    minHeight: 640,
    title: 'Накладная',
    autoHideMenuBar: true,
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    const port = process.env.VITE_DEV_PORT || '5174';
    mainWindow.loadURL(`http://localhost:${port}`);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

// Только один экземпляр программы — если пользователь дважды кликнул по ярлыку,
// второй процесс не открывает новое окно и не конкурирует за data.json.
// Просто активируем уже работающее окно.
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  return;
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  // Базовый каталог
  ensureDir(dataDir());

  // IPC: чтение / запись
  ipcMain.handle('app:load', () => readData());
  ipcMain.handle('app:save', (_e, data) => writeData(data));

  // IPC: служебные пути
  ipcMain.handle('app:get-data-path', () => dataFile());
  ipcMain.handle('app:get-data-dir', () => dataDir());
  ipcMain.handle('app:get-mirror-path', () => mirrorFile());

  // IPC: открыть папку в проводнике
  ipcMain.handle('app:open-data-folder', async () => {
    await shell.openPath(dataDir());
    return true;
  });

  // IPC: список бекапов
  ipcMain.handle('app:list-backups', () => {
    const dir = backupsDir();
    if (!fs.existsSync(dir)) return [];
    return listBackupFiles().map(name => {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      return {
        name,
        date: name.replace(/^data-/, '').replace(/\.json$/, ''),
        size: stat.size,
        mtime: stat.mtimeMs,
      };
    });
  });

  // IPC: восстановить из бекапа
  ipcMain.handle('app:restore-backup', (_e, name) => {
    try {
      if (!/^data-\d{4}-\d{2}-\d{2}\.json$/.test(name)) {
        return { ok: false, error: 'Недопустимое имя бекапа' };
      }
      const src = path.join(backupsDir(), name);
      if (!fs.existsSync(src)) return { ok: false, error: 'Бекап не найден' };
      const raw = fs.readFileSync(src, 'utf-8');
      const parsed = safeParse(raw);
      if (!parsed) return { ok: false, error: 'Файл бекапа повреждён' };
      writeData(parsed);
      return { ok: true, data: parsed };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  });

  // IPC: создать бекап сейчас
  ipcMain.handle('app:create-backup-now', () => {
    try {
      if (!fs.existsSync(dataFile())) return { ok: false, error: 'Нечего бекапить' };
      const raw = fs.readFileSync(dataFile(), 'utf-8');
      const parsed = safeParse(raw);
      if (!parsed) return { ok: false, error: 'Текущие данные повреждены' };
      makeDailyBackup(raw);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  });

  // IPC: экспорт (диалог Сохранить)
  ipcMain.handle('app:export', async () => {
    if (!mainWindow) return { ok: false, error: 'Окно недоступно' };
    const stamp = todayStamp();
    const res = await dialog.showSaveDialog(mainWindow, {
      title: 'Экспорт базы данных',
      defaultPath: `nakladnoy-${stamp}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (res.canceled || !res.filePath) return { ok: false, cancelled: true };
    try {
      const raw = fs.existsSync(dataFile())
        ? fs.readFileSync(dataFile(), 'utf-8')
        : '{}';
      writeAtomic(res.filePath, raw);
      return { ok: true, path: res.filePath };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  });

  // IPC: импорт (диалог Открыть)
  ipcMain.handle('app:import', async () => {
    if (!mainWindow) return { ok: false, error: 'Окно недоступно' };
    const res = await dialog.showOpenDialog(mainWindow, {
      title: 'Импорт базы данных',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (res.canceled || !res.filePaths?.[0]) return { ok: false, cancelled: true };
    try {
      const raw = fs.readFileSync(res.filePaths[0], 'utf-8');
      const parsed = safeParse(raw);
      if (!looksLikeAppData(parsed)) {
        return {
          ok: false,
          error: 'Файл не похож на базу данных (ожидаются поля buyers / products / invoices)',
        };
      }
      writeData(parsed);
      return { ok: true, data: parsed };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
