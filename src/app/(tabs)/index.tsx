import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookmarkCard } from '@/components/bookmark-card';
import { BrutalButton, BrutalCard, EmptyState, ScreenHeader } from '@/components/brutal';
import { useTheme } from '@/hooks/use-theme';
import {
  type Bookmark,
  type BookmarkStatus,
  type BookmarkSource,
  type SourceKey,
  getBookmarkSources,
  getLibraryStats,
  listBookmarks,
} from '@/lib/bookmarks';

type LibraryFilter = 'all' | 'favorites' | 'archived' | 'trash';

const filterIcons = {
  favorites: { ios: 'star.fill', android: 'star', web: 'star' },
  archived: { ios: 'archivebox.fill', android: 'archive', web: 'archive' },
  trash: { ios: 'trash.fill', android: 'delete', web: 'delete' },
} as const;

const filterLabels: { key: LibraryFilter; label: string; icon?: keyof typeof filterIcons }[] = [
  { key: 'all', label: 'All' },
  { key: 'favorites', label: 'Favorites', icon: 'favorites' },
  { key: 'archived', label: 'Archive', icon: 'archived' },
  { key: 'trash', label: 'Trash', icon: 'trash' },
];

export default function LibraryScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [stats, setStats] = useState({ bookmarks: 0, folders: 0 });
  const [sources, setSources] = useState<BookmarkSource[]>([]);
  const [sourceFilter, setSourceFilter] = useState<SourceKey | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const status: BookmarkStatus = filter === 'archived' ? 'archived' : filter === 'trash' ? 'trash' : 'active';
    const [rows, nextStats, nextSources] = await Promise.all([
      listBookmarks(db, {
        status,
        favoritesOnly: filter === 'favorites',
        query,
        sourceKey: sourceFilter ?? undefined,
      }),
      getLibraryStats(db),
      getBookmarkSources(db, status),
    ]);
    setBookmarks(rows);
    setStats(nextStats);
    setSources(nextSources);
    setLoading(false);
  }, [db, filter, query, sourceFilter]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    const timeout = setTimeout(() => void load(), 180);
    return () => clearTimeout(timeout);
  }, [load]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title="Bookmarks"
          action={
            <BrutalButton compact onPress={() => router.push('/add')} backgroundColor={theme.pink}>
              + ADD
            </BrutalButton>
          }
        />

        <View style={styles.statsRow}>
          <BrutalCard backgroundColor={theme.yellow} style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.bookmarks}</Text>
            <Text style={styles.statLabel}>SAVED</Text>
          </BrutalCard>
          <BrutalCard backgroundColor={theme.blue} style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.folders}</Text>
            <Text style={styles.statLabel}>FOLDERS</Text>
          </BrutalCard>
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search titles, links, notes…"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          style={[
            styles.search,
            {
              color: theme.text,
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
              shadowColor: theme.shadow,
              boxShadow: `6px 6px 0px ${theme.shadow}`,
            },
          ]}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filterLabels.map((item) => {
            const selected = filter === item.key;
            const labelColor = selected ? '#111111' : theme.text;
            return (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key)}
                style={[
                  styles.filter,
                  {
                    backgroundColor: selected ? theme.green : theme.backgroundElement,
                    borderColor: theme.border,
                    shadowColor: theme.shadow,
                    boxShadow: `3px 3px 0px ${theme.shadow}`,
                  },
                ]}>
                <View style={styles.filterContent}>
                  {item.icon ? (
                    <SymbolView
                      name={filterIcons[item.icon]}
                      tintColor={labelColor}
                      size={15}
                      style={styles.filterIcon}
                    />
                  ) : null}
                  <Text style={[styles.filterText, { color: labelColor }]}>{item.label}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {sources.length > 0 ? (
          <View style={styles.sourceSection}>
            <Text style={[styles.filterLabel, { color: theme.text }]}>FILTER BY APP</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              <Pressable
                onPress={() => setSourceFilter(null)}
                style={[
                  styles.sourceFilter,
                  {
                    backgroundColor: sourceFilter === null ? theme.yellow : theme.backgroundElement,
                    borderColor: theme.border,
                    shadowColor: theme.shadow,
                    boxShadow: `3px 3px 0px ${theme.shadow}`,
                  },
                ]}>
                <Text
                  style={[
                    styles.filterText,
                    { color: sourceFilter === null ? '#111111' : theme.text },
                  ]}>
                  ALL
                </Text>
              </Pressable>
              {sources.map((source) => (
                <Pressable
                  key={source.key}
                  onPress={() => setSourceFilter(source.key)}
                  style={[
                    styles.sourceFilter,
                    {
                      backgroundColor: sourceFilter === source.key ? source.color : theme.backgroundElement,
                      borderColor: theme.border,
                      shadowColor: theme.shadow,
                      boxShadow: `3px 3px 0px ${theme.shadow}`,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.filterText,
                      { color: sourceFilter === source.key ? '#111111' : theme.text },
                    ]}>
                    {source.label.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {filter === 'all' ? 'RECENTLY SAVED' : filter.toUpperCase()}
          </Text>
          <Text style={[styles.resultCount, { color: theme.textSecondary }]}>{bookmarks.length}</Text>
        </View>

        <View style={styles.list}>
          {!loading && bookmarks.length === 0 ? (
            <View style={styles.emptySlot}>
              <EmptyState
                title={query ? 'No matches' : 'Nothing here yet'}
                body={query ? 'Try a shorter search.' : 'Share a link to Bookmarks and it will land in your Inbox.'}
              />
            </View>
          ) : (
            bookmarks.map((bookmark) => (
              <View key={bookmark.id} style={styles.cardSlot}>
                <BookmarkCard
                  bookmark={bookmark}
                  onPress={() =>
                    router.push({ pathname: '/bookmark/[id]', params: { id: String(bookmark.id) } })
                  }
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
  content: { padding: 18, paddingBottom: 36, gap: 20 },
  statsRow: { flexDirection: 'row', gap: 14 },
  statCard: { flex: 1, padding: 14 },
  statNumber: { color: '#111111', fontSize: 30, lineHeight: 32, fontWeight: '900' },
  statLabel: { color: '#111111', fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  search: {
    height: 52,
    borderWidth: 3,
    borderRadius: 12,
    paddingLeft: 24,
    paddingRight: 16,
    paddingVertical: 0,
    fontSize: 15,
    fontWeight: '700',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  filters: {
    gap: 9,
    paddingTop: 1,
    paddingRight: 12,
    paddingBottom: 8,
  },
  filter: {
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 13,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  sourceSection: { gap: 8 },
  filterLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
  sourceFilter: {
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  filterText: { fontSize: 12, fontWeight: '900' },
  filterContent: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  filterIcon: { width: 15, height: 15 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 15, fontWeight: '900', letterSpacing: 1.2 },
  resultCount: { fontSize: 13, fontWeight: '900' },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' },
  cardSlot: { width: '48%' },
  emptySlot: { width: '100%' },
});
