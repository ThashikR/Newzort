import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; title: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'newspaper-outline', iconActive: 'newspaper' },
  { name: 'briefing', title: 'Briefing', icon: 'time-outline', iconActive: 'time' },
  { name: 'explore', title: 'Explore', icon: 'search-outline', iconActive: 'search' },
  { name: 'saved', title: 'Saved', icon: 'bookmark-outline', iconActive: 'bookmark' },
  { name: 'profile', title: 'Profile', icon: 'person-circle-outline', iconActive: 'person-circle' },
];

export default function TabLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: { backgroundColor: colors.tabBar, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: Fonts.sans, fontSize: 11, fontWeight: '600' },
      }}>
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons name={focused ? t.iconActive : t.icon} color={color} size={size - 2} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
