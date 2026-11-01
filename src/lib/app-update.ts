import Constants from 'expo-constants';
import { Platform } from 'react-native';

const LATEST_RELEASE_URL = 'https://api.github.com/repos/nagraj05/bookmarks/releases/latest';

export type UpdateRelease = {
  tag: string;
  version: string;
  apkUrl: string;
};

let cachedAvailableUpdate: UpdateRelease | null = null;

type GitHubRelease = {
  tag_name?: unknown;
  assets?: unknown;
};

type GitHubAsset = {
  name?: unknown;
  browser_download_url?: unknown;
};

function versionParts(value: string) {
  const normalized = value.trim().replace(/^v/i, '').split('-')[0];
  if (!/^\d+(?:\.\d+)*$/.test(normalized)) return null;
  return normalized.split('.').map(Number);
}

function isNewerVersion(latest: string, installed: string) {
  const latestParts = versionParts(latest);
  const installedParts = versionParts(installed);
  if (!latestParts || !installedParts) return false;

  const length = Math.max(latestParts.length, installedParts.length);
  for (let index = 0; index < length; index += 1) {
    const latestPart = latestParts[index] ?? 0;
    const installedPart = installedParts[index] ?? 0;
    if (latestPart !== installedPart) return latestPart > installedPart;
  }
  return false;
}

function parseRelease(value: GitHubRelease): UpdateRelease | null {
  if (typeof value.tag_name !== 'string' || !Array.isArray(value.assets)) return null;

  const apk = (value.assets as GitHubAsset[]).find(
    (asset) =>
      typeof asset.name === 'string' &&
      asset.name.toLowerCase().endsWith('.apk') &&
      typeof asset.browser_download_url === 'string',
  );
  if (!apk || typeof apk.browser_download_url !== 'string') return null;

  return {
    tag: value.tag_name,
    version: value.tag_name.replace(/^v/i, ''),
    apkUrl: apk.browser_download_url,
  };
}

export async function getAvailableUpdate() {
  if (Platform.OS !== 'android') return null;

  const response = await fetch(LATEST_RELEASE_URL, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) throw new Error(`Update check failed with status ${response.status}`);

  const release = parseRelease((await response.json()) as GitHubRelease);
  const installedVersion = Constants.expoConfig?.version;
  if (!release || !installedVersion || !isNewerVersion(release.version, installedVersion)) {
    cachedAvailableUpdate = null;
    return null;
  }

  cachedAvailableUpdate = release;
  return release;
}

export function getCachedAvailableUpdate() {
  return cachedAvailableUpdate;
}
