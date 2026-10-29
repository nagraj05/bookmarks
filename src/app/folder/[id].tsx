import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookmarkCard } from '@/components/bookmark-card';
import { EmptyState } from '@/components/brutal';
import { useTheme } from '@/hooks/use-theme';
import { type Bookmark, type Folder, getFolders, listBookmarks } from '@/lib/bookmarks';

export default function FolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const theme = useTheme();
  const folderId = Number(id);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const load = useCallback(async () => {
    const [folders, rows] = await Promise.all([
      getFolders(db),
      listBookmarks(db, { folderId, status: 'active' }),
    ]);
    setFolder(folders.find((item) => item.id === folderId) ?? null);
    setBookmarks(rows);
  }, [db, folderId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.back,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                shadowColor: theme.shadow,
                boxShadow: `${pressed ? 1 : 5}px ${pressed ? 1 : 5}px 0px ${theme.shadow}`,
                transform: [
                  { translateX: pressed ? 4 : 0 },
                  { translateY: pressed ? 4 : 0 },
                ],
              },
            ]}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              tintColor={theme.text}
              size={22}
              style={styles.backIcon}
            />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>{folder?.name ?? 'Folder'}</Text>
          </View>
        </View>

        <View style={styles.list}>
          {bookmarks.length === 0 ? (
            <View style={styles.emptySlot}>
              <EmptyState
                title="Folder is empty"
                body="Move an existing bookmark here from its detail screen."
              />
            </View>
          ) : (
            bookmarks.map((bookmark) => (
              <View key={bookmark.id} style={styles.cardSlot}>
                <BookmarkCard
                  bookmark={bookmark}
                  onPress={() => router.push({ pathname: '/bookmark/[id]', params: { id: String(bookmark.id) } })}
                />
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 18, paddingBottom: 40, gap: 26 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  back: {
    width: 44,
    height: 44,
    borderWidth: 3,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  backIcon: { width: 22, height: 22 },
  headerCopy: { flex: 1 },
  title: { fontSize: 30, lineHeight: 34, fontWeight: '900', letterSpacing: -0.7 },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' },
  cardSlot: { width: '48%' },
  emptySlot: { width: '100%' },
});
