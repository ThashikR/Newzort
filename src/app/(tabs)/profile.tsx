import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, Switch, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Card, Divider, Screen, SectionHeader } from '@/components/ui/layout';
import { OptionCard } from '@/components/ui/option-card';
import { Segmented } from '@/components/ui/segmented';
import { useSnackbar } from '@/components/ui/snackbar';
import { AppText } from '@/components/ui/text';
import { env } from '@/config/env';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { TOPICS, topicLabel } from '@/constants/topics';
import { planNotifications } from '@/features/notifications/notification-planner';
import { BRIEFING_LENGTH_OPTIONS, PRIORITY_OPTIONS, SUMMARY_STYLE_OPTIONS } from '@/features/onboarding/options';
import { useTheme } from '@/hooks/use-theme';
import { newsService } from '@/services';
import { usePersonalizedFeed } from '@/state/news-store';
import { useUser } from '@/state/user-store';
import type { NewsSource } from '@/types/news';
import { confirmAction } from '@/utils/confirm';
import { shortDate } from '@/utils/time';

const TIMES = ['06:30', '07:30', '08:30', '09:30'];

export default function ProfileScreen() {
  const { colors } = useTheme();
  const user = useUser();
  const { profile } = user;
  const { sections } = usePersonalizedFeed();
  const snackbar = useSnackbar();
  const [sources, setSources] = useState<NewsSource[]>([]);

  useEffect(() => {
    newsService.listSources().then(setSources).catch(() => {});
  }, []);

  const selected = new Set(profile.interests.map((i) => i.topic));
  const n = profile.notifications;
  const planned = planNotifications(n, sections);
  const initial = (profile.name.trim()[0] ?? 'V').toUpperCase();

  return (
    <Screen>
      {/* Profile */}
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <AppText style={[styles.avatarText, { color: colors.onAccent }]}>{initial}</AppText>
        </View>
        <View style={styles.flex}>
          <TextInput
            value={profile.name}
            onChangeText={user.setName}
            placeholder="Add your name"
            placeholderTextColor={colors.textTertiary}
            accessibilityLabel="Your name"
            maxLength={40}
            style={[styles.nameInput, { color: colors.text }]}
          />
          <AppText variant="caption">Reading with Vartify since {shortDate(profile.createdAt)}</AppText>
        </View>
      </View>

      <View style={styles.stats}>
        <Stat label="Saved" value={profile.saved.length} />
        <Stat label="Read" value={profile.readIds.length} />
        <Stat label="Liked" value={profile.likedIds.length} />
      </View>

      {/* Interests */}
      <SectionHeader title="Interests" subtitle="Topics that shape your feed" />
      <View style={styles.wrap}>
        {TOPICS.map((t) => (
          <Chip key={t.id} label={t.label} selected={selected.has(t.id)} onPress={() => user.toggleInterest(t.id)} showCheck />
        ))}
      </View>
      {profile.interests.length === 0 && (
        <AppText variant="caption" color="warning">
          With no interests selected, your feed shows only the most important general news.
        </AppText>
      )}

      {profile.interests.length > 0 && (
        <>
          <SectionHeader title="Interest priorities" subtitle="High-priority topics rank higher" />
          <Card>
            {profile.interests.map((i, idx) => (
              <View key={i.topic}>
                {idx > 0 && <Divider />}
                <View style={styles.priorityRow}>
                  <AppText variant="label" style={styles.flex}>
                    {topicLabel(i.topic)}
                  </AppText>
                  <View style={styles.segmented}>
                    <Segmented
                      options={PRIORITY_OPTIONS}
                      value={i.priority}
                      onChange={(p) => user.setPriority(i.topic, p)}
                      accessibilityLabel={`${topicLabel(i.topic)} priority`}
                    />
                  </View>
                </View>
              </View>
            ))}
          </Card>
        </>
      )}

      {/* Briefing & style */}
      <SectionHeader title="Briefing length" />
      <Segmented
        options={BRIEFING_LENGTH_OPTIONS.map((o) => ({ value: o.value, label: `${o.value} min` }))}
        value={profile.briefingLength}
        onChange={user.setBriefingLength}
        accessibilityLabel="Briefing length"
      />

      <SectionHeader title="Summary style" />
      <View style={styles.list}>
        {SUMMARY_STYLE_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            label={o.label}
            description={o.description}
            selected={profile.summaryStyle === o.value}
            onPress={() => user.setSummaryStyle(o.value)}
          />
        ))}
      </View>

      {/* Notifications */}
      <SectionHeader title="Notifications" subtitle={`Off by default. Never more than 3 a day.`} />
      <Card>
        <ToggleRow
          label="Allow notifications"
          value={n.enabled}
          onChange={(enabled) => user.setNotifications({ enabled })}
        />
        {n.enabled && (
          <>
            <Divider />
            <ToggleRow
              label="Morning briefing is ready"
              value={n.morningBriefing}
              onChange={(morningBriefing) => user.setNotifications({ morningBriefing })}
            />
            {n.morningBriefing && (
              <View style={styles.times}>
                {TIMES.map((t) => (
                  <Chip key={t} label={t} selected={n.briefingTime === t} onPress={() => user.setNotifications({ briefingTime: t })} />
                ))}
              </View>
            )}
            <Divider />
            <ToggleRow
              label="Important stories matching my interests"
              value={n.interestMatches}
              onChange={(interestMatches) => user.setNotifications({ interestMatches })}
            />
            <Divider />
            <ToggleRow
              label="Major developments in my topics"
              value={n.majorDevelopments}
              onChange={(majorDevelopments) => user.setNotifications({ majorDevelopments })}
            />
          </>
        )}
      </Card>
      {n.enabled && (
        <View style={styles.list}>
          <AppText variant="caption">Today you would receive:</AppText>
          {planned.length === 0 ? (
            <AppText variant="bodySm" color="textSecondary">
              Nothing today — no stories meet your notification settings.
            </AppText>
          ) : (
            planned.map((p) => (
              <View key={p.id} style={[styles.notif, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="notifications-outline" size={18} color={colors.accent} />
                <View style={styles.flex}>
                  <AppText variant="label">{p.title}</AppText>
                  <AppText variant="bodySm" color="textSecondary" numberOfLines={2}>
                    {p.body}
                  </AppText>
                </View>
                <AppText variant="caption">{p.when}</AppText>
              </View>
            ))
          )}
          <AppText variant="caption" color="textTertiary">
            Preview only — notification delivery is switched on in a later release.
          </AppText>
        </View>
      )}

      {/* Sources */}
      <SectionHeader title="Sources" subtitle="Publishers Vartify reads from" />
      <Card>
        <AppText variant="bodySm" color="textSecondary" style={styles.cardIntro}>
          Every summary lists the articles it was built from. Source quality is set editorially — it is not decided by AI.
          {env.useMockData ? ' The publishers below are fictional demo outlets.' : ''}
        </AppText>
        {sources.map((s) => (
          <View key={s.id}>
            <Divider />
            <View style={styles.sourceRow}>
              <View style={styles.flex}>
                <AppText variant="label">{s.name}</AppText>
                <AppText variant="caption">{SOURCE_KIND[s.kind]}</AppText>
              </View>
              <AppText variant="caption">{Math.round(s.reliability * 100)}% quality</AppText>
            </View>
          </View>
        ))}
      </Card>

      {/* Privacy */}
      <SectionHeader title="Privacy" />
      <Card>
        <View style={styles.list}>
          <InfoLine icon="phone-portrait-outline" text="Your interests and reading history are stored only on this device." />
          <InfoLine icon="person-remove-outline" text="No account, no ads, no third-party tracking." />
          <InfoLine icon="key-outline" text="AI and news API keys live on our server, never inside the app." />
        </View>
      </Card>
      <View style={styles.list}>
        <Button
          label="Reset personalization"
          icon="refresh"
          variant="secondary"
          onPress={() =>
            confirmAction(
              'Reset personalization?',
              'This clears your likes, hidden stories and reading history. Your interests and saved stories stay.',
              'Reset',
              () => {
                user.resetPersonalization();
                snackbar('Personalization reset');
              },
            )
          }
        />
        <Button
          label="Delete my data and start over"
          icon="trash-outline"
          variant="ghost"
          onPress={() =>
            confirmAction(
              'Delete all data?',
              'This removes everything Vartify has stored on this device and restarts onboarding.',
              'Delete',
              user.startOver,
            )
          }
        />
      </View>

      {/* About */}
      <SectionHeader title="About" />
      <Card>
        <View style={styles.list}>
          <AppText style={[styles.wordmark, { color: colors.accent }]}>Vartify</AppText>
          <AppText variant="bodySm" color="textSecondary">
            Your personal newspaper and AI news analyst. Vartify groups coverage of the same event from multiple publishers,
            summarises the facts they share, and always links back to the original reporting.
          </AppText>
          <AppText variant="caption">
            Version {env.appVersion} · {env.useMockData ? 'Demo data' : 'Live data'}
          </AppText>
        </View>
      </Card>
    </Screen>
  );
}

