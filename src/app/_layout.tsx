import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SnackbarProvider } from '@/components/ui/snackbar';
import { UpdateNotice } from '@/components/ui/update-notice';
import { useTheme } from '@/hooks/use-theme';
import { NewsProvider } from '@/state/news-store';
import { UserProvider, useUser } from '@/state/user-store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <NewsProvider>
          <SnackbarProvider>
            <RootNavigator />
          </SnackbarProvider>
        </NewsProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { profile, hydrated } = useUser();
  const { isDark, colors } = useTheme();

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync();
  }, [hydrated]);

  // Keep the splash screen up until the saved profile is loaded,
  // so returning users never see onboarding flash by.
  if (!hydrated) return null;

  const navTheme = isDark ? DarkTheme : DefaultTheme;
  const theme = {
    ...navTheme,
    colors: { ...navTheme.colors, background: colors.background, card: colors.background, primary: colors.accent },
  };

  return (
    <ThemeProvider value={theme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        {/* New users only see onboarding; everyone else goes straight to their briefing. */}
        <Stack.Protected guard={profile.onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="story/[id]" />
          <Stack.Screen name="ask" options={{ presentation: 'modal' }} />
        </Stack.Protected>
        <Stack.Protected guard={!profile.onboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
      </Stack>
      <UpdateNotice />
    </ThemeProvider>
  );
}

export const unstable_settings = {
  anchor: '(tabs)',
};
