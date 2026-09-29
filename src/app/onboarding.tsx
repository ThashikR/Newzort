import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { OptionCard } from '@/components/ui/option-card';
import { Segmented } from '@/components/ui/segmented';
import { AppText } from '@/components/ui/text';
import { Brand } from '@/constants/brand';
import { Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { TOPICS, topicLabel } from '@/constants/topics';
import { BRIEFING_LENGTH_OPTIONS, PRIORITY_OPTIONS, SUMMARY_STYLE_OPTIONS } from '@/features/onboarding/options';
import { useTheme } from '@/hooks/use-theme';
import { useUser } from '@/state/user-store';
import type { TopicId } from '@/types/news';
import type { BriefingLength, InterestPriority, SummaryStyle, UserInterest } from '@/types/user';

const STEPS = 5;

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useUser();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [interests, setInterests] = useState<UserInterest[]>([]);
  const [summaryStyle, setSummaryStyle] = useState<SummaryStyle>('balanced');
  const [briefingLength, setBriefingLength] = useState<BriefingLength>(10);

  const selected = new Set(interests.map((i) => i.topic));
  const toggle = (topic: TopicId) =>
    setInterests((list) =>
      list.some((i) => i.topic === topic) ? list.filter((i) => i.topic !== topic) : [...list, { topic, priority: 'medium' }],
    );
  const setPriority = (topic: TopicId, priority: InterestPriority) =>
    setInterests((list) => list.map((i) => (i.topic === topic ? { ...i, priority } : i)));

  const canContinue = step !== 1 || interests.length > 0;
  const isLast = step === STEPS - 1;

  const next = () => {
    if (isLast) {
      completeOnboarding({ name: name.trim(), interests, summaryStyle, briefingLength });
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.headerRow}>
          {step > 0 ? (
            <Pressable
              onPress={() => setStep((s) => s - 1)}
              accessibilityRole="button"
              accessibilityLabel="Previous step"
              hitSlop={8}
              style={styles.back}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
          ) : (
            <View style={styles.back} />
          )}
          <AppText variant="caption" accessibilityLabel={`Step ${step + 1} of ${STEPS}`}>
            {step + 1} of {STEPS}
          </AppText>
          <View style={styles.back} />
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.accent, width: `${((step + 1) / STEPS) * 100}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Animated.View key={step} entering={FadeInRight.duration(220)} style={styles.content}>
          {step === 0 && <WelcomeStep name={name} onName={setName} />}

          {step === 1 && (
            <>
              <StepTitle title="What do you want to follow?" subtitle="Pick as many as you like. You can change these any time." />
              <View style={styles.chips}>
                {TOPICS.map((t) => (
                  <Chip key={t.id} label={t.label} selected={selected.has(t.id)} onPress={() => toggle(t.id)} showCheck />
                ))}
              </View>
              <AppText variant="caption">
                {interests.length === 0 ? 'Select at least one topic to continue.' : `${interests.length} selected`}
              </AppText>
            </>
          )}

          {step === 2 && (
            <>
              <StepTitle
                title="How much does each matter?"
                subtitle="High-priority topics rise to the top of your briefing."
              />
              <View style={styles.list}>
                {interests.map((i) => (
                  <View key={i.topic} style={[styles.priorityRow, { borderColor: colors.border }]}>
                    <AppText variant="label" style={styles.flex}>
                      {topicLabel(i.topic)}
                    </AppText>
                    <View style={styles.segmented}>
                      <Segmented
                        options={PRIORITY_OPTIONS}
                        value={i.priority}
                        onChange={(p) => setPriority(i.topic, p)}
                        accessibilityLabel={`${topicLabel(i.topic)} priority`}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <StepTitle title="How do you like your news?" subtitle="This sets how much detail each story shows." />
              <View style={styles.list}>
                {SUMMARY_STYLE_OPTIONS.map((o) => (
                  <OptionCard
                    key={o.value}
                    label={o.label}
                    description={o.description}
                    selected={summaryStyle === o.value}
                    onPress={() => setSummaryStyle(o.value)}
                  />
                ))}
              </View>
            </>
          )}

          {step === 4 && (
            <>
              <StepTitle title="How long is your daily briefing?" subtitle="We’ll fit the most important stories into your time." />
              <View style={styles.list}>
                {BRIEFING_LENGTH_OPTIONS.map((o) => (
                  <OptionCard
                    key={o.value}
                    label={o.label}
                    description={o.description}
                    selected={briefingLength === o.value}
                    onPress={() => setBriefingLength(o.value)}
                  />
                ))}
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg, borderColor: colors.border }]}>
        <Button
          label={step === 0 ? 'Get started' : isLast ? 'Build my briefing' : 'Continue'}
          onPress={next}
          disabled={!canContinue}
          iconRight={isLast ? 'sparkles-outline' : 'arrow-forward'}
          style={styles.footerButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function StepTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.titleBlock}>
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      <AppText variant="body" color="textSecondary">
        {subtitle}
      </AppText>
    </View>
  );
}

function WelcomeStep({ name, onName }: { name: string; onName: (v: string) => void }) {
  const { colors } = useTheme();
  const points: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }[] = [
    { icon: 'layers-outline', text: 'Stories from many sources, combined into one clear summary.' },
    { icon: 'bulb-outline', text: 'Key points and why each story matters — in minutes.' },
    { icon: 'link-outline', text: 'Every summary shows its sources, with links to the originals.' },
    { icon: 'options-outline', text: 'Learns what you care about. You stay in control.' },
  ];
  return (
    <>
      <View style={styles.brandBlock}>
        <AppText style={[styles.wordmark, { color: colors.accent }]}>{Brand.name}</AppText>
        <AppText variant="caption" color="textSecondary">
          {Brand.tagline}
        </AppText>
      </View>
      <AppText variant="display" accessibilityRole="header">
        Your news.{'\n'}Your interests.
      </AppText>
      <AppText variant="body" color="textSecondary">
        Newzort reads today’s news from multiple sources, groups coverage of the same event, and gives you a short, personal
        briefing on what actually matters to you.
      </AppText>
      <View style={styles.list}>
        {points.map((p) => (
          <View key={p.text} style={styles.point}>
            <View style={[styles.pointIcon, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name={p.icon} size={18} color={colors.accent} />
            </View>
            <AppText variant="bodySm" style={styles.flex}>
              {p.text}
            </AppText>
          </View>
        ))}
      </View>
      <View style={styles.nameBlock}>
        <AppText variant="label">What should we call you?</AppText>
        <TextInput
          value={name}
          onChangeText={onName}
          placeholder="Your first name (optional)"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="words"
          autoComplete="given-name"
          returnKeyType="done"
          maxLength={40}
          accessibilityLabel="Your first name, optional"
          style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 3, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 3, borderRadius: 2 },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxxl, alignItems: 'center' },
  content: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.xl },
  titleBlock: { gap: Spacing.sm, marginTop: Spacing.md },
  brandBlock: { marginTop: Spacing.lg, gap: 2 },
  wordmark: { fontFamily: Fonts.serif, fontSize: 22, fontWeight: '700', letterSpacing: 0.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  list: { gap: Spacing.md },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  segmented: { width: 210 },
  point: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  pointIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  nameBlock: { gap: Spacing.sm },
  input: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, minHeight: 50, fontSize: 16 },
  footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  footerButton: { width: '100%', maxWidth: MaxContentWidth },
});
