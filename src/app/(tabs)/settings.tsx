import { SymbolView } from 'expo-symbols';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrutalCard, ScreenHeader } from '@/components/brutal';
import { useTheme } from '@/hooks/use-theme';
import { getAppFoldersEnabled, setAppFoldersEnabled } from '@/lib/app-settings';
import { useAppLock } from '@/providers/app-lock';
import { type ThemePreference, useThemePreference } from '@/providers/theme-preference';

const themeOptions = [
  {
    value: 'system',
    label: 'System',
    symbol: { ios: 'circle.lefthalf.filled', android: 'contrast', web: 'contrast' },
  },
  {
    value: 'light',
    label: 'Light',
    symbol: { ios: 'sun.max.fill', android: 'light_mode', web: 'light_mode' },
  },
  {
    value: 'dark',
    label: 'Dark',
    symbol: { ios: 'moon.fill', android: 'dark_mode', web: 'dark_mode' },
  },
] as const satisfies readonly {
  value: ThemePreference;
  label: string;
  symbol: { ios: string; android: string; web: string };
}[];

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const { preference, setPreference } = useThemePreference();
  const { enabled: appLockEnabled, authenticating, enableLock, disableLock } = useAppLock();
  const [appFoldersEnabled, setAppFoldersEnabledState] = useState(false);
  const [updatingAppFolders, setUpdatingAppFolders] = useState(false);

  useEffect(() => {
    let active = true;
    void getAppFoldersEnabled(db).then((enabled) => {
      if (active) setAppFoldersEnabledState(enabled);
    });
    return () => {
      active = false;
    };
  }, [db]);

  const toggleAppFolders = async () => {
    const enabled = !appFoldersEnabled;
    setUpdatingAppFolders(true);
    try {
      await setAppFoldersEnabled(db, enabled);
      setAppFoldersEnabledState(enabled);
    } catch {
      Alert.alert('Could not update app folders', 'Please try again.');
    } finally {
      setUpdatingAppFolders(false);
    }
  };

  const toggleAppLock = async () => {
    if (appLockEnabled) {
      await disableLock();
      return;
    }

    const result = await enableLock();
    if (result.success || result.reason === 'cancelled') return;

    Alert.alert(
      result.reason === 'not-enrolled' ? 'Set up a device lock first' : 'App lock unavailable',
      result.reason === 'not-enrolled'
        ? 'Add a fingerprint, face, PIN, pattern, or password in your phone settings, then try again.'
        : 'App lock is available in the Android and iOS app.',
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Settings" />

        <Text style={[styles.sectionTitle, { color: theme.text }]}>APPEARANCE</Text>
        <View style={styles.themeOptions}>
          {themeOptions.map((option, index) => {
            const selected = preference === option.value;
            const colors = [theme.yellow, theme.blue, theme.purple];
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => void setPreference(option.value)}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: selected ? colors[index] : theme.backgroundElement,
                    borderColor: theme.border,
                    shadowColor: theme.shadow,
                    boxShadow: `6px 6px 0px ${theme.shadow}`,
                    transform: [
                      { translateX: selected ? -2 : 0 },
                      { translateY: selected ? -2 : 0 },
                    ],
                  },
                ]}>
                <SymbolView
                  name={option.symbol}
                  tintColor={selected ? '#111111' : theme.text}
                  size={24}
                  style={styles.themeIcon}
                />
                <Text style={[styles.themeLabel, { color: selected ? '#111111' : theme.text }]}>{option.label}</Text>
                {selected ? (
                  <SymbolView
                    name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                    tintColor="#111111"
                    size={15}
                    style={styles.themeCheck}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>ORGANIZATION</Text>
        <BrutalCard backgroundColor={theme.blue} style={styles.appLockCard}>
          <View style={[styles.appLockIconWrap, { borderColor: theme.border }]}>
            <SymbolView
              name={{ ios: 'square.grid.2x2.fill', android: 'grid_view', web: 'grid_view' }}
              tintColor="#111111"
              size={25}
              style={styles.appLockIcon}
            />
          </View>
          <View style={styles.rowCopy}>
            <Text style={styles.darkTitle}>Organize by app</Text>
            <Text style={styles.darkBody}>Show automatic folders for apps you share links from.</Text>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel="Organize by app"
            accessibilityState={{ checked: appFoldersEnabled, disabled: updatingAppFolders }}
            disabled={updatingAppFolders}
            onPress={() => void toggleAppFolders()}
            style={[
              styles.toggle,
              {
                backgroundColor: appFoldersEnabled ? theme.green : '#FFFFFF',
                borderColor: theme.border,
                opacity: updatingAppFolders ? 0.55 : 1,
              },
            ]}>
            <View
              style={[
                styles.toggleThumb,
                {
                  backgroundColor: appFoldersEnabled ? '#111111' : '#7B7380',
                  transform: [{ translateX: appFoldersEnabled ? 22 : 0 }],
                },
              ]}
            />
          </Pressable>
        </BrutalCard>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>PRIVACY</Text>
        <BrutalCard backgroundColor={theme.pink} style={styles.appLockCard}>
          <View style={[styles.appLockIconWrap, { borderColor: theme.border }]}>
            <SymbolView
              name={{
                ios: appLockEnabled ? 'lock.fill' : 'lock.open.fill',
                android: appLockEnabled ? 'lock' : 'lock_open',
                web: appLockEnabled ? 'lock' : 'lock_open',
              }}
              tintColor="#111111"
              size={25}
              style={styles.appLockIcon}
            />
          </View>
          <View style={styles.rowCopy}>
            <Text style={styles.darkTitle}>App lock</Text>
            <Text style={styles.darkBody}>Require device authentication when opening Bookmarks.</Text>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel="App lock"
            accessibilityState={{ checked: appLockEnabled, disabled: authenticating }}
            disabled={authenticating}
            onPress={() => void toggleAppLock()}
            style={[
              styles.toggle,
              {
                backgroundColor: appLockEnabled ? theme.green : '#FFFFFF',
                borderColor: theme.border,
                opacity: authenticating ? 0.55 : 1,
              },
            ]}>
            <View
              style={[
                styles.toggleThumb,
                {
                  backgroundColor: appLockEnabled ? '#111111' : '#7B7380',
                  transform: [{ translateX: appLockEnabled ? 22 : 0 }],
                },
              ]}
            />
          </Pressable>
        </BrutalCard>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>COMING NEXT</Text>
        <View style={styles.stack}>
          {[
            ['⇩', 'Backup & restore', 'Export a portable local backup file.'],
          ].map(([icon, title, body]) => (
            <BrutalCard key={title} backgroundColor={theme.blue} style={styles.rowCard}>
              <Text style={styles.itemIcon}>{icon}</Text>
              <View style={styles.rowCopy}>
                <Text style={styles.darkTitle}>{title}</Text>
                <Text style={styles.darkBody}>{body}</Text>
              </View>
            </BrutalCard>
          ))}
        </View>

        <Text style={[styles.version, { color: theme.textSecondary }]}>BOOKMARKS · Created by Nagraj Tadingi</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 18, paddingBottom: 40, gap: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1.5, marginTop: 4 },
  stack: { gap: 15 },
  rowCard: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13 },
  appLockCard: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  appLockIconWrap: {
    width: 44,
    height: 44,
    borderWidth: 3,
    borderRadius: 11,
    backgroundColor: '#FFD23F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appLockIcon: { width: 25, height: 25 },
  toggle: {
    width: 52,
    height: 30,
    borderWidth: 3,
    borderRadius: 8,
    padding: 3,
    justifyContent: 'center',
  },
  toggleThumb: { width: 18, height: 18, borderRadius: 4 },
  rowCopy: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 16, fontWeight: '900' },
  rowBody: { fontSize: 12, lineHeight: 17, fontWeight: '600' },
  themeOptions: { flexDirection: 'row', gap: 10 },
  themeOption: {
    flex: 1,
    minHeight: 92,
    borderWidth: 3,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  themeIcon: { width: 24, height: 24 },
  themeLabel: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  themeCheck: { position: 'absolute', top: 7, right: 8, width: 15, height: 15 },
  itemIcon: { color: '#111111', fontSize: 28, fontWeight: '900' },
  darkTitle: { color: '#111111', fontSize: 16, fontWeight: '900' },
  darkBody: { color: '#111111', fontSize: 12, lineHeight: 17, fontWeight: '600' },
  version: { textAlign: 'center', fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginTop: 10 },
});
