import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { SOURCE_APPS, type Bookmark } from '@/lib/bookmarks';

export function BookmarkCard({ bookmark, onPress }: { bookmark: Bookmark; onPress: () => void }) {
  const theme = useTheme();
  const [previewFailed, setPreviewFailed] = useState(false);
  const source = SOURCE_APPS[bookmark.source_key] ?? SOURCE_APPS.other;

  const domain = (() => {
    try {
      return new URL(bookmark.url).hostname.replace(/^www\./, '');
    } catch {
      return bookmark.url;
    }
  })();

  const hasPreview = Boolean(bookmark.image_url && !previewFailed);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${bookmark.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          shadowColor: theme.shadow,
          boxShadow: `${pressed ? 2 : 7}px ${pressed ? 2 : 7}px 0px ${theme.shadow}`,
          shadowOffset: { width: pressed ? 2 : 7, height: pressed ? 2 : 7 },
          elevation: pressed ? 2 : 7,
          transform: [
            { translateX: pressed ? 5 : 0 },
            { translateY: pressed ? 5 : 0 },
          ],
        },
      ]}>
      <View style={styles.surface}>
        <View style={[styles.media, { backgroundColor: bookmark.folder_color }]}>
          {hasPreview ? (
            <Image
              source={{ uri: bookmark.image_url! }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={150}
              cachePolicy="memory-disk"
              accessibilityLabel={`Preview image for ${bookmark.title}`}
              onError={() => setPreviewFailed(true)}
            />
          ) : bookmark.favicon_url ? (
            <View style={styles.faviconShell}>
              <Image source={{ uri: bookmark.favicon_url }} style={styles.favicon} contentFit="contain" />
            </View>
          ) : (
            <Text style={styles.fallbackLetter}>{domain.slice(0, 1).toUpperCase()}</Text>
          )}

          {bookmark.is_favorite ? (
            <View style={styles.favoriteBadge}>
              <Text style={styles.favorite}>★</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.sourceRow}>
            <View style={[styles.sourceDot, { backgroundColor: source.color, borderColor: theme.border }]} />
            <Text style={[styles.source, { color: theme.textSecondary }]} numberOfLines={1}>
              {source.label}
            </Text>
          </View>

          <Text style={[styles.title, { color: theme.text }]} numberOfLines={3}>
            {bookmark.title}
          </Text>

          <Text style={[styles.domain, { color: theme.textSecondary }]} numberOfLines={1}>
            {domain}
          </Text>

          <View style={styles.footer}>
            <View style={[styles.folder, { backgroundColor: bookmark.folder_color }]}>
              <Text style={styles.folderText} numberOfLines={1}>{bookmark.folder_name}</Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderWidth: 3,
    borderRadius: 14,
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  surface: { flex: 1, overflow: 'hidden', borderRadius: 11 },
  media: {
    width: '100%',
    aspectRatio: 4 / 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faviconShell: {
    width: 52,
    height: 52,
    padding: 9,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.15)',
  },
  favicon: { width: '100%', height: '100%' },
  fallbackLetter: { color: '#111111', fontSize: 42, fontWeight: '800' },
  favoriteBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  favorite: { color: '#FF4F88', fontSize: 17, lineHeight: 20 },
  body: { minHeight: 150, padding: 12, gap: 6 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sourceDot: { width: 7, height: 7, borderRadius: 4, borderWidth: 0.5 },
  source: { flex: 1, fontSize: 10, lineHeight: 13, fontWeight: '700' },
  title: { minHeight: 38, fontSize: 14, lineHeight: 18, fontWeight: '800', letterSpacing: -0.2 },
  domain: { fontSize: 10, lineHeight: 13, fontWeight: '600' },
  footer: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center' },
  folder: { maxWidth: '78%', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  folderText: { color: '#111111', fontSize: 9, lineHeight: 11, fontWeight: '800', textTransform: 'uppercase' },
});
