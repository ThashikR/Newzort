import AsyncStorage from '@react-native-async-storage/async-storage';

import type { UserFeedback, UserProfile } from '@/types/user';

import type { UserService } from '../types';

const PROFILE_KEY = 'newzort:profile:v1';
const FEEDBACK_KEY = 'newzort:feedback:v1';
const MAX_FEEDBACK = 500;

/**
 * Stores the profile on-device. When accounts arrive (Phase 9) this becomes a
 * synced implementation; the queued feedback is uploaded to the backend.
 */
export const localUserService: UserService = {
  async load() {
    try {
      const raw = await AsyncStorage.getItem(PROFILE_KEY);
      return raw ? (JSON.parse(raw) as UserProfile) : null;
    } catch {
      return null;
    }
  },
  async save(profile) {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  },
  async clear() {
    await AsyncStorage.multiRemove([PROFILE_KEY, FEEDBACK_KEY]);
  },
  async recordFeedback(feedback: UserFeedback) {
    try {
      const raw = await AsyncStorage.getItem(FEEDBACK_KEY);
      const list: UserFeedback[] = raw ? JSON.parse(raw) : [];
      list.push(feedback);
      await AsyncStorage.setItem(FEEDBACK_KEY, JSON.stringify(list.slice(-MAX_FEEDBACK)));
    } catch {
      // Feedback is best-effort; never block the UI on it.
    }
  },
};
