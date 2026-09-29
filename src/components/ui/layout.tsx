import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AppText } from './text';

interface ScreenProps extends ScrollViewProps {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Adds top safe-area padding (tabs without a header). */
  padTop?: boolean;
}

/** Scrollable, centred, max-width page with the app background. */
export function Screen({ children, refreshing, onRefresh, padTop = true, contentContainerStyle, ...rest }: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: (padTop ? insets.top : 0) + Spacing.lg, paddingBottom: Spacing.xxxl },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.textSecondary} /> : undefined
      }
      {...rest}>
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  );
}

export function SectionHeader({ title, subtitle, accent }: { title: string; subtitle?: string; accent?: 'mustKnow' | 'accent' }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeader} accessibilityRole="header">
      <View style={styles.sectionTitleRow}>
        {accent && <View style={[styles.sectionMark, { backgroundColor: colors[accent] }]} />}
        <AppText variant="eyebrow" color={accent ?? 'text'}>
          {title}
        </AppText>
      </View>
      {subtitle ? <AppText variant="caption">{subtitle}</AppText> : null}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ScrollViewProps['style'] }) {
  const { colors } = useTheme();
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>{children}</View>;
}

export function Divider() {
  const { colors } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />;
}

/** Back button + optional right-side actions for stack screens without a native header. */
export function TopBar({ right, onBack }: { right?: ReactNode; onBack?: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.topBar, { paddingTop: insets.top + Spacing.xs, backgroundColor: colors.background, borderColor: colors.border }]}>
      <Pressable
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={8}
        style={styles.back}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </Pressable>
      <View style={styles.topBarRight}>{right}</View>
    </View>
  );
}

export function EmptyState({ icon, title, message, action }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; message: string; action?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceMuted }]}>
        <Ionicons name={icon} size={26} color={colors.textSecondary} />
      </View>
      <AppText variant="headlineSm" style={styles.center}>
        {title}
      </AppText>
      <AppText variant="bodySm" color="textSecondary" style={styles.center}>
        {message}
      </AppText>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, alignItems: 'center' },
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.lg },
  sectionHeader: { gap: 2, marginTop: Spacing.lg },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionMark: { width: 3, height: 14, borderRadius: 2 },
  card: { borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.lg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  topBarRight: { flexDirection: 'row', alignItems: 'center' },
  empty: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xxxl, paddingHorizontal: Spacing.xl },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});
