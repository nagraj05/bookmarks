import * as LocalAuthentication from 'expo-local-authentication';
import { SymbolView } from 'expo-symbols';
import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { addScreenOffListener } from '../../modules/screen-lock';
import { BrutalButton, BrutalCard } from '@/components/brutal';
import { useTheme } from '@/hooks/use-theme';

type EnableLockResult =
  | { success: true }
  | { success: false; reason: 'not-enrolled' | 'cancelled' | 'unavailable' };

type AppLockContextValue = {
  enabled: boolean;
  authenticating: boolean;
  enableLock: () => Promise<EnableLockResult>;
  disableLock: () => Promise<void>;
};

const AppLockContext = createContext<AppLockContextValue | null>(null);

async function authenticate(promptMessage: string) {
  if (Platform.OS === 'web') return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    promptSubtitle: 'Keep your saved links private',
    promptDescription: 'Use your fingerprint, face, or device screen lock.',
    cancelLabel: 'Cancel',
    fallbackLabel: 'Use device passcode',
    disableDeviceFallback: false,
  });

  return result.success;
}

export function AppLockProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    let active = true;

    void db
      .getAllAsync<{ key: string; value: string }>(
        "SELECT key, value FROM app_settings WHERE key IN ('app_lock_enabled', 'app_lock_pending')",
      )
      .then((rows) => {
        if (!active) return;
        const settings = Object.fromEntries(rows.map((row) => [row.key, row.value]));
        const nextEnabled = settings.app_lock_enabled === 'true';
        setEnabled(nextEnabled);
        setLocked(nextEnabled && settings.app_lock_pending === 'true');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [db]);

  useEffect(() => {
    const subscription = addScreenOffListener(() => {
      if (enabled && !authenticating) {
        setLocked(true);
        void db.runAsync(
          `INSERT INTO app_settings (key, value) VALUES ('app_lock_pending', 'true')
           ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        );
      }
    });
    return () => subscription.remove();
  }, [authenticating, db, enabled]);

  const requestAuthentication = useCallback(async (promptMessage: string) => {
    setAuthenticating(true);
    try {
      return await authenticate(promptMessage);
    } finally {
      setAuthenticating(false);
    }
  }, []);

  const unlock = useCallback(async () => {
    const success = await requestAuthentication('Unlock Bookmarks');
    if (success) {
      await db.runAsync(
        `INSERT INTO app_settings (key, value) VALUES ('app_lock_pending', 'false')
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      );
      setLocked(false);
    }
  }, [db, requestAuthentication]);

  const enableLock = useCallback(async (): Promise<EnableLockResult> => {
    if (Platform.OS === 'web') return { success: false, reason: 'unavailable' };

    const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();
    if (securityLevel === LocalAuthentication.SecurityLevel.NONE) {
      return { success: false, reason: 'not-enrolled' };
    }

    const success = await requestAuthentication('Turn on app lock');
    if (!success) return { success: false, reason: 'cancelled' };

    await db.runAsync(
      `INSERT INTO app_settings (key, value) VALUES ('app_lock_enabled', 'true')
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    );
    await db.runAsync(
      `INSERT INTO app_settings (key, value) VALUES ('app_lock_pending', 'false')
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    );
    setEnabled(true);
    setLocked(false);
    return { success: true };
  }, [db, requestAuthentication]);

  const disableLock = useCallback(async () => {
    await db.runAsync(
      `INSERT INTO app_settings (key, value) VALUES ('app_lock_enabled', 'false')
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    );
    await db.runAsync(
      `INSERT INTO app_settings (key, value) VALUES ('app_lock_pending', 'false')
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    );
    setEnabled(false);
    setLocked(false);
  }, [db]);

  const value: AppLockContextValue = { enabled, authenticating, enableLock, disableLock };

  if (loading) {
    return <View style={[styles.loading, { backgroundColor: theme.background }]} />;
  }

  return (
    <AppLockContext.Provider value={value}>
      {locked ? (
        <SafeAreaView style={[styles.lockedScreen, { backgroundColor: theme.background }]}>
          <BrutalCard backgroundColor={theme.purple} style={styles.lockCard}>
            <View style={[styles.lockIconWrap, { borderColor: theme.border }]}>
              <SymbolView
                name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                tintColor="#111111"
                size={36}
                style={styles.lockIcon}
              />
            </View>
            <Text style={styles.lockTitle}>BOOKMARKS LOCKED</Text>
            <Text style={styles.lockBody}>Authenticate to see your saved links.</Text>
            <BrutalButton
              backgroundColor={theme.yellow}
              loading={authenticating}
              onPress={() => void unlock()}>
              UNLOCK
            </BrutalButton>
          </BrutalCard>
        </SafeAreaView>
      ) : (
        children
      )}
    </AppLockContext.Provider>
  );
}

export function useAppLock() {
  const context = useContext(AppLockContext);
  if (!context) throw new Error('useAppLock must be used inside AppLockProvider');
  return context;
}

const styles = StyleSheet.create({
  loading: { flex: 1 },
  lockedScreen: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  lockCard: { width: '100%', maxWidth: 420, padding: 24, gap: 16, alignItems: 'stretch' },
  lockIconWrap: {
    width: 68,
    height: 68,
    alignSelf: 'center',
    borderWidth: 3,
    borderRadius: 18,
    backgroundColor: '#FFD23F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: { width: 36, height: 36 },
  lockTitle: { color: '#111111', fontSize: 24, lineHeight: 28, fontWeight: '900', textAlign: 'center' },
  lockBody: { color: '#29232F', fontSize: 14, lineHeight: 20, fontWeight: '700', textAlign: 'center' },
});
