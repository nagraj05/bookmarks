import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SymbolView } from 'expo-symbols';
import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrutalButton, BrutalCard, ScreenHeader } from '@/components/brutal';
import { SourceIcon } from '@/components/source-icon';
import { useTheme } from '@/hooks/use-theme';
import { getAppFoldersEnabled } from '@/lib/app-settings';
import { useGlobalLoading } from '@/providers/global-loading';
import {
  type BookmarkSource,
  createFolder,
  deleteFolder,
  type Folder,
  getBookmarkSources,
  getFolders,
  renameFolder,
  updateFolderColor,
} from '@/lib/bookmarks';
import { readableTextColor } from '@/lib/color';

const folderColors = ['#FFD23F', '#FF6B9E', '#63D7FF', '#8BE28B', '#B59CFF', '#FF8A5B'];

const folderActionSymbols = {
  rename: { ios: 'pencil', android: 'edit', web: 'edit' },
  color: { ios: 'paintpalette.fill', android: 'palette', web: 'palette' },
  delete: { ios: 'trash.fill', android: 'delete', web: 'delete' },
} as const;

function FolderActionIconButton({
  action,
  label,
  backgroundColor,
  borderColor,
  shadowColor,
  disabled,
  onPress,
}: {
  action: keyof typeof folderActionSymbols;
  label: string;
  backgroundColor: string;
  borderColor: string;
  shadowColor: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconAction,
        {
          backgroundColor,
          borderColor,
          shadowColor,
          boxShadow: `${pressed ? 1 : 5}px ${pressed ? 1 : 5}px 0px ${shadowColor}`,
          opacity: disabled ? 0.4 : 1,
          transform: [
            { translateX: pressed ? 4 : 0 },
            { translateY: pressed ? 4 : 0 },
          ],
        },
      ]}>
      <SymbolView
        name={folderActionSymbols[action]}
        tintColor="#111111"
        size={26}
        style={styles.actionIcon}
      />
    </Pressable>
  );
}

