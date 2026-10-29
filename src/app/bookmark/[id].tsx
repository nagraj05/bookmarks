import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrutalButton, BrutalCard } from '@/components/brutal';
import { useTheme } from '@/hooks/use-theme';
import {
  type Bookmark,
  type Folder,
  getBookmark,
  getFolders,
  markOpened,
  moveBookmark,
  permanentlyDeleteBookmark,
  setBookmarkStatus,
  setFavorite,
  updateBookmarkTitle,
} from '@/lib/bookmarks';
import { goBackOrLibrary } from '@/lib/navigation';
import { readableTextColor } from '@/lib/color';
import { decodeTextEntities, getSocialPostText, isSocialPostSource } from '@/lib/social-content';
import { useGlobalLoading } from '@/providers/global-loading';

export default function BookmarkDetailScreen() {
  const { id, duplicate } = useLocalSearchParams<{ id: string; duplicate?: string }>();
  const db = useSQLiteContext();
  const theme = useTheme();
  const { runWithLoader } = useGlobalLoading();
  const bookmarkId = Number(id);
  const [bookmark, setBookmark] = useState<Bookmark | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [title, setTitle] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [descriptionCopied, setDescriptionCopied] = useState(false);
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const [row, folderRows] = await Promise.all([getBookmark(db, bookmarkId), getFolders(db)]);
    setBookmark(row);
    setTitle(
      row && isSocialPostSource(row.source_key)
        ? getSocialPostText(row.source_key, row.title, row.description)
        : (row?.title ?? ''),
    );
    setFolders(folderRows);
  }, [bookmarkId, db]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    const timeout = setTimeout(() => void load(), 1_200);
    return () => clearTimeout(timeout);
  }, [load]);

  useEffect(() => () => {
    if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
  }, []);

  if (!bookmark) {
    return <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} />;
  }

  const displayTitle = isSocialPostSource(bookmark.source_key)
    ? getSocialPostText(bookmark.source_key, bookmark.title, bookmark.description)
    : bookmark.title;
  const displayDescription = bookmark.description
    ? isSocialPostSource(bookmark.source_key)
      ? getSocialPostText(bookmark.source_key, bookmark.title, bookmark.description)
      : decodeTextEntities(bookmark.description)
    : null;
  const hasDuplicateSocialText =
    isSocialPostSource(bookmark.source_key) && displayDescription === displayTitle;

  const openLink = async () => {
    await markOpened(db, bookmark.id);
    try {
      await Linking.openURL(bookmark.url);
    } catch {
      Alert.alert('Could not open link', 'No app or browser accepted this URL.');
    }
  };

  const saveTitle = async () => {
    if (!title.trim()) return;
    setSavingTitle(true);
    try {
      await runWithLoader(async () => {
        await updateBookmarkTitle(db, bookmark.id, title);
        await load();
      }, 'Saving title…');
    } finally {
      setSavingTitle(false);
    }
  };

  const changeFolder = async (folderId: number) => {
    await runWithLoader(async () => {
      await moveBookmark(db, bookmark.id, folderId);
      await load();
    }, 'Moving bookmark…');
  };

  const changeStatus = async (status: 'active' | 'archived' | 'trash') => {
    await runWithLoader(async () => {
      await setBookmarkStatus(db, bookmark.id, status);
      if (status === 'active') await load();
      else goBackOrLibrary();
    }, status === 'trash' ? 'Moving to Trash…' : status === 'archived' ? 'Archiving…' : 'Restoring…');
  };

  const toggleFavorite = async () => {
    await runWithLoader(async () => {
      await setFavorite(db, bookmark.id, !bookmark.is_favorite);
      await load();
    }, bookmark.is_favorite ? 'Removing favorite…' : 'Adding favorite…');
  };

  const copyDescription = async () => {
    if (!displayDescription) return;
    try {
      await Clipboard.setStringAsync(displayDescription);
      setDescriptionCopied(true);
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
      copyResetTimer.current = setTimeout(() => setDescriptionCopied(false), 1_600);
    } catch {
      Alert.alert('Could not copy description', 'Please try again.');
    }
  };

  const deleteForever = async () => {
    setDeleting(true);
    try {
      await runWithLoader(async () => {
        await permanentlyDeleteBookmark(db, bookmark.id);
        setDeleteModalVisible(false);
        goBackOrLibrary();
      }, 'Deleting forever…');
    } catch {
      setDeleting(false);
      Alert.alert('Could not delete bookmark', 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={goBackOrLibrary}
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
          <Text style={[styles.headerLabel, { color: theme.text }]}>Bookmark details</Text>
          <Pressable
            onPress={() => void toggleFavorite()}
            style={[
              styles.favorite,
              {
                backgroundColor: theme.pink,
                borderColor: theme.border,
                shadowColor: theme.shadow,
                boxShadow: `5px 5px 0px ${theme.shadow}`,
              },
            ]}>
            <Text style={styles.favoriteText}>{bookmark.is_favorite ? '★' : '☆'}</Text>
          </Pressable>
        </View>

        {duplicate === '1' ? (
          <BrutalCard backgroundColor={theme.yellow} style={styles.notice}>
            <Text style={styles.noticeText}>ALREADY SAVED — HERE IT IS.</Text>
          </BrutalCard>
        ) : null}

        {bookmark.image_url && !previewFailed ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Open ${displayTitle}`}
            onPress={() => void openLink()}
            style={({ pressed }) => [styles.previewPressable, pressed && styles.previewPressed]}>
            <Image
              source={{ uri: bookmark.image_url }}
              style={[
                styles.preview,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.backgroundElement,
                  shadowColor: theme.shadow,
                  boxShadow: `7px 7px 0px ${theme.shadow}`,
                },
              ]}
              contentFit="cover"
              transition={180}
              cachePolicy="memory-disk"
              accessibilityLabel={`Preview image for ${displayTitle}`}
              onError={() => setPreviewFailed(true)}
            />
          </Pressable>
        ) : null}

        {!hasDuplicateSocialText ? (
          <>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Open ${displayTitle}`}
              onPress={() => void openLink()}
              style={({ pressed }) => [styles.previewPressable, pressed && styles.previewPressed]}>
              <BrutalCard backgroundColor={bookmark.folder_color} style={styles.hero}>
                <Text style={styles.heroTitle}>{displayTitle}</Text>
              </BrutalCard>
            </Pressable>

            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.text }]}>TITLE</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                    shadowColor: theme.shadow,
                    boxShadow: `5px 5px 0px ${theme.shadow}`,
                  },
                ]}
              />
              {title.trim() !== displayTitle ? (
                <BrutalButton compact loading={savingTitle} onPress={() => void saveTitle()}>
                  SAVE TITLE
                </BrutalButton>
              ) : null}
            </View>
          </>
        ) : null}

        {displayDescription ? (
          <BrutalCard style={styles.descriptionCard}>
            <View style={styles.descriptionHeader}>
              <Text style={[styles.label, { color: theme.text }]}>DESCRIPTION</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={descriptionCopied ? 'Description copied' : 'Copy description'}
                onPress={() => void copyDescription()}
                style={({ pressed }) => [
                  styles.copyButton,
                  {
                    backgroundColor: descriptionCopied ? theme.green : theme.blue,
                    borderColor: theme.border,
                    boxShadow: `${pressed ? 1 : 3}px ${pressed ? 1 : 3}px 0px ${theme.shadow}`,
                    transform: [
                      { translateX: pressed ? 2 : 0 },
                      { translateY: pressed ? 2 : 0 },
                    ],
                  },
                ]}>
                <SymbolView
                  name={{
                    ios: descriptionCopied ? 'checkmark' : 'doc.on.doc',
                    android: descriptionCopied ? 'check' : 'content_copy',
                    web: descriptionCopied ? 'check' : 'content_copy',
                  }}
                  tintColor={readableTextColor(descriptionCopied ? theme.green : theme.blue)}
                  size={18}
                  style={styles.copyIcon}
                />
              </Pressable>
            </View>
            <Text style={[styles.description, { color: theme.textSecondary }]}>{displayDescription}</Text>
          </BrutalCard>
        ) : null}

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.text }]}>MOVE TO FOLDER</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.folders}>
            {folders.map((folder) => (
              <Pressable
                key={folder.id}
                onPress={() => void changeFolder(folder.id)}
                style={[
                  styles.folder,
                  {
                    backgroundColor: folder.color,
                    borderColor: theme.border,
                    shadowColor: theme.shadow,
                    boxShadow: `3px 3px 0px ${theme.shadow}`,
                    opacity: bookmark.folder_id === folder.id ? 1 : 0.5,
                  },
                  bookmark.folder_id === folder.id && styles.folderSelected,
                ]}>
                <Text style={[styles.folderText, { color: readableTextColor(folder.color) }]}>{folder.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.actions}>
          {bookmark.status !== 'active' ? (
            <BrutalButton
              style={styles.actionButton}
              backgroundColor={theme.blue}
              onPress={() => void changeStatus('active')}>
              RESTORE
            </BrutalButton>
          ) : (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Archive bookmark"
                onPress={() => void changeStatus('archived')}
                style={({ pressed }) => [
                  styles.actionIconButton,
                  {
                    backgroundColor: theme.purple,
                    borderColor: theme.border,
                    boxShadow: `${pressed ? 1 : 6}px ${pressed ? 1 : 6}px 0px ${theme.shadow}`,
                    transform: [
                      { translateX: pressed ? 4 : 0 },
                      { translateY: pressed ? 4 : 0 },
                    ],
                  },
                ]}>
                <SymbolView
                  name={{ ios: 'archivebox.fill', android: 'archive', web: 'archive' }}
                  tintColor={readableTextColor(theme.purple)}
                  size={25}
                  style={styles.actionIcon}
                />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Move bookmark to Trash"
                onPress={() => void changeStatus('trash')}
                style={({ pressed }) => [
                  styles.actionIconButton,
                  {
                    backgroundColor: theme.danger,
                    borderColor: theme.border,
                    boxShadow: `${pressed ? 1 : 6}px ${pressed ? 1 : 6}px 0px ${theme.shadow}`,
                    transform: [
                      { translateX: pressed ? 4 : 0 },
                      { translateY: pressed ? 4 : 0 },
                    ],
                  },
                ]}>
                <SymbolView
                  name={{ ios: 'trash.fill', android: 'delete', web: 'delete' }}
                  tintColor={readableTextColor(theme.danger)}
                  size={25}
                  style={styles.actionIcon}
                />
              </Pressable>
            </>
          )}
          {bookmark.status === 'trash' ? (
            <BrutalButton
              style={styles.actionButton}
              backgroundColor={theme.danger}
              onPress={() => setDeleteModalVisible(true)}>
              DELETE FOREVER
            </BrutalButton>
          ) : null}
        </View>
      </ScrollView>

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (!deleting) setDeleteModalVisible(false);
        }}>
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel permanent deletion"
            disabled={deleting}
            style={styles.modalBackdrop}
            onPress={() => setDeleteModalVisible(false)}
          />
          <BrutalCard backgroundColor={theme.backgroundElement} style={styles.deleteModal}>
            <View style={[styles.deleteIconWrap, { backgroundColor: theme.danger, borderColor: theme.border }]}>
              <SymbolView
                name={{ ios: 'trash.fill', android: 'delete_forever', web: 'delete_forever' }}
                tintColor="#111111"
                size={30}
                style={styles.deleteIcon}
              />
            </View>
            <Text style={[styles.deleteModalTitle, { color: theme.text }]}>DELETE FOREVER?</Text>
            <Text style={[styles.deleteModalBody, { color: theme.textSecondary }]}>
              This bookmark will be permanently removed and cannot be recovered.
            </Text>
            <View style={styles.deleteModalActions}>
              <BrutalButton
                compact
                style={styles.deleteModalButton}
                backgroundColor={theme.backgroundElement}
                disabled={deleting}
                onPress={() => setDeleteModalVisible(false)}>
                CANCEL
              </BrutalButton>
              <BrutalButton
                compact
                style={styles.deleteModalButton}
                backgroundColor={theme.danger}
                loading={deleting}
                onPress={() => void deleteForever()}>
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
  content: { padding: 18, paddingBottom: 48, gap: 22 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
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
  headerLabel: { flex: 1, fontSize: 30, lineHeight: 34, fontWeight: '900', letterSpacing: -0.7 },
  favorite: {
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
  favoriteText: { color: '#111111', fontSize: 25, fontWeight: '900' },
  notice: { padding: 13 },
  noticeText: { color: '#111111', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  preview: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderWidth: 3,
    borderRadius: 12,
    shadowOffset: { width: 7, height: 7 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 7,
  },
  previewPressable: { width: '100%' },
  previewPressed: { transform: [{ translateX: 4 }, { translateY: 4 }], opacity: 0.9 },
  hero: { padding: 20, gap: 10 },
  heroTitle: { color: '#111111', fontSize: 27, lineHeight: 31, fontWeight: '900', letterSpacing: -0.7 },
  field: { gap: 9 },
  label: { fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
  input: {
    minHeight: 52,
    borderWidth: 3,
    borderRadius: 12,
    paddingHorizontal: 13,
    fontSize: 16,
    fontWeight: '800',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  descriptionCard: { padding: 16, gap: 7 },
  descriptionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  description: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  copyButton: {
    width: 36,
    height: 36,
    borderWidth: 2,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  copyIcon: { width: 18, height: 18 },
  folders: { gap: 10, paddingTop: 2, paddingRight: 12, paddingBottom: 8 },
  folder: {
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  folderSelected: { borderWidth: 4, paddingHorizontal: 11, paddingVertical: 6 },
  folderText: { fontSize: 12, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 14, marginTop: 5 },
  actionButton: { flex: 1 },
  actionIconButton: {
    flex: 1,
    minHeight: 54,
    borderWidth: 3,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 7,
  },
  actionIcon: { width: 25, height: 25 },
  modalRoot: { flex: 1, padding: 22, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  deleteModal: { width: '100%', maxWidth: 420, padding: 20, gap: 13 },
  deleteIconWrap: {
    width: 58,
    height: 58,
    borderWidth: 3,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: { width: 30, height: 30 },
  deleteModalTitle: { fontSize: 22, lineHeight: 26, fontWeight: '900', letterSpacing: 0.5 },
  deleteModalBody: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  deleteModalActions: { flexDirection: 'row', gap: 11, marginTop: 4 },
  deleteModalButton: { flex: 1 },
});
