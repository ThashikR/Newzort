import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnswerView } from '@/components/assistant/answer-view';
import { Chip } from '@/components/ui/chip';
import { AppText } from '@/components/ui/text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { aiService } from '@/services';
import { useNews } from '@/state/news-store';
import { useUser } from '@/state/user-store';
import type { AssistantMessage } from '@/types/ai';

const GENERAL_SUGGESTIONS = [
  'What happened in India’s economy today?',
  'Explain today’s AI news to me.',
  'What are the biggest cybersecurity stories today?',
  'Compare today’s news with yesterday.',
];
const STORY_SUGGESTIONS = ['Why is this important?', 'Give me the background.'];

export default function AskScreen() {
  const { storyId } = useLocalSearchParams<{ storyId?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { stories, getStory } = useNews();
  const { profile } = useUser();
  const focus = storyId ? getStory(storyId) : undefined;

  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Hidden stories are left out of general answers, but the story the user
  // explicitly asked about is always included.
  const visibleStories = stories.filter(
    (s) => !profile.dislikedIds.includes(s.clusterId) || s.clusterId === focus?.clusterId,
  );

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setInput('');
    setBusy(true);
    setMessages((m) => [...m, { id: `u${Date.now()}`, role: 'user', text: q }]);
    try {
      const answer = await aiService.ask(q, {
        stories: visibleStories,
        focusClusterId: focus?.clusterId,
        interests: profile.interests,
      });
      setMessages((m) => [...m, { id: `a${Date.now()}`, role: 'assistant', answer }]);
    } catch {
      setMessages((m) => [...m, { id: `e${Date.now()}`, role: 'assistant', text: 'Sorry — I couldn’t answer that right now. Please try again.' }]);
    } finally {
      setBusy(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  const suggestions = focus ? [...STORY_SUGGESTIONS, ...GENERAL_SUGGESTIONS.slice(0, 2)] : GENERAL_SUGGESTIONS;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? Spacing.lg : insets.top + Spacing.sm, borderColor: colors.border }]}>
        <View style={styles.flex}>
          <AppText variant="headline" accessibilityRole="header">
            Ask Vartify AI
          </AppText>
          <AppText variant="caption">Answers use only the stories in your feed, with sources.</AppText>
        </View>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
          style={[styles.close, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="close" size={20} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          {focus && (
            <View style={[styles.focus, { backgroundColor: colors.accentSoft }]}>
              <AppText variant="eyebrow" color="accent">
                Asking about
              </AppText>
              <AppText variant="headlineSm">{focus.canonicalHeadline}</AppText>
            </View>
          )}

          {messages.length === 0 && (
            <View style={styles.suggestions}>
              <AppText variant="eyebrow">Try asking</AppText>
              <View style={styles.wrap}>
                {suggestions.map((s) => (
                  <Chip key={s} label={s} onPress={() => ask(s)} />
                ))}
              </View>
            </View>
          )}

          {messages.map((m) => (
            <Animated.View key={m.id} entering={FadeInUp.duration(220)}>
              {m.role === 'user' ? (
                <View style={[styles.userBubble, { backgroundColor: colors.accent }]}>
                  <AppText variant="body" style={{ color: colors.onAccent }}>
                    {m.text}
                  </AppText>
                </View>
              ) : m.answer ? (
                <AnswerView answer={m.answer} />
              ) : (
                <AppText variant="bodySm" color="textSecondary">
                  {m.text}
                </AppText>
              )}
            </Animated.View>
          ))}

          {busy && (
            <View style={styles.thinking}>
              <ActivityIndicator size="small" color={colors.textSecondary} />
              <AppText variant="caption">Reading your stories…</AppText>
            </View>
          )}

          {messages.length > 0 && !busy && (
            <View style={styles.wrap}>
              {suggestions
                .filter((s) => !messages.some((m) => m.text === s))
                .slice(0, 3)
                .map((s) => (
                  <Chip key={s} label={s} onPress={() => ask(s)} />
                ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.composer, { paddingBottom: insets.bottom + Spacing.md, borderColor: colors.border, backgroundColor: colors.background }]}>
        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={focus ? 'Ask about this story…' : 'Ask about today’s news…'}
            placeholderTextColor={colors.textTertiary}
            onSubmitEditing={() => ask(input)}
            returnKeyType="send"
            accessibilityLabel="Your question"
            style={[styles.input, { color: colors.text }]}
          />
          <Pressable
            onPress={() => ask(input)}
            disabled={!input.trim() || busy}
            accessibilityRole="button"
            accessibilityLabel="Send question"
            style={[styles.send, { backgroundColor: input.trim() && !busy ? colors.accent : colors.border }]}>
            <Ionicons name="arrow-up" size={18} color={colors.onAccent} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl, alignItems: 'center' },
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.lg },
  focus: { borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.xs },
  suggestions: { gap: Spacing.md },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    borderRadius: Radius.lg,
    borderBottomRightRadius: Radius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  composer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  inputBox: {
    width: '100%',
    maxWidth: MaxContentWidth,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.xs,
    minHeight: 48,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: Spacing.sm },
  send: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
