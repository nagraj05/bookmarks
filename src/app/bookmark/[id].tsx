import * as Linking from 'expo-linking';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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

export default function BookmarkDetailScreen() {
  const { id, duplicate } = useLocalSearchParams<{ id: string; duplicate?: string }>();
  const db = useSQLiteContext();
  const theme = useTheme();
  const bookmarkId = Number(id);
  const [bookmark, setBookmark] = useState<Bookmark | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [title, setTitle] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

  const load = useCallback(async () => {
    const [row, folderRows] = await Promise.all([getBookmark(db, bookmarkId), getFolders(db)]);
    setBookmark(row);
    setTitle(row?.title ?? '');
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

  if (!bookmark) {
    return <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} />;
  }

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
    await updateBookmarkTitle(db, bookmark.id, title);
    await load();
    setSavingTitle(false);
  };

  const changeFolder = async (folderId: number) => {
    await moveBookmark(db, bookmark.id, folderId);
    await load();
  };

  const changeStatus = async (status: 'active' | 'archived' | 'trash') => {
    await setBookmarkStatus(db, bookmark.id, status);
    if (status === 'active') await load();
    else router.back();
  };

  const deleteForever = () => {
    Alert.alert('Delete forever?', 'This bookmark cannot be recovered after this.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete forever',
        style: 'destructive',
        onPress: () => {
          void permanentlyDeleteBookmark(db, bookmark.id).then(() => router.back());
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
          <Text style={[styles.headerLabel, { color: theme.text }]}>Bookmark details</Text>
          <Pressable
            onPress={() => void setFavorite(db, bookmark.id, !bookmark.is_favorite).then(load)}
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
            accessibilityLabel={`Open ${bookmark.title}`}
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
              accessibilityLabel={`Preview image for ${bookmark.title}`}
              onError={() => setPreviewFailed(true)}
            />
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Open ${bookmark.title}`}
          onPress={() => void openLink()}
          style={({ pressed }) => [styles.previewPressable, pressed && styles.previewPressed]}>
          <BrutalCard backgroundColor={bookmark.folder_color} style={styles.hero}>
            <Text style={styles.heroTitle}>{bookmark.title}</Text>
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
          {title.trim() !== bookmark.title ? (
            <BrutalButton compact loading={savingTitle} onPress={() => void saveTitle()}>
              SAVE TITLE
            </BrutalButton>
          ) : null}
        </View>

        {bookmark.description ? (
          <BrutalCard style={styles.descriptionCard}>
            <Text style={[styles.label, { color: theme.text }]}>DESCRIPTION</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>{bookmark.description}</Text>
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
                <Text style={styles.folderText}>{folder.name}</Text>
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
              <BrutalButton
                style={styles.actionButton}
                backgroundColor={theme.purple}
                onPress={() => void changeStatus('archived')}>
                ARCHIVE
              </BrutalButton>
              <BrutalButton
                style={styles.actionButton}
                backgroundColor={theme.danger}
                onPress={() => void changeStatus('trash')}>
                MOVE TO TRASH
              </BrutalButton>
            </>
          )}
          {bookmark.status === 'trash' ? (
            <BrutalButton style={styles.actionButton} backgroundColor={theme.danger} onPress={deleteForever}>
              DELETE FOREVER
            </BrutalButton>
          ) : null}
        </View>
      </ScrollView>
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
  description: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
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
  folderText: { color: '#111111', fontSize: 12, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 14, marginTop: 5 },
  actionButton: { flex: 1 },
});
