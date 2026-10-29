import { SwipeTabs } from '@/components/swipe-tabs';

export default function TabsLayout() {
  return (
    <SwipeTabs activityEnabled={false}>
      <SwipeTabs.Screen name="index" options={{ title: 'Library', tabIcon: 'library' }} />
      <SwipeTabs.Screen name="folders" options={{ title: 'Folders', tabIcon: 'folders' }} />
      <SwipeTabs.Screen name="settings" options={{ title: 'Settings', tabIcon: 'settings' }} />
    </SwipeTabs>
  );
}
