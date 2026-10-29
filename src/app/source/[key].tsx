import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import { Alert, BackHandler, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookmarkCard } from '@/components/bookmark-card';
import { BrutalButton, BrutalCard, EmptyState } from '@/components/brutal';
import { SourceIcon } from '@/components/source-icon';
import { useTheme } from '@/hooks/use-theme';
import {
  type Bookmark,
  SOURCE_APPS,
  type SourceKey,
  listBookmarks,
  setBookmarksStatus,
} from '@/lib/bookmarks';
import { goBackOrLibrary } from '@/lib/navigation';
import { useGlobalLoading } from '@/providers/global-loading';

function isSourceKey(value: string | undefined): value is SourceKey {
  return Boolean(value && Object.prototype.hasOwnProperty.call(SOURCE_APPS, value));
}

export default function SourceFolderScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const db = useSQLiteContext();
  const theme = useTheme();
  const { runWithLoader } = useGlobalLoading();
  const sourceKey: SourceKey = isSourceKey(key) ? key : 'other';
  const source = SOURCE_APPS[sourceKey];
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [bulkWorking, setBulkWorking] = useState(false);
  const selectionMode = selectedIds.size > 0;
  const allSelected = bookmarks.length > 0 && selectedIds.size === bookmarks.length;

  const load = useCallback(async () => {
    try {
      setBookmarks(await listBookmarks(db, { sourceKey, status: 'active' }));
    } finally {
      setLoading(false);
    }
  }, [db, sourceKey]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setConfirmingDelete(false);
  }, []);

  useEffect(() => {
    if (!selectionMode) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      clearSelection();
      return true;
    });
    return () => subscription.remove();
  }, [clearSelection, selectionMode]);

  const toggleSelection = (bookmarkId: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(bookmarkId)) next.delete(bookmarkId);
      else next.add(bookmarkId);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(bookmarks.map((bookmark) => bookmark.id)));
  };

  const deleteSelected = async () => {
    const bookmarkIds = [...selectedIds];
    setBulkWorking(true);
    try {
      await runWithLoader(async () => {
        await setBookmarksStatus(db, bookmarkIds, 'trash');
        clearSelection();
        await load();
      }, `Moving ${bookmarkIds.length} bookmark${bookmarkIds.length === 1 ? '' : 's'} to Trash…`);
    } catch {
      Alert.alert('Could not delete bookmarks', 'Please try again.');
    } finally {
      setBulkWorking(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={[styles.content, selectionMode && styles.contentSelecting]}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={selectionMode ? 'Cancel selection' : 'Go back'}
            onPress={selectionMode ? clearSelection : goBackOrLibrary}
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
              name={
                selectionMode
                  ? { ios: 'xmark', android: 'close', web: 'close' }
                  : { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }
              }
              tintColor={theme.text}
              size={22}
              style={styles.backIcon}
            />
          </Pressable>
          {!selectionMode ? (
            <View style={[styles.sourceIcon, { backgroundColor: '#FFFFFF', borderColor: theme.border }]}>
              <SourceIcon sourceKey={sourceKey} size={38} />
            </View>
          ) : null}
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
              {selectionMode ? `${selectedIds.size} selected` : source.label}
            </Text>
          </View>
          {selectionMode ? (
            <BrutalButton compact backgroundColor={theme.yellow} onPress={selectAll}>
              {allSelected ? 'CLEAR' : 'SELECT ALL'}
            </BrutalButton>
          ) : null}
        </View>

        <View style={styles.list}>
          {!loading && bookmarks.length === 0 ? (
            <View style={styles.emptySlot}>
              <EmptyState title="No links here" body={`Share a ${source.label} link and it will appear automatically.`} />
            </View>
          ) : (
            bookmarks.map((bookmark) => (
              <View key={bookmark.id} style={styles.cardSlot}>
                <BookmarkCard
                  bookmark={bookmark}
                  selectionMode={selectionMode}
                  selected={selectedIds.has(bookmark.id)}
                  onLongPress={() => toggleSelection(bookmark.id)}
                  onPress={() => {
                    if (selectionMode) toggleSelection(bookmark.id);
                    else router.push({ pathname: '/bookmark/[id]', params: { id: String(bookmark.id) } });
                  }}
                />
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {selectionMode ? (
        <View
          style={[
            styles.bulkBar,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
              shadowColor: theme.shadow,
              boxShadow: `0px -5px 0px ${theme.shadow}`,
            },
          ]}>
          <BrutalButton
            style={styles.deleteButton}
            backgroundColor={theme.danger}
            onPress={() => setConfirmingDelete(true)}>
            DELETE
          </BrutalButton>
        </View>
      ) : null}

      <Modal
        visible={confirmingDelete}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (!bulkWorking) setConfirmingDelete(false);
        }}>
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close delete confirmation"
            style={styles.modalBackdrop}
            onPress={() => {
              if (!bulkWorking) setConfirmingDelete(false);
            }}
          />
          <BrutalCard backgroundColor={theme.backgroundElement} style={styles.modalCard}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>DELETE SELECTED?</Text>
            <Text style={[styles.modalBody, { color: theme.textSecondary }]}>Selected bookmarks will be moved to Trash.</Text>
            <View style={styles.modalActions}>
              <BrutalButton
                compact
                style={styles.modalAction}
                disabled={bulkWorking}
                backgroundColor={theme.background}
                onPress={() => setConfirmingDelete(false)}>
                CANCEL
              </BrutalButton>
              <BrutalButton
                compact
                style={styles.modalAction}
                loading={bulkWorking}
                backgroundColor={theme.danger}
                onPress={() => void deleteSelected()}>
                DELETE
              </BrutalButton>
            </View>
          </BrutalCard>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 18, paddingBottom: 40, gap: 26 },
  contentSelecting: { paddingBottom: 130 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
  sourceIcon: {
    width: 50,
    height: 50,
    borderWidth: 3,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1, gap: 2 },
  title: { fontSize: 27, lineHeight: 31, fontWeight: '900' },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  cardSlot: { width: '47%' },
  emptySlot: { marginRight: 7, marginBottom: 7 },
  bulkBar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    borderTopWidth: 3,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
  },
  deleteButton: { width: '100%' },
  modalRoot: { flex: 1, justifyContent: 'center', padding: 18 },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  modalCard: { padding: 18, gap: 13 },
  modalTitle: { fontSize: 21, lineHeight: 25, fontWeight: '900' },
  modalBody: { fontSize: 13, lineHeight: 19, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalAction: { flex: 1 },
});
