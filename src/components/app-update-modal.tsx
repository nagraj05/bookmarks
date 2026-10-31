import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrutalButton } from '@/components/brutal';
import { Brutal } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const LATEST_RELEASE_URL = 'https://api.github.com/repos/nagraj05/bookmarks/releases/latest';
const UPDATE_LATER_KEY = 'update_later';
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const REMIND_LATER_MS = 24 * 60 * 60 * 1000;

type UpdateRelease = {
  tag: string;
  version: string;
  apkUrl: string;
};

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

export function AppUpdateModal() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const lastCheckedAt = useRef(0);
  const checking = useRef(false);
  const [release, setRelease] = useState<UpdateRelease | null>(null);
  const [downloadError, setDownloadError] = useState(false);

  const checkForUpdate = useCallback(async () => {
    if (Platform.OS !== 'android' || checking.current) return;
    if (Date.now() - lastCheckedAt.current < CHECK_INTERVAL_MS) return;

    checking.current = true;
    lastCheckedAt.current = Date.now();
    try {
      const response = await fetch(LATEST_RELEASE_URL, {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!response.ok) return;

      const nextRelease = parseRelease((await response.json()) as GitHubRelease);
      const installedVersion = Constants.expoConfig?.version;
      if (!nextRelease || !installedVersion || !isNewerVersion(nextRelease.version, installedVersion)) {
        return;
      }

      const laterRow = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM app_settings WHERE key = ?',
        UPDATE_LATER_KEY,
      );
      if (laterRow) {
        try {
          const later = JSON.parse(laterRow.value) as { tag?: unknown; until?: unknown };
          if (
            later.tag === nextRelease.tag &&
            typeof later.until === 'number' &&
            later.until > Date.now()
          ) {
            return;
          }
        } catch {
          // A malformed preference should not prevent future update prompts.
        }
      }

      setRelease(nextRelease);
    } catch {
      // Update checks must never interrupt normal app startup.
    } finally {
      checking.current = false;
    }
  }, [db]);

  useEffect(() => {
    const initialCheck = setTimeout(() => void checkForUpdate(), 0);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void checkForUpdate();
    });
    return () => {
      clearTimeout(initialCheck);
      subscription.remove();
    };
  }, [checkForUpdate]);

  const remindLater = useCallback(async () => {
    if (!release) return;
    const value = JSON.stringify({ tag: release.tag, until: Date.now() + REMIND_LATER_MS });
    setRelease(null);
    setDownloadError(false);
    try {
      await db.runAsync(
        `INSERT INTO app_settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        UPDATE_LATER_KEY,
        value,
      );
    } catch {
      // Closing the modal is still safe if the reminder preference cannot be saved.
    }
  }, [db, release]);

  const downloadUpdate = useCallback(async () => {
    if (!release) return;
    setDownloadError(false);
    try {
      await Linking.openURL(release.apkUrl);
      setRelease(null);
    } catch {
      setDownloadError(true);
    }
  }, [release]);

  return (
    <Modal
      animationType="fade"
      onRequestClose={() => void remindLater()}
      transparent
      visible={release !== null}>
      <View
        style={[
          styles.backdrop,
          { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) },
        ]}>
        <View
          accessibilityViewIsModal
          style={[
            styles.card,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
              shadowColor: theme.shadow,
              boxShadow: `${Brutal.shadowOffset}px ${Brutal.shadowOffset}px 0px ${theme.shadow}`,
            },
          ]}>
          <View style={styles.headingRow}>
            <View style={[styles.badge, { backgroundColor: theme.green, borderColor: theme.border }]}>
              <Text style={styles.badgeText}>UPDATE</Text>
            </View>
            <Pressable
              accessibilityLabel="Remind me later"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => void remindLater()}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: theme.background, borderColor: theme.border },
                pressed && styles.closePressed,
              ]}>
              <Text style={[styles.closeText, { color: theme.text }]}>×</Text>
            </Pressable>
          </View>

          <View style={styles.copy}>
            <Text style={[styles.title, { color: theme.text }]}>NEW VERSION AVAILABLE</Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>
              Bookmarks {release?.version} is ready to download.
            </Text>
            {downloadError ? (
              <Text style={[styles.error, { color: theme.danger }]}>
                Couldn&apos;t open the download. Try again.
              </Text>
            ) : null}
          </View>

          <View style={styles.actions}>
            <BrutalButton
              backgroundColor={theme.backgroundElement}
              compact
              onPress={() => void remindLater()}
              style={styles.action}>
              LATER
            </BrutalButton>
            <BrutalButton
              backgroundColor={theme.yellow}
              compact
              onPress={() => void downloadUpdate()}
              style={styles.action}>
              DOWNLOAD
            </BrutalButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    padding: 20,
    gap: 20,
    borderWidth: Brutal.borderWidth,
    borderRadius: Brutal.radius,
    shadowOffset: { width: Brutal.shadowOffset, height: Brutal.shadowOffset },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 10,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 2,
    borderRadius: 7,
  },
  badgeText: {
    color: '#111111',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderWidth: 2,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closePressed: { transform: [{ scale: 0.94 }] },
  closeText: { marginTop: -2, fontSize: 26, lineHeight: 28, fontWeight: '700' },
  copy: { gap: 8 },
  title: { fontSize: 25, lineHeight: 29, fontWeight: '900', letterSpacing: -0.5 },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  error: { fontSize: 13, lineHeight: 18, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 12 },
  action: { flex: 1 },
});
