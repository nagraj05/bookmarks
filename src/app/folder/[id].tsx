import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import { Alert, BackHandler, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookmarkCard } from '@/components/bookmark-card';
import { BrutalButton, BrutalCard, EmptyState } from '@/components/brutal';
import { useTheme } from '@/hooks/use-theme';
import { readableTextColor } from '@/lib/color';
import { goBackOrLibrary } from '@/lib/navigation';
import {
  type Bookmark,
  type Folder,
  copyBookmarksToFolders,
  getFolders,
  listBookmarks,
  moveBookmarksToFolders,
  setBookmarksStatus,
} from '@/lib/bookmarks';
import { useGlobalLoading } from '@/providers/global-loading';

export default function FolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const theme = useTheme();
  const { runWithLoader } = useGlobalLoading();
  const folderId = Number(id);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [bulkAction, setBulkAction] = useState<'move' | 'copy' | 'delete' | null>(null);
  const [destinationIds, setDestinationIds] = useState<Set<number>>(() => new Set());
  const [bulkWorking, setBulkWorking] = useState(false);

  const selectionMode = selectedIds.size > 0;
  const allSelected = bookmarks.length > 0 && selectedIds.size === bookmarks.length;
  const availableFolders = folders.filter((item) => item.id !== folderId);

  const load = useCallback(async () => {
    const [folders, rows] = await Promise.all([
      getFolders(db),
      listBookmarks(db, { folderId, status: 'active' }),
    ]);
    setFolders(folders);
    setFolder(folders.find((item) => item.id === folderId) ?? null);
    setBookmarks(rows);
    const visibleIds = new Set(rows.map((item) => item.id));
    setSelectedIds((current) => {
      if ([...current].every((bookmarkId) => visibleIds.has(bookmarkId))) return current;
      return new Set([...current].filter((bookmarkId) => visibleIds.has(bookmarkId)));
    });
  }, [db, folderId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setDestinationIds(new Set());
    setBulkAction(null);
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
    setSelectedIds(allSelected ? new Set() : new Set(bookmarks.map((item) => item.id)));
  };

  const openFolderAction = (action: 'move' | 'copy') => {
    setDestinationIds(new Set());
    setBulkAction(action);
  };

  const toggleDestination = (destinationFolderId: number) => {
    setDestinationIds((current) => {
      const next = new Set(current);
      if (next.has(destinationFolderId)) next.delete(destinationFolderId);
      else next.add(destinationFolderId);
      return next;
    });
  };

  const applyFolderAction = async () => {
    if ((bulkAction !== 'move' && bulkAction !== 'copy') || destinationIds.size === 0) return;
    const bookmarkIds = [...selectedIds];
    const folderIds = [...destinationIds];
    const actionLabel = bulkAction === 'copy' ? 'Copying' : 'Moving';

    setBulkWorking(true);
    try {
      await runWithLoader(async () => {
        if (bulkAction === 'copy') await copyBookmarksToFolders(db, bookmarkIds, folderIds);
        else await moveBookmarksToFolders(db, bookmarkIds, folderId, folderIds);
        clearSelection();
        await load();
      }, `${actionLabel} ${bookmarkIds.length} bookmark${bookmarkIds.length === 1 ? '' : 's'}…`);
    } catch {
      Alert.alert(`Could not ${bulkAction} bookmarks`, 'Please try again.');
    } finally {
      setBulkWorking(false);
    }
  };

  const deleteSelected = async () => {
    setBulkWorking(true);
    try {
      await runWithLoader(async () => {
        await setBookmarksStatus(db, [...selectedIds], 'trash');
        clearSelection();
        await load();
      }, `Moving ${selectedIds.size} bookmark${selectedIds.size === 1 ? '' : 's'} to Trash…`);
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
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
              {selectionMode ? `${selectedIds.size} selected` : (folder?.name ?? 'Folder')}
            </Text>
          </View>
          {selectionMode ? (
            <BrutalButton compact backgroundColor={theme.yellow} onPress={selectAll}>
              {allSelected ? 'CLEAR' : 'SELECT ALL'}
            </BrutalButton>
          ) : null}
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
            style={styles.bulkButton}
            backgroundColor={theme.blue}
            onPress={() => openFolderAction('move')}>
            MOVE
          </BrutalButton>
          <BrutalButton
            style={styles.bulkButton}
            backgroundColor={theme.green}
            onPress={() => openFolderAction('copy')}>
            COPY
          </BrutalButton>
          <BrutalButton
            style={styles.bulkButton}
            backgroundColor={theme.danger}
            onPress={() => setBulkAction('delete')}>
            DELETE
          </BrutalButton>
        </View>
      ) : null}

      <Modal
        visible={bulkAction !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (!bulkWorking) setBulkAction(null);
        }}>
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close bulk action"
            style={styles.modalBackdrop}
            onPress={() => {
              if (!bulkWorking) setBulkAction(null);
            }}
          />
          <BrutalCard backgroundColor={theme.backgroundElement} style={styles.modalCard}>
            {bulkAction === 'move' || bulkAction === 'copy' ? (
              <>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {bulkAction.toUpperCase()}
                </Text>
                <Text style={[styles.modalBody, { color: theme.textSecondary }]}>Choose one or more folders.</Text>
                <ScrollView style={styles.folderChoices} contentContainerStyle={styles.folderChoicesContent}>
                  {availableFolders.length > 0 ? (
                    availableFolders.map((item) => {
                      const selected = destinationIds.has(item.id);
                      return (
                        <Pressable
                          key={item.id}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: selected }}
                          disabled={bulkWorking}
                          onPress={() => toggleDestination(item.id)}
                          style={({ pressed }) => [
                            styles.folderChoice,
                            {
                              backgroundColor: item.color,
                              borderColor: selected ? theme.pink : theme.border,
                              shadowColor: theme.shadow,
                              boxShadow: `${pressed ? 1 : 4}px ${pressed ? 1 : 4}px 0px ${theme.shadow}`,
                            },
                            pressed && styles.folderChoicePressed,
                          ]}>
                          <Text style={[styles.folderChoiceName, { color: readableTextColor(item.color) }]}>
                            {item.name.toUpperCase()}
                          </Text>
                          <View
                            style={[
                              styles.folderChoiceCheck,
                              {
                                backgroundColor: selected ? theme.pink : theme.backgroundElement,
                                borderColor: theme.border,
                              },
                            ]}>
                            <Text style={styles.folderChoiceMark}>{selected ? '✓' : ''}</Text>
                          </View>
                        </Pressable>
                      );
                    })
                  ) : (
                    <Text style={[styles.modalBody, { color: theme.textSecondary }]}>Create another folder first.</Text>
                  )}
                </ScrollView>
                <View style={styles.modalActions}>
                  <BrutalButton
                    compact
                    style={styles.modalAction}
                    disabled={bulkWorking}
                    backgroundColor={theme.background}
                    onPress={() => setBulkAction(null)}>
                    CANCEL
                  </BrutalButton>
                  <BrutalButton
                    compact
                    style={styles.modalAction}
                    loading={bulkWorking}
                    disabled={destinationIds.size === 0}
                    backgroundColor={bulkAction === 'copy' ? theme.green : theme.blue}
                    onPress={() => void applyFolderAction()}>
                    {bulkAction.toUpperCase()}
                  </BrutalButton>
                </View>
              </>
            ) : null}

            {bulkAction === 'delete' ? (
              <>
                <Text style={[styles.modalTitle, { color: theme.text }]}>DELETE {selectedIds.size}?</Text>
                <Text style={[styles.modalBody, { color: theme.textSecondary }]}>Selected bookmarks will be moved to Trash.</Text>
                <View style={styles.modalActions}>
                  <BrutalButton
                    compact
                    style={styles.modalAction}
                    disabled={bulkWorking}
                    backgroundColor={theme.background}
                    onPress={() => setBulkAction(null)}>
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
              </>
            ) : null}
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
  bulkBar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 3,
  },
  bulkButton: { flex: 1 },
  modalRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  modalCard: { width: '100%', maxWidth: 390, maxHeight: '75%', padding: 20, gap: 14 },
  modalTitle: { fontSize: 22, lineHeight: 27, fontWeight: '900', letterSpacing: 0.5 },
  modalBody: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  folderChoices: { maxHeight: 300 },
  folderChoicesContent: { gap: 12, padding: 4, paddingBottom: 10 },
  folderChoice: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 3,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  folderChoicePressed: { transform: [{ translateX: 3 }, { translateY: 3 }] },
  folderChoiceName: { flex: 1, fontSize: 14, lineHeight: 18, fontWeight: '900' },
  folderChoiceCheck: {
    width: 28,
    height: 28,
    borderWidth: 3,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderChoiceMark: { color: '#111111', fontSize: 17, lineHeight: 19, fontWeight: '900' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalAction: { flex: 1 },
});
