import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LaunchAnimation } from '@/components/launch-animation';
import { DATABASE_NAME, migrateDatabase } from '@/lib/database';
import { AppLockProvider } from '@/providers/app-lock';
import { GlobalLoadingProvider } from '@/providers/global-loading';
import { ThemePreferenceProvider, useThemePreference } from '@/providers/theme-preference';

void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 200, fade: true });

function AppNavigation() {
  const { resolvedTheme } = useThemePreference();
  const segments = useSegments();
  const [showLaunch] = useState(() => segments[0] !== 'handle-share');

  useEffect(() => {
    if (!showLaunch) SplashScreen.hide();
  }, [showLaunch]);

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
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
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
  );
}
