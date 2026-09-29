import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AppText } from './text';

interface SnackbarAction {
  label: string;
  onPress: () => void;
}

interface SnackbarState {
  id: number;
  message: string;
  action?: SnackbarAction;
}

const SnackbarContext = createContext<(message: string, action?: SnackbarAction) => void>(() => {});

const TAB_BAR_CLEARANCE = 64;

/** Brief, non-blocking confirmations with an optional Undo. */
export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SnackbarState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const show = useCallback((message: string, action?: SnackbarAction) => {
    if (timer.current) clearTimeout(timer.current);
    setState({ id: Date.now(), message, action });
    timer.current = setTimeout(() => setState(null), 4500);
  }, []);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  return (
    <SnackbarContext.Provider value={show}>
      {children}
      {state && (
        <View pointerEvents="box-none" style={[styles.host, { bottom: insets.bottom + TAB_BAR_CLEARANCE }]}>
          <View
            key={state.id}
            accessibilityLiveRegion="polite"
            style={[styles.bar, { backgroundColor: isDark ? colors.surfaceMuted : colors.text }]}>
            <AppText variant="bodySm" style={[styles.message, { color: isDark ? colors.text : colors.background }]}>
              {state.message}
            </AppText>
            {state.action && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={state.action.label}
                onPress={() => {
                  state.action?.onPress();
                  setState(null);
                }}
                hitSlop={8}>
                <AppText variant="label" style={{ color: isDark ? colors.accent : colors.accentSoft }}>
                  {state.action.label}
                </AppText>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  return useContext(SnackbarContext);
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: Spacing.lg },
  bar: {
    width: '100%',
    maxWidth: 560,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
  },
  message: { flex: 1 },
});
