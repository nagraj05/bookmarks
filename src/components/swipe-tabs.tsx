import PagerView, {
  type PagerViewOnPageSelectedEvent,
  type PagerViewRef,
} from '@expo/ui/community/pager-view';
import {
  createStandardRouterNavigator,
  TabRouter,
  type NavigatorContentProps,
} from 'expo-router';
import { SymbolView } from 'expo-symbols';
import bold from 'expo-symbols/androidWeights/bold';
import regular from 'expo-symbols/androidWeights/regular';
import { useCallback, useEffect, useRef } from 'react';
import { type ColorValue, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

type TabIconName = keyof typeof tabSymbols;

type SwipeTabOptions = {
  title?: string;
  tabIcon?: TabIconName;
};

type SwipeTabEvents = {
  tabPress: { data: undefined; canPreventDefault: true };
  tabLongPress: { data: undefined; canPreventDefault: false };
};

type SwipeTabsContentProps = NavigatorContentProps<
  SwipeTabOptions,
  SwipeTabEvents,
  object,
  { preloadAll: () => void }
>;

function TabIcon({
  tab,
  color,
  focused,
}: {
  tab: TabIconName;
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

function SwipeTabsContent({ state, descriptors, actions, emitter, preloadAll }: SwipeTabsContentProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pagerRef = useRef<PagerViewRef>(null);
  const visiblePageRef = useRef(state.index);
  const routeCount = state.routes.length;

  useEffect(() => {
    preloadAll();
  }, [preloadAll]);

  useEffect(() => {
    if (Platform.OS !== 'web' && visiblePageRef.current !== state.index) {
      visiblePageRef.current = state.index;
      pagerRef.current?.setPage(state.index);
    }
  }, [state.index]);

  const handlePageSelected = useCallback(
    (event: PagerViewOnPageSelectedEvent) => {
      const nextIndex = event.nativeEvent.position;
      const nextRoute = state.routes[nextIndex];

      visiblePageRef.current = nextIndex;

      if (nextRoute && nextIndex !== state.index) {
        actions.navigate(nextRoute.name, nextRoute.params);
      }
    },
    [actions, state.index, state.routes],
  );

  const renderCurrentScreen = () => {
    const focusedRoute = state.routes[state.index];
    return <View style={styles.page}>{descriptors[focusedRoute.key].render()}</View>;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {Platform.OS === 'web' ? (
        renderCurrentScreen()
      ) : (
        <PagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={state.index}
          offscreenPageLimit={routeCount}
          onPageSelected={handlePageSelected}>
          {state.routes.map((route) => (
            <View
              key={route.key}
              collapsable={false}
              style={[styles.page, { backgroundColor: theme.background }]}>
              {descriptors[route.key].render()}
            </View>
          ))}
        </PagerView>
      )}

      <View
        accessibilityRole="tablist"
        style={[
          styles.tabBar,
          {
            bottom: Math.max(insets.bottom, 14),
          },
        ]}>
        {state.routes.map((route, index) => {
          const options = descriptors[route.key].options;
          const focused = state.index === index;
          const title = options.title ?? route.name;
          const tabIcon = options.tabIcon ?? 'library';

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={title}
              accessibilityState={{ selected: focused }}
              onPress={() => {
                const event = emitter.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (event.defaultPrevented || focused) return;

                visiblePageRef.current = index;
                pagerRef.current?.setPage(index);
                actions.navigate(route.name, route.params);
              }}
              onLongPress={() => {
                emitter.emit({ type: 'tabLongPress', target: route.key });
              }}
              style={({ pressed }) => [
                styles.tabItem,
                {
                  backgroundColor: focused ? theme.pink : theme.backgroundElement,
                  borderColor: theme.border,
                  shadowColor: theme.shadow,
                  boxShadow: `${pressed ? 1 : 4}px ${pressed ? 1 : 4}px 0px ${theme.shadow}`,
                },
                pressed && styles.tabItemPressed,
              ]}>
              <TabIcon
                tab={tabIcon}
                focused={focused}
                color={focused ? '#111111' : theme.text}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const SwipeTabs = createStandardRouterNavigator(SwipeTabsContent, TabRouter, {
  createProps: ({ state, dispatch }) => ({
    preloadAll: () => {
      state.routeNames.forEach((name) => {
        if (!state.routes.some((route) => route.name === name)) {
          dispatch({ type: 'PRELOAD', payload: { name } });
        }
      });
    },
  }),
  processState: (state) => {
    const focusedRouteName = state.routes[state.index]?.name;
    const routes = state.routeNames.flatMap((name) => {
      const route = state.routes.find((candidate) => candidate.name === name);
      return route ? [route] : [];
    });

    return {
      ...state,
      routes,
      index: Math.max(
        0,
        routes.findIndex((route) => route.name === focusedRouteName),
      ),
    };
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  tabBar: {
    position: 'absolute',
    left: '50%',
    zIndex: 100,
    width: 184,
    height: 56,
    marginLeft: -92,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  tabItem: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderRadius: 17,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  tabItemPressed: { transform: [{ translateX: 3 }, { translateY: 3 }] },
  symbol: {
    width: 25,
    height: 25,
  },
});
