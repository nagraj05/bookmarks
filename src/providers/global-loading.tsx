import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';

import { BrutalCard } from '@/components/brutal';
import { useTheme } from '@/hooks/use-theme';

type GlobalLoadingContextValue = {
  runWithLoader: <T>(task: () => Promise<T>, message?: string) => Promise<T>;
};

const GlobalLoadingContext = createContext<GlobalLoadingContextValue | null>(null);

function GlobalLoader({ visible, message }: { visible: boolean; message: string }) {
  const theme = useTheme();
  const [rotation] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) {
      rotation.stopAnimation();
      rotation.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [rotation, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View
        accessibilityViewIsModal
        accessibilityLiveRegion="polite"
        style={styles.overlay}>
        <BrutalCard backgroundColor={theme.yellow} style={styles.loaderCard}>
          <Animated.View
            style={[
              styles.loaderMark,
              {
                borderColor: theme.border,
                transform: [
                  {
                    rotate: rotation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}>
            <View style={[styles.block, styles.blockTopLeft, { backgroundColor: theme.pink }]} />
            <View style={[styles.block, styles.blockTopRight, { backgroundColor: theme.blue }]} />
            <View style={[styles.block, styles.blockBottomLeft, { backgroundColor: theme.green }]} />
            <View style={[styles.block, styles.blockBottomRight, { backgroundColor: theme.purple }]} />
          </Animated.View>
          <Text style={styles.loaderTitle}>HOLD TIGHT</Text>
          <Text style={styles.loaderMessage}>{message}</Text>
        </BrutalCard>
      </View>
    </Modal>
  );
}

export function GlobalLoadingProvider({ children }: PropsWithChildren) {
  const activeTasks = useRef(0);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [message, setMessage] = useState('Loading…');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return () => {
      if (showTimer.current) clearTimeout(showTimer.current);
    };
  }, []);

  const runWithLoader = useCallback(
    async <T,>(task: () => Promise<T>, nextMessage = 'Loading…'): Promise<T> => {
      const firstTask = activeTasks.current === 0;
      activeTasks.current += 1;
      setMessage(nextMessage);
      if (firstTask) {
        showTimer.current = setTimeout(() => setVisible(true), 140);
      }

      try {
        return await task();
      } finally {
        activeTasks.current = Math.max(0, activeTasks.current - 1);
        if (activeTasks.current === 0) {
          if (showTimer.current) clearTimeout(showTimer.current);
          showTimer.current = null;
          setVisible(false);
        }
      }
    },
    [],
  );

  return (
    <GlobalLoadingContext.Provider value={{ runWithLoader }}>
      {children}
      <GlobalLoader visible={visible} message={message} />
    </GlobalLoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(GlobalLoadingContext);
  if (!context) throw new Error('useGlobalLoading must be used inside GlobalLoadingProvider');
  return context;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  loaderCard: { width: '100%', maxWidth: 300, padding: 24, alignItems: 'center', gap: 8 },
  loaderMark: {
    width: 64,
    height: 64,
    marginBottom: 7,
    borderWidth: 3,
    borderRadius: 15,
    backgroundColor: '#111111',
  },
  block: { position: 'absolute', width: 21, height: 21, borderRadius: 5 },
  blockTopLeft: { top: 7, left: 7 },
  blockTopRight: { top: 7, right: 7 },
  blockBottomLeft: { bottom: 7, left: 7 },
  blockBottomRight: { right: 7, bottom: 7 },
  loaderTitle: { color: '#111111', fontSize: 20, lineHeight: 24, fontWeight: '900', letterSpacing: 0.8 },
  loaderMessage: { color: '#29232F', fontSize: 13, lineHeight: 18, fontWeight: '700', textAlign: 'center' },
});
