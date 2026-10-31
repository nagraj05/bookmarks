import type { SQLiteDatabase } from 'expo-sqlite';

export type BookmarkStatus = 'active' | 'archived' | 'trash';

export const SOURCE_APPS = {
  x: { label: 'X', color: '#000000' },
  instagram: { label: 'Instagram', color: '#E4405F' },
  facebook: { label: 'Facebook', color: '#63A4FF' },
  youtube: { label: 'YouTube', color: '#FF5C5C' },
  reddit: { label: 'Reddit', color: '#FF8A3D' },
  spotify: { label: 'Spotify', color: '#1DB954' },
  linkedin: { label: 'LinkedIn', color: '#0A66C2' },
  tiktok: { label: 'TikTok', color: '#B59CFF' },
  tumblr: { label: 'Tumblr', color: '#36465D' },
  threads: { label: 'Threads', color: '#000000' },
  substack: { label: 'Substack', color: '#FF6719' },
  pinterest: { label: 'Pinterest', color: '#FF7070' },
  other: { label: 'Other', color: '#8BE28B' },
} as const;

export type SourceKey = keyof typeof SOURCE_APPS;

export type BookmarkSource = {
  key: SourceKey;
  label: string;
  color: string;
  count: number;
};

export type Folder = {
  id: number;
  name: string;
  color: string;
  icon: string;
  created_at: string;
  bookmark_count: number;
};

export type Bookmark = {
  id: number;
  url: string;
  normalized_url: string;
  title: string;
  description: string | null;
  image_url: string | null;
  favicon_url: string | null;
  source_key: SourceKey;
  folder_id: number;
  folder_name: string;
  folder_color: string;
  is_favorite: number;
  status: BookmarkStatus;
  created_at: string;
  updated_at: string;
  last_opened_at: string | null;
};

export type BookmarkFilters = {
  folderId?: number;
  status?: BookmarkStatus;
  favoritesOnly?: boolean;
  query?: string;
  sourceKey?: SourceKey;
  limit?: number;
};

export function normalizeUrl(input: string) {
  const trimmed = input.trim();
  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);
  parsed.hash = '';
  parsed.hostname = parsed.hostname.toLowerCase();
  if ((parsed.protocol === 'https:' && parsed.port === '443') || (parsed.protocol === 'http:' && parsed.port === '80')) {
    parsed.port = '';
  }
  if (parsed.pathname !== '/') {
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');
  }
  return parsed.toString();
}

export function domainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function sourceFromUrl(url: string): SourceKey {
  const domain = domainFromUrl(url).toLowerCase();
  if (domain === 'x.com' || domain.endsWith('.x.com') || domain === 'twitter.com' || domain.endsWith('.twitter.com')) return 'x';
  if (domain === 'instagram.com' || domain.endsWith('.instagram.com')) return 'instagram';
  if (domain === 'facebook.com' || domain.endsWith('.facebook.com') || domain === 'fb.watch') return 'facebook';
  if (domain === 'youtube.com' || domain.endsWith('.youtube.com') || domain === 'youtu.be') return 'youtube';
  if (domain === 'reddit.com' || domain.endsWith('.reddit.com') || domain === 'redd.it') return 'reddit';
  if (domain === 'spotify.com' || domain.endsWith('.spotify.com') || domain === 'spotify.link' || domain.endsWith('.spotify.link')) return 'spotify';
  if (domain === 'linkedin.com' || domain.endsWith('.linkedin.com') || domain === 'lnkd.in') return 'linkedin';
  if (domain === 'tiktok.com' || domain.endsWith('.tiktok.com')) return 'tiktok';
  if (domain === 'tumblr.com' || domain.endsWith('.tumblr.com')) return 'tumblr';
  if (
    domain === 'threads.net' ||
    domain.endsWith('.threads.net') ||
    domain === 'threads.com' ||
    domain.endsWith('.threads.com')
  ) return 'threads';
  if (domain === 'substack.com' || domain.endsWith('.substack.com')) return 'substack';
  if (domain === 'pinterest.com' || domain.endsWith('.pinterest.com') || domain === 'pin.it') return 'pinterest';
  return 'other';
}

export async function getFolders(db: SQLiteDatabase) {
  return db.getAllAsync<Folder>(`
    SELECT f.*, COUNT(CASE WHEN b.status = 'active' THEN 1 END) AS bookmark_count
    FROM folders f
    LEFT JOIN bookmark_folders bf ON bf.folder_id = f.id
    LEFT JOIN bookmarks b ON b.id = bf.bookmark_id
    GROUP BY f.id
    ORDER BY CASE WHEN f.id = 1 THEN 0 ELSE 1 END, f.name COLLATE NOCASE
  `);
}

