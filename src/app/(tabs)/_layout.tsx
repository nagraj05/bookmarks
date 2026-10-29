import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import bold from 'expo-symbols/androidWeights/bold';
import regular from 'expo-symbols/androidWeights/regular';
import { type ColorValue, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

const tabSymbols = {
  library: {
    active: { ios: 'square.grid.2x2.fill', android: 'grid_view', web: 'grid_view' },
    inactive: { ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' },
  },
  folders: {
    active: { ios: 'folder.fill', android: 'folder', web: 'folder' },
    inactive: { ios: 'folder', android: 'folder', web: 'folder' },
  },
  settings: {
    active: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
    inactive: { ios: 'gearshape', android: 'settings', web: 'settings' },
  },
} as const;

function TabIcon({
  tab,
  color,
  focused,
}: {
  tab: keyof typeof tabSymbols;
  color: ColorValue;
  focused: boolean;
}) {
  return (
    <SymbolView
      name={tabSymbols[tab][focused ? 'active' : 'inactive']}
      tintColor={color}
      weight={{ ios: focused ? 'bold' : 'regular', android: focused ? bold : regular }}
      size={25}
      style={styles.symbol}
    />
  );
}

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.pink,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarInactiveBackgroundColor: 'transparent',
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ],
        tabBarItemStyle: styles.tabItem,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, focused }) => <TabIcon tab="library" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="folders"
        options={{
          title: 'Folders',
          tabBarIcon: ({ color, focused }) => <TabIcon tab="folders" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => <TabIcon tab="settings" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    borderTopWidth: 1,
    paddingTop: 7,
    paddingBottom: 7,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabItem: {
    paddingVertical: 5,
  },
  symbol: {
    width: 25,
    height: 25,
  },
});
