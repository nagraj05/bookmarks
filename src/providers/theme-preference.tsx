import { useSQLiteContext } from 'expo-sqlite';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

type ThemePreferenceContextValue = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => Promise<void>;
};

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

export function ThemePreferenceProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const systemTheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    let active = true;
    void db
      .getFirstAsync<{ value: string }>("SELECT value FROM app_settings WHERE key = 'theme'")
      .then((row) => {
        if (active && (row?.value === 'system' || row?.value === 'light' || row?.value === 'dark')) {
          setPreferenceState(row.value);
        }
      });
    return () => {
      active = false;
    };
  }, [db]);

  const setPreference = useCallback(
    async (nextPreference: ThemePreference) => {
      setPreferenceState(nextPreference);
      await db.runAsync(
        `INSERT INTO app_settings (key, value) VALUES ('theme', ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        nextPreference,
      );
    },
    [db],
  );

  const resolvedTheme: ResolvedTheme =
    preference === 'system' ? (systemTheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  );

  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference() {
  const value = useContext(ThemePreferenceContext);
  if (!value) throw new Error('useThemePreference must be used inside ThemePreferenceProvider.');
  return value;
}