export async function createFolder(db: SQLiteDatabase, name: string, color: string, icon: string) {
  const cleanName = name.trim();
  if (!cleanName) throw new Error('Folder name is required.');
  const result = await db.runAsync(
    'INSERT INTO folders (name, color, icon) VALUES (?, ?, ?)',
    cleanName,
    color,
    icon,
  );
  return result.lastInsertRowId;
}

export async function renameFolder(db: SQLiteDatabase, id: number, name: string) {
  const cleanName = name.trim();
  if (!cleanName) throw new Error('Folder name is required.');
  await db.runAsync('UPDATE folders SET name = ? WHERE id = ?', cleanName, id);
}

export async function updateFolderColor(db: SQLiteDatabase, id: number, color: string) {
  await db.runAsync('UPDATE folders SET color = ? WHERE id = ?', color, id);
}

export async function updateFolderIcon(db: SQLiteDatabase, id: number, icon: string) {
  await db.runAsync('UPDATE folders SET icon = ? WHERE id = ?', icon, id);
}

export async function deleteFolder(db: SQLiteDatabase, id: number) {
  if (id === 1) throw new Error('Inbox cannot be deleted.');

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT OR IGNORE INTO bookmark_folders (bookmark_id, folder_id)
       SELECT bf.bookmark_id, 1
       FROM bookmark_folders bf
       JOIN bookmarks b ON b.id = bf.bookmark_id
       WHERE bf.folder_id = ? AND b.folder_id = ?`,
      id,
      id,
    );
    await db.runAsync(
      'UPDATE bookmarks SET folder_id = 1, updated_at = CURRENT_TIMESTAMP WHERE folder_id = ?',
      id,
    );
    await db.runAsync('DELETE FROM folders WHERE id = ?', id);
  });
}

export async function listBookmarks(db: SQLiteDatabase, filters: BookmarkFilters = {}) {
  const clauses = ['1 = 1'];
  const params: (string | number)[] = [];
  const folderJoin =
    filters.folderId !== undefined ? 'JOIN folders f ON f.id = ?' : 'JOIN folders f ON f.id = b.folder_id';

  if (filters.folderId !== undefined) params.push(filters.folderId);

  clauses.push('b.status = ?');
  params.push(filters.status ?? 'active');

  if (filters.folderId !== undefined) {
    clauses.push(
      'EXISTS (SELECT 1 FROM bookmark_folders bf WHERE bf.bookmark_id = b.id AND bf.folder_id = ?)',
    );
    params.push(filters.folderId);
  }
  if (filters.favoritesOnly) {
    clauses.push('b.is_favorite = 1');
  }
  if (filters.sourceKey) {
    clauses.push('b.source_key = ?');
    params.push(filters.sourceKey);
  }
  if (filters.query?.trim()) {
    clauses.push('(b.title LIKE ? OR b.url LIKE ? OR b.description LIKE ?)');
    const query = `%${filters.query.trim()}%`;
    params.push(query, query, query);
  }

  const limit = filters.limit ? `LIMIT ${Math.max(1, Math.floor(filters.limit))}` : '';
  return db.getAllAsync<Bookmark>(
    `SELECT b.*, f.name AS folder_name, f.color AS folder_color
     FROM bookmarks b
     ${folderJoin}
     WHERE ${clauses.join(' AND ')}
     ORDER BY b.created_at DESC
     ${limit}`,
    params,
  );
}

export async function getBookmark(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<Bookmark>(
    `SELECT b.*, f.name AS folder_name, f.color AS folder_color
     FROM bookmarks b
     JOIN folders f ON f.id = b.folder_id
     WHERE b.id = ?`,
    id,
  );
}

export async function addBookmark(
  db: SQLiteDatabase,
  input: { url: string; title?: string; folderId?: number },
) {
  const normalizedUrl = normalizeUrl(input.url);
  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM bookmarks WHERE normalized_url = ?',
    normalizedUrl,
  );
  if (existing) {
    if (input.folderId !== undefined) {
      await db.runAsync(
        'INSERT OR IGNORE INTO bookmark_folders (bookmark_id, folder_id) VALUES (?, ?)',
        existing.id,
        input.folderId,
      );
    }
    return { id: existing.id, duplicate: true as const };
  }

  const title = input.title?.trim() || domainFromUrl(normalizedUrl);
  const sourceKey = sourceFromUrl(normalizedUrl);
  const result = await db.runAsync(
    `INSERT INTO bookmarks (url, normalized_url, title, folder_id, source_key)
     VALUES (?, ?, ?, ?, ?)`,
    normalizedUrl,
    normalizedUrl,
    title,
    input.folderId ?? 1,
    sourceKey,
  );
  await db.runAsync(
    'INSERT OR IGNORE INTO bookmark_folders (bookmark_id, folder_id) VALUES (?, ?)',
    result.lastInsertRowId,
    input.folderId ?? 1,
  );
  return { id: result.lastInsertRowId, duplicate: false as const };
}

export async function getBookmarkSources(db: SQLiteDatabase, status: BookmarkStatus = 'active') {
  const rows = await db.getAllAsync<{ source_key: SourceKey; count: number }>(
    `SELECT source_key, COUNT(*) AS count
     FROM bookmarks
     WHERE status = ?
     GROUP BY source_key
     ORDER BY count DESC, source_key ASC`,
    status,
  );

  return rows.map<BookmarkSource>((row) => ({
    key: row.source_key,
    label: SOURCE_APPS[row.source_key]?.label ?? SOURCE_APPS.other.label,
    color: SOURCE_APPS[row.source_key]?.color ?? SOURCE_APPS.other.color,
    count: row.count,
  }));
}

export async function updateBookmarkMetadata(
  db: SQLiteDatabase,
  id: number,
  metadata: { title?: string; description?: string; imageUrl?: string; faviconUrl?: string },
) {
  await db.runAsync(
    `UPDATE bookmarks
     SET title = COALESCE(?, title),
         description = COALESCE(?, description),
         image_url = COALESCE(?, image_url),
         favicon_url = COALESCE(?, favicon_url),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    metadata.title?.trim() || null,
    metadata.description?.trim() || null,
    metadata.imageUrl?.trim() || null,
    metadata.faviconUrl?.trim() || null,
    id,
  );
}

