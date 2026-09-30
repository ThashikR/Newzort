import Ionicons from '@expo/vector-icons/Ionicons';
import * as Updates from 'expo-updates';
import { useEffect, useRef } from 'react';
import { AppState, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AppText } from './text';

const CHECK_EVERY_MS = 15 * 60_000;
const TAB_BAR_CLEARANCE = 64;

/**
 * Over-the-air updates (EAS Update). Quietly checks on launch and when the app
 * returns to the foreground; once a new version has downloaded, offers a
 * one-tap restart. Does nothing in Expo Go, development or on the web.
 */
export function UpdateNotice() {
  if (!Updates.isEnabled) return null;
  return <UpdateNoticeInner />;
}

function UpdateNoticeInner() {
  const { isUpdatePending } = Updates.useUpdates();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const lastCheck = useRef(0);

  useEffect(() => {
    const check = async () => {
      if (Date.now() - lastCheck.current < CHECK_EVERY_MS) return;
      lastCheck.current = Date.now();
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) await Updates.fetchUpdateAsync();
      } catch {
        // Offline or server unreachable — try again next time.
      }
    };
    check();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && check());
    return () => sub.remove();
  }, []);

  if (!isUpdatePending) return null;

  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom: insets.bottom + TAB_BAR_CLEARANCE }]}>
      <View style={[styles.bar, { backgroundColor: colors.accentStrong }]} accessibilityLiveRegion="polite">
        <Ionicons name="sparkles" size={18} color={colors.onAccent} />
        <AppText variant="bodySm" style={[styles.flex, { color: colors.onAccent }]}>
          A new version of Newzort is ready.
        </AppText>
        <Pressable
          onPress={() => Updates.reloadAsync().catch(() => {})}
          accessibilityRole="button"
          accessibilityLabel="Restart to update"
          hitSlop={8}
          style={({ pressed }) => [styles.button, { backgroundColor: colors.onAccent, opacity: pressed ? 0.8 : 1 }]}>
          <AppText variant="label" style={{ color: colors.accentStrong }}>
            Restart
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

/** "0.2.0 · update 1a2b3c" or "0.2.0 · built-in" — shown in About for support/debugging. */
export function versionLabel(appVersion: string): string {
  if (!Updates.isEnabled) return `${appVersion} · development`;
  return Updates.isEmbeddedLaunch || !Updates.updateId
    ? `${appVersion} · built-in`
    : `${appVersion} · update ${Updates.updateId.slice(0, 8)}`;
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: Spacing.lg },
  bar: {
    width: '100%',
    maxWidth: 560,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm,
    borderRadius: Radius.md,
  },
  flex: { flex: 1 },
  button: { borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, minHeight: 36, justifyContent: 'center' },
});
