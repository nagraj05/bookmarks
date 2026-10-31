import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrutalButton } from '@/components/brutal';
import { useTheme } from '@/hooks/use-theme';
import { addBookmark, type Folder, getFolders, updateBookmarkMetadata } from '@/lib/bookmarks';
import { readableTextColor } from '@/lib/color';
import { fetchLinkMetadata } from '@/lib/metadata';
import { useGlobalLoading } from '@/providers/global-loading';

export default function AddBookmarkScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const { runWithLoader } = useGlobalLoading();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderId, setFolderId] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getFolders(db).then(setFolders);
  }, [db]);

  const save = async () => {
    setSaving(true);
    try {
      await runWithLoader(async () => {
        const result = await addBookmark(db, { url, title, folderId });
        if (!result.duplicate) {
          void runWithLoader(async () => {
            const metadata = await fetchLinkMetadata(url);
            await updateBookmarkMetadata(db, result.id, metadata);
          }, 'Fetching link preview…');
        }
        router.replace({
          pathname: '/bookmark/[id]',
          params: { id: String(result.id), duplicate: result.duplicate ? '1' : '0' },
        });
      }, 'Saving bookmark…');
    } catch (error) {
      Alert.alert('Invalid link', error instanceof Error ? error.message : 'Check the URL and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <Text style={[styles.title, { color: theme.text }]}>New link</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={() => router.back()}
            style={[
              styles.close,
              {
                borderColor: theme.border,
                backgroundColor: theme.backgroundElement,
              },
            ]}>
            <Text style={[styles.closeText, { color: theme.text }]}>×</Text>
          </Pressable>
        </View>

        <View style={styles.tip}>
          <Text style={[styles.tipTitle, { color: theme.text }]}>QUICK TIP</Text>
          <Text style={[styles.tipBody, { color: theme.textSecondary }]}>
            You can also share any link from another app directly to Bookmarks.
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.text }]}>URL *</Text>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="https://example.com/article"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
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
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.text }]}>TITLE (OPTIONAL)</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Fetched automatically if blank"
            placeholderTextColor={theme.textSecondary}
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
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.text }]}>FOLDER</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.folders}>
            {folders.map((folder) => (
              <Pressable
                key={folder.id}
                onPress={() => setFolderId(folder.id)}
                style={[
                  styles.folder,
                  {
                    backgroundColor: folder.color,
                    borderColor: theme.border,
                    shadowColor: theme.shadow,
                    boxShadow: `3px 3px 0px ${theme.shadow}`,
                    opacity: folderId === folder.id ? 1 : 0.55,
                  },
                  folderId === folder.id && styles.folderSelected,
                ]}>
                <Text style={[styles.folderText, { color: readableTextColor(folder.color) }]}>{folder.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <BrutalButton onPress={() => void save()} loading={saving} disabled={!url.trim()} backgroundColor={theme.pink}>
          SAVE BOOKMARK
        </BrutalButton>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 20, gap: 24 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 34, lineHeight: 38, fontWeight: '900', letterSpacing: -1 },
  close: {
    width: 38,
    height: 38,
    borderWidth: 2,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 27, lineHeight: 29, fontWeight: '900', includeFontPadding: false },
  tip: { gap: 3, paddingHorizontal: 2 },
  tipTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
  tipBody: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
  field: { gap: 8 },
  label: { fontSize: 12, fontWeight: '900', letterSpacing: 1.1 },
  input: {
    height: 54,
    borderWidth: 3,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '700',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  folders: { gap: 10, paddingTop: 2, paddingRight: 12, paddingBottom: 8 },
  folder: {
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  folderSelected: { borderWidth: 4, paddingHorizontal: 12, paddingVertical: 7 },
  folderText: { fontSize: 12, fontWeight: '900' },
});
