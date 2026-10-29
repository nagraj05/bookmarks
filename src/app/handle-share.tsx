import { router } from 'expo-router';
import { useIncomingShare } from 'expo-sharing';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrutalCard } from '@/components/brutal';
import { useTheme } from '@/hooks/use-theme';
import { addBookmark, updateBookmarkMetadata } from '@/lib/bookmarks';
import { extractFirstUrl, fetchLinkMetadata } from '@/lib/metadata';
import { useGlobalLoading } from '@/providers/global-loading';

export default function HandleShareScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const { runWithLoader } = useGlobalLoading();
  const { sharedPayloads, clearSharedPayloads, error } = useIncomingShare();
  const handled = useRef(false);
  const [phase, setPhase] = useState<'idle' | 'processing' | 'saved' | 'duplicate' | 'invalid' | 'failed'>('idle');

  useEffect(() => {
    if (handled.current || sharedPayloads.length === 0) return;
    handled.current = true;

    const payload = sharedPayloads.find((item) => item.shareType === 'url') ?? sharedPayloads[0];
    const url = payload.shareType === 'url' ? payload.value : extractFirstUrl(payload.value ?? '');

    void (async () => {
      await Promise.resolve();
      if (!url) {
        setPhase('invalid');
        clearSharedPayloads();
        return;
      }

      setPhase('processing');
      try {
        await runWithLoader(async () => {
          const result = await addBookmark(db, { url, folderId: 1 });
          setPhase(result.duplicate ? 'duplicate' : 'saved');
          if (!result.duplicate) {
            void fetchLinkMetadata(url).then((metadata) => updateBookmarkMetadata(db, result.id, metadata));
          }
          clearSharedPayloads();
          setTimeout(() => {
            if (Platform.OS === 'android') BackHandler.exitApp();
            else router.replace('/');
          }, 250);
        }, 'Saving shared link…');
      } catch {
        setPhase('failed');
        clearSharedPayloads();
      }
    })();
  }, [clearSharedPayloads, db, runWithLoader, sharedPayloads]);

  const message = error
    ? 'The shared link could not be read.'
    : phase === 'invalid'
      ? 'No link found in this share.'
      : phase === 'failed'
        ? 'That link could not be saved.'
        : phase === 'duplicate'
          ? 'Already saved — returning…'
          : phase === 'saved'
            ? 'Saved to Inbox — returning…'
            : 'Reading shared link…';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <BrutalCard backgroundColor={theme.green} style={styles.card}>
          <Text style={styles.mark}>↗</Text>
          <Text style={styles.title}>BOOKMARKS</Text>
          <Text style={styles.message}>{message}</Text>
          {phase === 'idle' || phase === 'processing' ? <ActivityIndicator color="#111111" /> : null}
        </BrutalCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  card: { width: '100%', padding: 28, alignItems: 'center', gap: 10 },
  mark: { color: '#111111', fontSize: 54, fontWeight: '900' },
  title: { color: '#111111', fontSize: 25, fontWeight: '900', letterSpacing: 1.5 },
  message: { color: '#111111', textAlign: 'center', fontSize: 15, fontWeight: '700' },
});