export async function updateBookmarkTitle(db: SQLiteDatabase, id: number, title: string) {
  await db.runAsync(
    'UPDATE bookmarks SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    title.trim(),
    id,
  );
}

export async function moveBookmark(db: SQLiteDatabase, id: number, folderId: number) {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'UPDATE bookmarks SET folder_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      folderId,
      id,
    );
    await db.runAsync('DELETE FROM bookmark_folders WHERE bookmark_id = ?', id);
    await db.runAsync(
      'INSERT INTO bookmark_folders (bookmark_id, folder_id) VALUES (?, ?)',
      id,
      folderId,
    );
  });
}

async function insertBookmarkFolders(db: SQLiteDatabase, ids: number[], folderIds: number[]) {
  for (const bookmarkId of ids) {
    for (const folderId of folderIds) {
      await db.runAsync(
        'INSERT OR IGNORE INTO bookmark_folders (bookmark_id, folder_id) VALUES (?, ?)',
        bookmarkId,
        folderId,
      );
    }
  }
}

export async function copyBookmarksToFolders(db: SQLiteDatabase, ids: number[], folderIds: number[]) {
  if (ids.length === 0 || folderIds.length === 0) return;
  await db.withTransactionAsync(async () => {
    await insertBookmarkFolders(db, ids, folderIds);
  });
}

export async function moveBookmarksToFolders(
  db: SQLiteDatabase,
  ids: number[],
  sourceFolderId: number,
  destinationFolderIds: number[],
) {
  if (ids.length === 0 || destinationFolderIds.length === 0) return;
  const placeholders = ids.map(() => '?').join(', ');
  const nextPrimaryFolderId = destinationFolderIds[0];

  await db.withTransactionAsync(async () => {
    await insertBookmarkFolders(db, ids, destinationFolderIds);
    await db.runAsync(
      `DELETE FROM bookmark_folders
       WHERE folder_id = ? AND bookmark_id IN (${placeholders})`,
      [sourceFolderId, ...ids],
    );
    await db.runAsync(
      `UPDATE bookmarks
       SET folder_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE folder_id = ? AND id IN (${placeholders})`,
      [nextPrimaryFolderId, sourceFolderId, ...ids],
    );
  });
}

export async function setFavorite(db: SQLiteDatabase, id: number, favorite: boolean) {
  await db.runAsync(
    'UPDATE bookmarks SET is_favorite = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    favorite ? 1 : 0,
    id,
  );
}

export async function setBookmarkStatus(db: SQLiteDatabase, id: number, status: BookmarkStatus) {
  await db.runAsync(
    'UPDATE bookmarks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    status,
    id,
  );
}

export async function setBookmarksStatus(db: SQLiteDatabase, ids: number[], status: BookmarkStatus) {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => '?').join(', ');
  await db.runAsync(
    `UPDATE bookmarks
     SET status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id IN (${placeholders})`,
    [status, ...ids],
  );
}

export async function markOpened(db: SQLiteDatabase, id: number) {
  await db.runAsync('UPDATE bookmarks SET last_opened_at = CURRENT_TIMESTAMP WHERE id = ?', id);
}

export async function permanentlyDeleteBookmark(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM bookmarks WHERE id = ? AND status = ?', id, 'trash');
}

export async function getLibraryStats(db: SQLiteDatabase) {
  const bookmarkResult = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM bookmarks WHERE status = 'active'",
  );
  const folderResult = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM folders');
  return { bookmarks: bookmarkResult?.count ?? 0, folders: folderResult?.count ?? 0 };
}
