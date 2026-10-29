import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

export function LaunchAnimation() {
  const theme = useTheme();
  const [visible, setVisible] = useState(true);
  const overlayOpacity = useSharedValue(1);
  const overlayScale = useSharedValue(1);
  const logoScale = useSharedValue(0.45);
  const logoRotation = useSharedValue(-12);
  const titleOpacity = useSharedValue(0);
  const titleOffset = useSharedValue(22);
  const badgeOpacity = useSharedValue(0);
  const badgeOffset = useSharedValue(18);
  const blockProgress = useSharedValue(0);
  const started = useRef(false);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startAnimation = () => {
    if (started.current) return;
    started.current = true;
    SplashScreen.hide();
    overlayOpacity.value = 1;
    overlayScale.value = 1;
    logoScale.value = withDelay(70, withSpring(1, { damping: 11, stiffness: 155, mass: 0.8 }));
    logoRotation.value = withDelay(
      70,
      withSequence(
        withTiming(5, { duration: 260, easing: Easing.out(Easing.cubic) }),
        withSpring(0, { damping: 9, stiffness: 140 }),
      ),
    );
    blockProgress.value = withDelay(130, withSpring(1, { damping: 12, stiffness: 130 }));
    titleOpacity.value = withDelay(320, withTiming(1, { duration: 280 }));
    titleOffset.value = withDelay(320, withSpring(0, { damping: 12, stiffness: 150 }));
    badgeOpacity.value = withDelay(540, withTiming(1, { duration: 220 }));
    badgeOffset.value = withDelay(540, withSpring(0, { damping: 12, stiffness: 150 }));
    overlayScale.value = withDelay(
      1_160,
      withTiming(1.025, { duration: 320, easing: Easing.in(Easing.cubic) }),
    );
    overlayOpacity.value = withDelay(1_160, withTiming(0, { duration: 320 }));

    finishTimer.current = setTimeout(() => setVisible(false), 1_500);
  };

  useEffect(
    () => () => {
      if (finishTimer.current) clearTimeout(finishTimer.current);
    },
    [],
  );

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    transform: [{ scale: overlayScale.value }],
  }));
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }, { rotate: `${logoRotation.value}deg` }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleOffset.value }],
  }));
  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ translateY: badgeOffset.value }],
  }));
  const leftBlockStyle = useAnimatedStyle(() => ({
    opacity: blockProgress.value,
    transform: [
      { translateX: -70 + blockProgress.value * 70 },
      { rotate: `${-16 + blockProgress.value * 7}deg` },
    ],
  }));
  const rightBlockStyle = useAnimatedStyle(() => ({
    opacity: blockProgress.value,
    transform: [
      { translateX: 70 - blockProgress.value * 70 },
      { rotate: `${14 - blockProgress.value * 7}deg` },
    ],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      accessibilityViewIsModal
      accessibilityLabel="Opening Bookmarks"
      onLayout={startAnimation}
      style={[styles.overlay, { backgroundColor: theme.background }, overlayStyle]}>
      <Animated.View
        style={[
          styles.decorBlock,
          styles.leftBlock,
          { backgroundColor: theme.blue, borderColor: theme.border, shadowColor: theme.shadow },
          leftBlockStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.decorBlock,
          styles.rightBlock,
          { backgroundColor: theme.purple, borderColor: theme.border, shadowColor: theme.shadow },
          rightBlockStyle,
        ]}
      />

      <View style={styles.hero}>
        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <View style={[styles.logoShadow, { backgroundColor: theme.shadow }]} />
          <View style={[styles.logoCard, { backgroundColor: '#FFD400', borderColor: theme.border }]}>
            <Image
              source={require('../../assets/images/bookmarks-icon-v5.png')}
              style={styles.logo}
              contentFit="cover"
              accessibilityLabel="Bookmarks logo"
            />
          </View>
        </Animated.View>

        <Animated.View style={[styles.titleGroup, titleStyle]}>
          <Text style={[styles.title, { color: theme.text }]}>BOOKMARKS</Text>
          <View style={[styles.underline, { backgroundColor: theme.pink, borderColor: theme.border }]} />
        </Animated.View>

        <Animated.View
          style={[
            styles.badge,
            { backgroundColor: theme.green, borderColor: theme.border, shadowColor: theme.shadow },
            badgeStyle,
          ]}>
          <Text style={styles.badgeText}>SAVE · FIND · KEEP</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10_000,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  hero: { alignItems: 'center', gap: 22, zIndex: 2 },
  logoWrap: { width: 142, height: 142 },
  logoShadow: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 132,
    height: 132,
    borderRadius: 29,
  },
  logoCard: {
    width: 132,
    height: 132,
    borderWidth: 4,
    borderRadius: 29,
    overflow: 'hidden',
  },
  logo: { width: '100%', height: '100%' },
  titleGroup: { alignItems: 'center', gap: 8 },
  title: { fontSize: 42, lineHeight: 47, fontWeight: '900', letterSpacing: -1.2 },
  underline: { width: 150, height: 10, borderWidth: 2, borderRadius: 3, transform: [{ rotate: '-2deg' }] },
  badge: {
    borderWidth: 3,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  badgeText: { color: '#111111', fontSize: 12, lineHeight: 16, fontWeight: '900', letterSpacing: 1.4 },
  decorBlock: {
    position: 'absolute',
    width: 112,
    height: 78,
    borderWidth: 4,
    borderRadius: 16,
    shadowOffset: { width: 7, height: 7 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 7,
  },
  leftBlock: { top: '18%', left: -25 },
  rightBlock: { right: -26, bottom: '20%' },
});
