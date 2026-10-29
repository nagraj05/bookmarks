import type { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';

import { Brutal } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { readableTextColor } from '@/lib/color';

type ButtonProps = PropsWithChildren<{
  onPress: () => void;
  backgroundColor?: string;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}>;

export function BrutalButton({
  children,
  onPress,
  backgroundColor,
  disabled,
  loading,
  compact,
  style,
  textStyle,
}: ButtonProps) {
  const theme = useTheme();
  const resolvedBackgroundColor = backgroundColor ?? theme.yellow;
  const foregroundColor = readableTextColor(resolvedBackgroundColor);
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: resolvedBackgroundColor,
          borderColor: theme.border,
          shadowColor: theme.shadow,
          boxShadow: `${pressed ? 1 : compact ? 4 : Brutal.shadowOffset}px ${pressed ? 1 : compact ? 4 : Brutal.shadowOffset}px 0px ${theme.shadow}`,
        },
        compact && styles.compactButton,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={foregroundColor} />
      ) : (
        <Text style={[styles.buttonText, { color: foregroundColor }, textStyle]}>{children}</Text>
      )}
    </Pressable>
  );
}

export function BrutalCard({
  children,
  backgroundColor,
  style,
}: PropsWithChildren<{ backgroundColor?: string; style?: ViewStyle }>) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: backgroundColor ?? theme.backgroundElement,
          borderColor: theme.border,
          shadowColor: theme.shadow,
          boxShadow: `${Brutal.shadowOffset}px ${Brutal.shadowOffset}px 0px ${theme.shadow}`,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

export function ScreenHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerCopy}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>{eyebrow}</Text> : null}
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      </View>
      {action}
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  const theme = useTheme();
  return (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderWidth: Brutal.borderWidth,
    borderRadius: Brutal.radius,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: Brutal.shadowOffset, height: Brutal.shadowOffset },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 7,
  },
  compactButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 7,
    shadowOffset: { width: 4, height: 4 },
    elevation: 4,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  pressed: {
    transform: [{ translateX: 4 }, { translateY: 4 }],
    shadowOffset: { width: 1, height: 1 },
  },
  disabled: {
    opacity: 0.45,
  },
  card: {
    borderWidth: Brutal.borderWidth,
    borderRadius: Brutal.radius,
    shadowOffset: { width: Brutal.shadowOffset, height: Brutal.shadowOffset },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 7,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -1.2,
  },
  emptyState: {
    minHeight: 180,
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyBody: {
    maxWidth: 280,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    textAlign: 'center',
  },
});
