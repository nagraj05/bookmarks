import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'bookmarks.db';

export async function migrateDatabase(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');

  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');

  if ((version?.user_version ?? 0) < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL COLLATE NOCASE UNIQUE,
        color TEXT NOT NULL DEFAULT '#FFD23F',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        normalized_url TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        favicon_url TEXT,
        folder_id INTEGER NOT NULL DEFAULT 1,
        is_favorite INTEGER NOT NULL DEFAULT 0 CHECK (is_favorite IN (0, 1)),
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'trash')),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_opened_at TEXT,
        FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE RESTRICT
      );

      CREATE INDEX IF NOT EXISTS idx_bookmarks_folder ON bookmarks(folder_id);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_status ON bookmarks(status);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_created ON bookmarks(created_at DESC);

      INSERT OR IGNORE INTO folders (id, name, color) VALUES (1, 'Inbox', '#FFD23F');
      PRAGMA user_version = 1;
    `);
  }

  if ((version?.user_version ?? 0) < 2) {
    await db.execAsync(`
      ALTER TABLE bookmarks ADD COLUMN source_key TEXT NOT NULL DEFAULT 'other';

      UPDATE bookmarks
      SET source_key = CASE
        WHEN normalized_url LIKE '%://x.com/%' OR normalized_url LIKE '%://twitter.com/%' THEN 'x'
        WHEN normalized_url LIKE '%instagram.com/%' THEN 'instagram'
        WHEN normalized_url LIKE '%facebook.com/%' OR normalized_url LIKE '%fb.watch/%' THEN 'facebook'
        WHEN normalized_url LIKE '%youtube.com/%' OR normalized_url LIKE '%youtu.be/%' THEN 'youtube'
        WHEN normalized_url LIKE '%reddit.com/%' OR normalized_url LIKE '%redd.it/%' THEN 'reddit'
        WHEN normalized_url LIKE '%linkedin.com/%' OR normalized_url LIKE '%lnkd.in/%' THEN 'linkedin'
        WHEN normalized_url LIKE '%tiktok.com/%' THEN 'tiktok'
        WHEN normalized_url LIKE '%threads.net/%' THEN 'threads'
        WHEN normalized_url LIKE '%pinterest.com/%' OR normalized_url LIKE '%pin.it/%' THEN 'pinterest'
        ELSE 'other'
      END;

      CREATE INDEX IF NOT EXISTS idx_bookmarks_source ON bookmarks(source_key);
      PRAGMA user_version = 2;
    `);
  }

  if ((version?.user_version ?? 0) < 3) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      INSERT OR IGNORE INTO app_settings (key, value) VALUES ('theme', 'system');
      INSERT OR IGNORE INTO app_settings (key, value) VALUES ('app_lock_enabled', 'false');
      INSERT OR IGNORE INTO app_settings (key, value) VALUES ('app_lock_pending', 'false');
      PRAGMA user_version = 3;
    `);
  }

  if ((version?.user_version ?? 0) < 4) {
    await db.execAsync(`
      INSERT OR IGNORE INTO app_settings (key, value) VALUES ('app_lock_enabled', 'false');
      PRAGMA user_version = 4;
    `);
  }

  if ((version?.user_version ?? 0) < 5) {
    await db.execAsync(`
      INSERT OR IGNORE INTO app_settings (key, value) VALUES ('app_lock_pending', 'false');
      PRAGMA user_version = 5;
    `);
  }

  if ((version?.user_version ?? 0) < 6) {
    await db.execAsync(`
      UPDATE bookmarks
      SET source_key = 'threads'
      WHERE normalized_url LIKE '%://threads.com/%'
         OR normalized_url LIKE '%://%.threads.com/%'
         OR normalized_url LIKE '%://threads.net/%'
         OR normalized_url LIKE '%://%.threads.net/%';

      UPDATE bookmarks
      SET source_key = 'substack'
      WHERE normalized_url LIKE '%://substack.com/%'
         OR normalized_url LIKE '%://%.substack.com/%';

      PRAGMA user_version = 6;
    `);
  }

  if ((version?.user_version ?? 0) < 7) {
    await db.execAsync(`
      UPDATE bookmarks
      SET source_key = 'tumblr'
      WHERE normalized_url LIKE '%://tumblr.com/%'
         OR normalized_url LIKE '%://%.tumblr.com/%';

      PRAGMA user_version = 7;
    `);
  }

  if ((version?.user_version ?? 0) < 8) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS bookmark_folders (
        bookmark_id INTEGER NOT NULL,
        folder_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (bookmark_id, folder_id),
        FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE,
        FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
      );

      INSERT OR IGNORE INTO bookmark_folders (bookmark_id, folder_id)
      SELECT id, folder_id FROM bookmarks;

      CREATE INDEX IF NOT EXISTS idx_bookmark_folders_folder ON bookmark_folders(folder_id);
      PRAGMA user_version = 8;
    `);
  }

  if ((version?.user_version ?? 0) < 9) {
    await db.execAsync(`
      INSERT OR IGNORE INTO app_settings (key, value) VALUES ('app_folders_enabled', 'false');
      PRAGMA user_version = 9;
    `);
  }

  if ((version?.user_version ?? 0) < 10) {
    await db.execAsync(`
      UPDATE bookmarks
      SET source_key = 'spotify'
      WHERE normalized_url LIKE '%://spotify.com/%'
         OR normalized_url LIKE '%://%.spotify.com/%'
         OR normalized_url LIKE '%://spotify.link/%'
         OR normalized_url LIKE '%://%.spotify.link/%';

      PRAGMA user_version = 10;
    `);
  }
}
