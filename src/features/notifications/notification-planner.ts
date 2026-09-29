/**
 * Notification planning (architecture only — nothing is delivered yet).
 *
 * Decides WHAT would be sent from the user's preferences and today's feed.
 * Delivery (expo-notifications + a push service) plugs in later behind
 * `deliver()` without changing these rules.
 *
 * Principles: opt-in, at most MAX_PER_DAY, never for low-importance stories.
 */
import type { HomeSections } from '@/services/types';
import type { NotificationPreferences } from '@/types/user';

export const MAX_PER_DAY = 3;
const MAJOR_IMPORTANCE = 85;

export interface PlannedNotification {
  id: string;
  kind: 'morning_briefing' | 'interest_matches' | 'major_development';
  title: string;
  body: string;
  /** "07:30" for scheduled items, "as it happens" for event-driven ones. */
  when: string;
  clusterId?: string;
}

export function planNotifications(prefs: NotificationPreferences, home: HomeSections): PlannedNotification[] {
  if (!prefs.enabled) return [];
  const plan: PlannedNotification[] = [];

  if (prefs.morningBriefing) {
    plan.push({
      id: 'briefing',
      kind: 'morning_briefing',
      title: 'Your morning briefing is ready',
      body: `${home.mustKnow.length} must-know stories and more, picked for you.`,
      when: prefs.briefingTime,
    });
  }

  const strongMatches = home.forYou.filter((r) => r.interestMatch >= 0.65);
  if (prefs.interestMatches && strongMatches.length >= 3) {
    plan.push({
      id: 'matches',
      kind: 'interest_matches',
      title: `${strongMatches.length} important stories match your interests`,
      body: strongMatches[0].story.canonicalHeadline,
      when: 'Midday',
    });
  }

  if (prefs.majorDevelopments) {
    const major = [...home.mustKnow, ...home.forYou].find(
      (r) => r.story.importanceScore >= MAJOR_IMPORTANCE && r.interestMatch > 0,
    );
    if (major) {
      plan.push({
        id: `major-${major.story.clusterId}`,
        kind: 'major_development',
        title: 'Major development',
        body: major.story.canonicalHeadline,
        when: 'As it happens',
        clusterId: major.story.clusterId,
      });
    }
  }

  return plan.slice(0, MAX_PER_DAY);
}
