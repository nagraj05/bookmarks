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
        duration: 700,
        easing: Easing.inOut(Easing.quad),
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
          <View style={[styles.loaderShadow, { backgroundColor: theme.shadow }]}>
            <Animated.View
              style={[
                styles.loaderMark,
                {
                  backgroundColor: theme.pink,
                  borderColor: theme.border,
                  transform: [
                    {
                      rotate: rotation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '180deg'],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
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
        showTimer.current = setTimeout(() => setVisible(true), 250);
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
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  loaderCard: {
    width: '100%',
    maxWidth: 280,
    minHeight: 72,
    paddingHorizontal: 18,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  loaderShadow: {
    width: 34,
    height: 34,
    borderRadius: 4,
    transform: [{ translateX: 4 }, { translateY: 4 }],
  },
  loaderMark: {
    position: 'absolute',
    width: 30,
    height: 30,
    top: -4,
    left: -4,
    borderWidth: 3,
    borderRadius: 3,
  },
  loaderMessage: { flex: 1, color: '#111111', fontSize: 14, lineHeight: 18, fontWeight: '900' },
});