export default function FoldersScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const { runWithLoader } = useGlobalLoading();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [appFolders, setAppFolders] = useState<BookmarkSource[]>([]);
  const [appFoldersEnabled, setAppFoldersEnabled] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(folderColors[1]);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [folderAction, setFolderAction] = useState<'menu' | 'rename' | 'color' | 'delete'>('menu');
  const [editName, setEditName] = useState('');
  const longPressedFolderId = useRef<number | null>(null);

  const load = useCallback(async () => {
    const [nextFolders, nextAppFolders, enabled] = await Promise.all([
      getFolders(db),
      getBookmarkSources(db, 'active'),
      getAppFoldersEnabled(db),
    ]);
    setFolders(nextFolders);
    setAppFolders(nextAppFolders.filter((source) => source.key !== 'other'));
    setAppFoldersEnabled(enabled);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const saveFolder = async () => {
    try {
      await runWithLoader(async () => {
        await createFolder(db, name, color);
        setName('');
        setCreating(false);
        await load();
      }, 'Creating folder…');
    } catch (error) {
      Alert.alert('Could not create folder', error instanceof Error ? error.message : 'Try another name.');
    }
  };

  const openFolderActions = (folder: Folder) => {
    setSelectedFolder(folder);
    setEditName(folder.name);
    setFolderAction('menu');
  };

  const closeFolderActions = () => {
    setSelectedFolder(null);
    setFolderAction('menu');
  };

  const saveFolderName = async () => {
    if (!selectedFolder) return;
    try {
      await runWithLoader(async () => {
        await renameFolder(db, selectedFolder.id, editName);
        await load();
        closeFolderActions();
      }, 'Renaming folder…');
    } catch (error) {
      Alert.alert('Could not rename folder', error instanceof Error ? error.message : 'Try another name.');
    }
  };

  const saveFolderColor = async (nextColor: string) => {
    if (!selectedFolder) return;
    await runWithLoader(async () => {
      await updateFolderColor(db, selectedFolder.id, nextColor);
      await load();
      closeFolderActions();
    }, 'Updating folder…');
  };

  const removeSelectedFolder = async () => {
    if (!selectedFolder || selectedFolder.id === 1) return;
    try {
      await runWithLoader(async () => {
        await deleteFolder(db, selectedFolder.id);
        await load();
        closeFolderActions();
      }, 'Deleting folder…');
    } catch (error) {
      Alert.alert('Could not delete folder', error instanceof Error ? error.message : 'Try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title="Folders"
          action={
            <BrutalButton compact backgroundColor={theme.green} onPress={() => setCreating((value) => !value)}>
              {creating ? 'CLOSE' : '+ NEW'}
            </BrutalButton>
          }
        />

        {creating ? (
          <BrutalCard backgroundColor={theme.purple} style={styles.createCard}>
            <Text style={styles.createTitle}>NEW FOLDER</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Design inspiration"
              placeholderTextColor="#5A5264"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => void saveFolder()}
              style={[styles.input, { borderColor: theme.border }]}
            />
            <View style={styles.colors}>
              {folderColors.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setColor(item)}
                  style={[
                    styles.color,
                    {
                      backgroundColor: item,
                      borderColor: theme.border,
                      shadowColor: theme.shadow,
                      boxShadow: `3px 3px 0px ${theme.shadow}`,
                    },
                    color === item && styles.selectedColor,
                  ]}
                />
              ))}
            </View>
            <BrutalButton backgroundColor={theme.yellow} onPress={() => void saveFolder()} disabled={!name.trim()}>
              CREATE FOLDER
            </BrutalButton>
          </BrutalCard>
        ) : null}

        {appFoldersEnabled && appFolders.length > 0 ? (
          <View style={styles.folderSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>APP FOLDERS</Text>
            <View style={styles.grid}>
              {appFolders.map((source) => (
                <Pressable
                  key={source.key}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${source.label} app folder`}
                  onPress={() =>
                    router.push({ pathname: '/source/[key]', params: { key: source.key } })
                  }
                  style={({ pressed }) => [styles.folderPressable, pressed && styles.pressed]}>
                  <BrutalCard backgroundColor={theme.backgroundElement} style={styles.appFolderCard}>
                    <View style={[styles.appIconShell, { borderColor: theme.border, backgroundColor: '#FFFFFF' }]}>
                      <SourceIcon sourceKey={source.key} size={42} />
                    </View>
                    <View style={styles.appFolderCopy}>
                      <Text style={[styles.appFolderName, { color: theme.text }]} numberOfLines={1}>
                        {source.label}
                      </Text>
                    </View>
                  </BrutalCard>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {appFoldersEnabled ? (
          <Text style={[styles.sectionTitle, { color: theme.text }]}>YOUR FOLDERS</Text>
        ) : null}

        <View style={styles.grid}>
          {folders.map((folder) => (
            <Pressable
              key={folder.id}
              onPress={() => {
                if (longPressedFolderId.current === folder.id) {
                  longPressedFolderId.current = null;
                  return;
                }
                router.push({ pathname: '/folder/[id]', params: { id: String(folder.id) } });
              }}
              onLongPress={() => {
                longPressedFolderId.current = folder.id;
                openFolderActions(folder);
              }}
              delayLongPress={350}
              style={({ pressed }) => [styles.folderPressable, pressed && styles.pressed]}>
              <BrutalCard backgroundColor={folder.color} style={styles.folderCard}>
                <Text
                  style={[styles.folderName, { color: readableTextColor(folder.color) }]}
                  numberOfLines={2}>
                  {folder.name}
                </Text>
              </BrutalCard>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={selectedFolder !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeFolderActions}>
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close folder actions"
            style={styles.backdrop}
            onPress={closeFolderActions}
          />
          <KeyboardAvoidingView
            pointerEvents="box-none"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.bubbleLayer}>
            <View
              style={[
                styles.bubble,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                  shadowColor: theme.shadow,
                  boxShadow: `7px 7px 0px ${theme.shadow}`,
                },
              ]}>
              <View style={styles.bubbleHeader}>
                <View
                  style={[
                    styles.bubbleSwatch,
                    { backgroundColor: selectedFolder?.color, borderColor: theme.border },
                  ]}
                />
                <Text style={[styles.bubbleTitle, { color: theme.text }]} numberOfLines={1}>
                  {selectedFolder?.name}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  onPress={closeFolderActions}
                  style={({ pressed }) => [
                    styles.bubbleClose,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                      shadowColor: theme.shadow,
                      boxShadow: `${pressed ? 1 : 3}px ${pressed ? 1 : 3}px 0px ${theme.shadow}`,
                      transform: [
                        { translateX: pressed ? 2 : 0 },
                        { translateY: pressed ? 2 : 0 },
                      ],
                    },
                  ]}>
                  <Text style={[styles.bubbleCloseText, { color: theme.text }]}>×</Text>
                </Pressable>
              </View>

              {folderAction === 'menu' ? (
                <View style={styles.actionRow}>
                  <FolderActionIconButton
                    action="rename"
                    label="Rename folder"
                    backgroundColor={theme.blue}
                    borderColor={theme.border}
                    shadowColor={theme.shadow}
                    onPress={() => setFolderAction('rename')}
                  />
                  <FolderActionIconButton
                    action="color"
                    label="Change folder color"
                    backgroundColor={theme.yellow}
                    borderColor={theme.border}
                    shadowColor={theme.shadow}
                    onPress={() => setFolderAction('color')}
                  />
                  <FolderActionIconButton
                    action="delete"
                    label="Delete folder"
                    backgroundColor={theme.danger}
                    borderColor={theme.border}
                    shadowColor={theme.shadow}
                    disabled={selectedFolder?.id === 1}
                    onPress={() => setFolderAction('delete')}
                  />
                </View>
              ) : null}

              {folderAction === 'rename' ? (
                <View style={styles.editor}>
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    autoFocus
                    selectTextOnFocus
                    returnKeyType="done"
                    onSubmitEditing={() => void saveFolderName()}
                    style={[
                      styles.editInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                      },
                    ]}
                  />
                  <View style={styles.editorActions}>
                    <BrutalButton
                      compact
                      style={styles.editorButton}
                      backgroundColor={theme.backgroundElement}
                      onPress={() => setFolderAction('menu')}>
                      CANCEL
                    </BrutalButton>
                    <BrutalButton
                      compact
                      style={styles.editorButton}
                      backgroundColor={theme.green}
                      disabled={!editName.trim()}
                      onPress={() => void saveFolderName()}>
                      SAVE
                    </BrutalButton>
                  </View>
                </View>
              ) : null}

              {folderAction === 'color' ? (
                <View style={styles.colorEditor}>
                  <Text style={[styles.editorLabel, { color: theme.text }]}>CHOOSE A COLOR</Text>
                  <View style={styles.bubbleColors}>
                    {folderColors.map((item) => (
                      <Pressable
                        key={item}
                        accessibilityRole="button"
                        accessibilityLabel={`Use color ${item}`}
                        onPress={() => void saveFolderColor(item)}
                        style={[
                          styles.bubbleColor,
                          {
                            backgroundColor: item,
                            borderColor: theme.border,
                            shadowColor: theme.shadow,
                            boxShadow: `3px 3px 0px ${theme.shadow}`,
                          },
                          selectedFolder?.color === item && styles.selectedBubbleColor,
                        ]}
                      />
                    ))}
                  </View>
                  <BrutalButton compact backgroundColor={theme.backgroundElement} onPress={() => setFolderAction('menu')}>
                    BACK
                  </BrutalButton>
                </View>
              ) : null}

              {folderAction === 'delete' ? (
                <View style={styles.deleteEditor}>
                  <Text style={[styles.deleteTitle, { color: theme.text }]}>DELETE THIS FOLDER?</Text>
                  <Text style={[styles.deleteBody, { color: theme.textSecondary }]}>
                    {selectedFolder && selectedFolder.bookmark_count > 0
                      ? 'Its bookmarks will be moved safely to Inbox.'
                      : 'The folder will be removed permanently.'}
                  </Text>
                  <View style={styles.editorActions}>
                    <BrutalButton
                      compact
                      style={styles.editorButton}
                      backgroundColor={theme.backgroundElement}
                      onPress={() => setFolderAction('menu')}>
                      CANCEL
                    </BrutalButton>
                    <BrutalButton
                      compact
                      style={styles.editorButton}
                      backgroundColor={theme.danger}
                      onPress={() => void removeSelectedFolder()}>
                      DELETE
                    </BrutalButton>
                  </View>
                </View>
              ) : null}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 18, paddingBottom: 36, gap: 22 },
  createCard: { padding: 18, gap: 14 },
  createTitle: { color: '#111111', fontSize: 16, fontWeight: '900', letterSpacing: 1.3 },
  input: {
    height: 50,
    borderWidth: 3,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    color: '#111111',
    paddingHorizontal: 13,
    fontSize: 15,
    fontWeight: '700',
  },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  color: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  selectedColor: { borderWidth: 5 },
  folderSection: { gap: 13 },
  sectionTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  folderPressable: { width: '47%' },
  pressed: { transform: [{ translateX: 4 }, { translateY: 4 }] },
  folderCard: { minHeight: 132, padding: 16, justifyContent: 'center' },
  folderName: { fontSize: 20, lineHeight: 23, fontWeight: '900' },
  appFolderCard: { minHeight: 132, padding: 14, gap: 10, justifyContent: 'space-between' },
  appIconShell: {
    width: 54,
    height: 54,
    borderWidth: 3,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appFolderCopy: { gap: 2 },
  appFolderName: { fontSize: 18, lineHeight: 22, fontWeight: '900' },
  modalRoot: { flex: 1, justifyContent: 'center' },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  bubbleLayer: { flex: 1, padding: 18, justifyContent: 'center' },
  bubble: { borderWidth: 3, borderRadius: 16, padding: 16, gap: 16 },
  bubbleHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bubbleSwatch: { width: 18, height: 18, borderRadius: 5, borderWidth: 2 },
  bubbleTitle: { flex: 1, fontSize: 20, lineHeight: 24, fontWeight: '900' },
  bubbleClose: {
    width: 34,
    height: 34,
    borderWidth: 2,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleCloseText: { fontSize: 25, lineHeight: 27, fontWeight: '900', includeFontPadding: false },
  actionRow: { flexDirection: 'row', gap: 9 },
  iconAction: {
    flex: 1,
    height: 54,
    borderWidth: 3,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: { width: 26, height: 26 },
  editor: { gap: 14 },
  editInput: { height: 50, borderWidth: 3, borderRadius: 10, paddingHorizontal: 13, fontSize: 16, fontWeight: '800' },
  editorActions: { flexDirection: 'row', gap: 10 },
  editorButton: { flex: 1 },
  colorEditor: { gap: 14 },
  editorLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 1.1 },
  bubbleColors: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 4 },
  bubbleColor: { width: 38, height: 38, borderRadius: 11, borderWidth: 2 },
  selectedBubbleColor: { borderWidth: 5 },
  deleteEditor: { gap: 10 },
  deleteTitle: { fontSize: 18, lineHeight: 22, fontWeight: '900', letterSpacing: 0.4 },
  deleteBody: { fontSize: 13, lineHeight: 19, fontWeight: '700', marginBottom: 4 },
});
