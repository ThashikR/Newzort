import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useNews } from '@/state/news-store';
import type { AssistantAnswer } from '@/types/ai';

/** Renders a structured answer: Facts, Analysis and Uncertainty are always visually separate. */
export function AnswerView({ answer }: { answer: AssistantAnswer }) {
  const { colors } = useTheme();
  const { getStory } = useNews();
  const openStory = (id: string) => router.push({ pathname: '/story/[id]', params: { id } });

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppText variant="body">{answer.intro}</AppText>

      {answer.facts.length > 0 && (
        <Block icon="checkmark-done-outline" title="Facts" subtitle="Reported by the sources" tone="positive">
          {answer.facts.map((f, i) => (
            <Pressable
              key={i}
              onPress={() => openStory(f.clusterId)}
              accessibilityRole="button"
              accessibilityHint="Opens the story this fact comes from"
              style={({ pressed }) => [styles.fact, { opacity: pressed ? 0.7 : 1 }]}>
              <AppText variant="bodySm">{f.text}</AppText>
              <AppText variant="caption" color="accent">
                {f.sourceNames.join(', ')} →
              </AppText>
            </Pressable>
          ))}
        </Block>
      )}

      {answer.analysis.length > 0 && (
        <Block icon="bulb-outline" title="Analysis" subtitle="Why it matters — interpretation, not reporting" tone="accent">
          {answer.analysis.map((a, i) => (
            <AppText key={i} variant="bodySm">
              {a}
            </AppText>
          ))}
        </Block>
      )}

      {answer.uncertainty.length > 0 && (
        <Block icon="help-circle-outline" title="Uncertainty" subtitle="What isn’t known or confirmed" tone="warning">
          {answer.uncertainty.map((u, i) => (
            <AppText key={i} variant="bodySm" color="textSecondary">
              {u}
            </AppText>
          ))}
        </Block>
      )}

      {answer.relatedClusterIds.length > 0 && (
        <View style={styles.related}>
          <AppText variant="eyebrow">Related stories</AppText>
          {answer.relatedClusterIds.map((id) => {
            const s = getStory(id);
            if (!s) return null;
            return (
              <Pressable
                key={id}
                onPress={() => openStory(id)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.relatedRow, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
                <AppText variant="bodySm" style={styles.flex} numberOfLines={2}>
                  {s.canonicalHeadline}
                </AppText>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </Pressable>
            );
          })}
        </View>
      )}

      {answer.generatedBy === 'demo' && (
        <AppText variant="caption" color="textTertiary">
          Demo assistant: assembled from stories in your feed. No AI model is connected yet.
        </AppText>
      )}
    </View>
  );
}

function Block({
  icon,
  title,
  subtitle,
  tone,
  children,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  tone: keyof ThemeColors;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.block, { borderLeftColor: colors[tone] }]}>
      <View style={styles.blockHeader}>
        <Ionicons name={icon} size={16} color={colors[tone]} />
        <AppText variant="eyebrow" color={tone}>
          {title}
        </AppText>
      </View>
      <AppText variant="caption" color="textTertiary">
        {subtitle}
      </AppText>
      <View style={styles.blockBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.lg },
  block: { borderLeftWidth: 3, paddingLeft: Spacing.md, gap: 2 },
  blockHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  blockBody: { gap: Spacing.sm, marginTop: Spacing.sm },
  fact: { gap: 2 },
  related: { gap: Spacing.sm },
  relatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  flex: { flex: 1 },
});
