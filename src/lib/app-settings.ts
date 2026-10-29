import type { SQLiteDatabase } from 'expo-sqlite';

const APP_FOLDERS_KEY = 'app_folders_enabled';

export async function getAppFoldersEnabled(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    APP_FOLDERS_KEY,
  );
  return row?.value === 'true';
}

export async function setAppFoldersEnabled(db: SQLiteDatabase, enabled: boolean) {
  await db.runAsync(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    APP_FOLDERS_KEY,
    enabled ? 'true' : 'false',
  );
}
