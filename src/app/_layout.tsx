import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DATABASE_NAME, migrateDatabase } from '@/lib/database';
import { ThemePreferenceProvider, useThemePreference } from '@/providers/theme-preference';

function AppNavigation() {
  const { resolvedTheme } = useThemePreference();

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
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDatabase}>
        <ThemePreferenceProvider>
          <AppNavigation />
        </ThemePreferenceProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