const SOURCE_KIND: Record<NewsSource['kind'], string> = {
  wire: 'News agency',
  national: 'National newspaper',
  business: 'Business publication',
  technology: 'Technology publication',
  science: 'Science publication',
  regional: 'Regional publication',
};

function Stat({ label, value }: { label: string; value: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppText variant="headline">{value}</AppText>
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.toggleRow}>
      <AppText variant="body" style={styles.flex}>
        {label}
      </AppText>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ true: colors.accent, false: colors.border }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

function InfoLine({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.infoLine}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <AppText variant="bodySm" style={styles.flex}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: Fonts.serif, fontSize: 24, fontWeight: '700' },
  nameInput: { fontFamily: Fonts.serif, fontSize: 24, fontWeight: '700', paddingVertical: 2 },
  stats: { flexDirection: 'row', gap: Spacing.sm },
  stat: { flex: 1, alignItems: 'center', borderRadius: Radius.md, borderWidth: StyleSheet.hairlineWidth, paddingVertical: Spacing.md },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  list: { gap: Spacing.md },
  priorityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  segmented: { width: 210 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingBottom: Spacing.md },
  notif: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  cardIntro: { paddingBottom: Spacing.md },
  sourceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.md },
  infoLine: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  wordmark: { fontFamily: Fonts.serif, fontSize: 20, fontWeight: '700' },
});
