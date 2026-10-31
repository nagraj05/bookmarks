import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { getSharedPayloads } from 'expo-sharing';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppUpdateModal } from '@/components/app-update-modal';
import { LaunchAnimation } from '@/components/launch-animation';
import { DATABASE_NAME, migrateDatabase } from '@/lib/database';
import { AppLockProvider } from '@/providers/app-lock';
import { GlobalLoadingProvider } from '@/providers/global-loading';
import { ThemePreferenceProvider, useThemePreference } from '@/providers/theme-preference';

void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 200, fade: true });

function AppNavigation() {
  const { resolvedTheme } = useThemePreference();
  const [showLaunch] = useState(() => getSharedPayloads().length === 0);

  return (
    <ThemeProvider value={resolvedTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} animated />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add" options={{ presentation: 'modal' }} />
        <Stack.Screen name="bookmark/[id]" />
        <Stack.Screen name="folder/[id]" />
        <Stack.Screen name="handle-share" />
      </Stack>
      {showLaunch ? <LaunchAnimation /> : null}
      <AppUpdateModal />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const hideNativeSplash = useCallback(() => {
    SplashScreen.hide();
  }, []);

  return (
    <View onLayout={hideNativeSplash} style={styles.root}>
      <SafeAreaProvider>
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDatabase}>
          <ThemePreferenceProvider>
            <AppLockProvider>
              <GlobalLoadingProvider>
                <AppNavigation />
              </GlobalLoadingProvider>
            </AppLockProvider>
          </ThemePreferenceProvider>
        </SQLiteProvider>
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFD400' },
});
