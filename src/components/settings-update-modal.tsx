import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrutalButton } from '@/components/brutal';
import { Brutal } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getAvailableUpdate, type UpdateRelease } from '@/lib/app-update';

type CheckStatus = 'idle' | 'checking' | 'available' | 'current' | 'error';

export function SettingsUpdateModal({
  knownRelease,
  onClose,
  onChecked,
}: {
  knownRelease: UpdateRelease | null;
  onClose: () => void;
  onChecked: (release: UpdateRelease | null) => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<CheckStatus>('idle');
  const [release, setRelease] = useState<UpdateRelease | null>(knownRelease);
  const [downloadError, setDownloadError] = useState(false);
  const resolvedRelease = release ?? knownRelease;
  const resolvedStatus = status === 'idle' && knownRelease ? 'available' : status;

  const checkForUpdate = async () => {
    setStatus('checking');
    setDownloadError(false);
    try {
      const nextRelease = await getAvailableUpdate();
      setRelease(nextRelease);
      setStatus(nextRelease ? 'available' : 'current');
      onChecked(nextRelease);
    } catch {
      setStatus('error');
    }
  };

  const downloadUpdate = async () => {
    if (!resolvedRelease) return;
    setDownloadError(false);
    try {
      await Linking.openURL(resolvedRelease.apkUrl);
      onClose();
    } catch {
      setDownloadError(true);
    }
  };

  const title =
    resolvedStatus === 'available'
      ? 'NEW VERSION AVAILABLE'
      : resolvedStatus === 'current'
        ? 'NO UPDATES AVAILABLE'
        : resolvedStatus === 'error'
          ? 'COULDN’T CHECK'
          : resolvedStatus === 'checking'
            ? 'CHECKING FOR UPDATES…'
            : 'CHECK FOR UPDATES';

  const body =
    resolvedStatus === 'available'
      ? `Bookmarks ${resolvedRelease?.version} is ready to download.`
      : resolvedStatus === 'current'
        ? 'You already have the latest version of Bookmarks.'
        : resolvedStatus === 'error'
          ? 'Check your internet connection and try again.'
          : resolvedStatus === 'checking'
            ? 'Looking for the latest Bookmarks release.'
            : 'See whether a newer version of Bookmarks is available.';

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
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
              accessibilityLabel="Close update check"
              accessibilityRole="button"
              hitSlop={10}
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: theme.background, borderColor: theme.border },
                pressed && styles.closePressed,
              ]}>
              <Text style={[styles.closeText, { color: theme.text }]}>×</Text>
            </Pressable>
          </View>

          <View style={styles.copy}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>{body}</Text>
            {downloadError ? (
              <Text style={[styles.error, { color: theme.danger }]}>Couldn&apos;t open the download. Try again.</Text>
            ) : null}
          </View>

          {resolvedStatus === 'available' ? (
            <BrutalButton backgroundColor={theme.yellow} onPress={() => void downloadUpdate()}>
              DOWNLOAD
            </BrutalButton>
          ) : (
            <BrutalButton
              backgroundColor={theme.yellow}
              disabled={resolvedStatus === 'checking'}
              loading={resolvedStatus === 'checking'}
              onPress={() => void checkForUpdate()}>
              {resolvedStatus === 'idle'
                ? 'CHECK FOR UPDATES'
                : resolvedStatus === 'error'
                  ? 'TRY AGAIN'
                  : 'CHECK AGAIN'}
            </BrutalButton>
          )}
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
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: 2, borderRadius: 7 },
  badgeText: { color: '#111111', fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
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
});
