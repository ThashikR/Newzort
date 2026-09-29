import { router } from 'expo-router';
import { Share } from 'react-native';

import { useSnackbar } from '@/components/ui/snackbar';
import { useUser } from '@/state/user-store';
import type { StoryCluster } from '@/types/news';

/** Save / like / hide / share for one story, with user feedback built in. */
export function useStoryActions(story: StoryCluster) {
  const { profile, toggleSave, toggleLike, setNotInterested } = useUser();
  const snackbar = useSnackbar();
  const id = story.clusterId;

  const saved = profile.saved.some((s) => s.clusterId === id);
  const liked = profile.likedIds.includes(id);
  const read = profile.readIds.includes(id);

  return {
    saved,
    liked,
    read,
    /** `from: 'briefing'` shows Prev/Next through the briefing on the story page. */
    open: (from?: 'briefing') => router.push({ pathname: '/story/[id]', params: from ? { id, from } : { id } }),
    toggleSave: () => {
      toggleSave(story);
      snackbar(saved ? 'Removed from Saved' : 'Saved for later', saved ? undefined : { label: 'Undo', onPress: () => toggleSave(story) });
    },
    toggleLike: () => {
      toggleLike(id);
      if (!liked) snackbar('Got it — you’ll see more like this');
    },
    notInterested: () => {
      setNotInterested(id, true);
      snackbar('Hidden. You’ll see fewer stories like this.', { label: 'Undo', onPress: () => setNotInterested(id, false) });
    },
    share: () => {
      const links = story.articles.map((a) => a.url).slice(0, 3).join('\n');
      Share.share({
        message: `${story.canonicalHeadline}\n\n${story.analysis.summary}\n\nSources:\n${links}\n\nvia Newzort`,
        title: story.canonicalHeadline,
      }).catch(() => {});
    },
  };
}
