import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { userService } from '@/services';
import type { StoryCluster, TopicId } from '@/types/news';
import type {
  BriefingLength,
  FeedbackKind,
  InterestPriority,
  NotificationPreferences,
  SummaryStyle,
  UserInterest,
  UserProfile,
} from '@/types/user';

export const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  enabled: false, // opt-in: nothing is sent until the user turns it on
  morningBriefing: true,
  interestMatches: false,
  majorDevelopments: false,
  briefingTime: '07:30',
};

export function createEmptyProfile(): UserProfile {
  return {
    name: '',
    onboarded: false,
    interests: [],
    summaryStyle: 'balanced',
    briefingLength: 10,
    likedIds: [],
    dislikedIds: [],
    saved: [],
    readIds: [],
    notifications: DEFAULT_NOTIFICATIONS,
    createdAt: new Date().toISOString(),
  };
}

export interface OnboardingResult {
  name: string;
  interests: UserInterest[];
  summaryStyle: SummaryStyle;
  briefingLength: BriefingLength;
}

interface UserStore {
  profile: UserProfile;
  hydrated: boolean;
  completeOnboarding(result: OnboardingResult): void;
  setName(name: string): void;
  toggleInterest(topic: TopicId): void;
  setPriority(topic: TopicId, priority: InterestPriority): void;
  setSummaryStyle(style: SummaryStyle): void;
  setBriefingLength(length: BriefingLength): void;
  setNotifications(patch: Partial<NotificationPreferences>): void;
  toggleSave(story: StoryCluster): void;
  toggleLike(clusterId: string): void;
  setNotInterested(clusterId: string, value: boolean): void;
  markRead(clusterId: string): void;
  resetPersonalization(): void;
  startOver(): void;
}

const UserContext = createContext<UserStore | null>(null);

const without = (list: string[], id: string) => list.filter((x) => x !== id);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(createEmptyProfile);
  const [hydrated, setHydrated] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    userService.load().then((stored) => {
      if (stored) setProfile({ ...createEmptyProfile(), ...stored });
      loaded.current = true;
      setHydrated(true);
    });
  }, []);

  // Persist every change after the initial load.
  useEffect(() => {
    if (loaded.current) userService.save(profile).catch(() => {});
  }, [profile]);

  const feedback = useCallback((clusterId: string, kind: FeedbackKind) => {
    userService.recordFeedback({ clusterId, kind, at: new Date().toISOString() });
  }, []);

  const update = useCallback((fn: (p: UserProfile) => UserProfile) => setProfile(fn), []);

  const store = useMemo<UserStore>(
    () => ({
      profile,
      hydrated,
      completeOnboarding: (r) => update((p) => ({ ...p, ...r, onboarded: true })),
      setName: (name) => update((p) => ({ ...p, name })),
      toggleInterest: (topic) =>
        update((p) => ({
          ...p,
          interests: p.interests.some((i) => i.topic === topic)
            ? p.interests.filter((i) => i.topic !== topic)
            : [...p.interests, { topic, priority: 'medium' }],
        })),
      setPriority: (topic, priority) =>
        update((p) => ({ ...p, interests: p.interests.map((i) => (i.topic === topic ? { ...i, priority } : i)) })),
      setSummaryStyle: (summaryStyle) => update((p) => ({ ...p, summaryStyle })),
      setBriefingLength: (briefingLength) => update((p) => ({ ...p, briefingLength })),
      setNotifications: (patch) => update((p) => ({ ...p, notifications: { ...p.notifications, ...patch } })),
      toggleSave: (story) =>
        update((p) => {
          const id = story.clusterId;
          const isSaved = p.saved.some((s) => s.clusterId === id);
          if (!isSaved) feedback(id, 'save');
          return {
            ...p,
            saved: isSaved
              ? p.saved.filter((s) => s.clusterId !== id)
              : [{ clusterId: id, savedAt: new Date().toISOString(), story }, ...p.saved],
          };
        }),
      toggleLike: (id) =>
        update((p) => {
          const liked = p.likedIds.includes(id);
          if (!liked) feedback(id, 'like');
          return { ...p, likedIds: liked ? without(p.likedIds, id) : [...p.likedIds, id], dislikedIds: without(p.dislikedIds, id) };
        }),
      setNotInterested: (id, value) =>
        update((p) => {
          if (value) feedback(id, 'not_interested');
          return {
            ...p,
            dislikedIds: value ? [...without(p.dislikedIds, id), id] : without(p.dislikedIds, id),
            likedIds: value ? without(p.likedIds, id) : p.likedIds,
          };
        }),
      markRead: (id) =>
        update((p) => {
          if (p.readIds.includes(id)) return p;
          feedback(id, 'read');
          return { ...p, readIds: [...p.readIds, id].slice(-300) };
        }),
      resetPersonalization: () => update((p) => ({ ...p, likedIds: [], dislikedIds: [], readIds: [] })),
      startOver: () => {
        userService.clear().catch(() => {});
        setProfile(createEmptyProfile());
      },
    }),
    [profile, hydrated, update, feedback],
  );

  return <UserContext.Provider value={store}>{children}</UserContext.Provider>;
}

export function useUser(): UserStore {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
}
