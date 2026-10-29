/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#FFF8E8',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#FFD23F',
    textSecondary: '#4B4652',
    border: '#111111',
    yellow: '#FFD23F',
    pink: '#FF6B9E',
    blue: '#63D7FF',
    green: '#8BE28B',
    purple: '#B59CFF',
    danger: '#FF5C5C',
    shadow: '#111111',
  },
  dark: {
    text: '#FFFDF5',
    background: '#17151D',
    backgroundElement: '#25222E',
    backgroundSelected: '#FFD23F',
    textSecondary: '#C9C2D0',
    border: '#F2EBDD',
    yellow: '#FFD23F',
    pink: '#FF6B9E',
    blue: '#63D7FF',
    green: '#8BE28B',
    purple: '#B59CFF',
    danger: '#FF7070',
    shadow: '#F2EBDD',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Brutal = {
  borderWidth: 3,
  radius: 12,
  shadowOffset: 7,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
