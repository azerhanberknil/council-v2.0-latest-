import { ScrollView, Text, View } from "react-native";

import { LinkedRow, Panel, Section } from "@/components/ui";
import { colors, spacing, typography } from "@/constants/theme";
import { useDecisionStore } from "@/context/decision-store";
import { useCopy } from "@/lib/i18n";
import { LanguageCode } from "@/types/decision";

export default function ReviewScreen() {
  const { decisions, settings } = useDecisionStore();
  const text = useCopy(settings.language);
  const sorted = [...decisions].sort(
    (a, b) => new Date(a.reviewDate).getTime() - new Date(b.reviewDate).getTime()
  );

  return (
    <ScrollView
      style={{ backgroundColor: colors.paper }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        minHeight: "100%",
        backgroundColor: colors.paper,
        padding: spacing.lg,
        gap: spacing.xl,
        paddingBottom: spacing.xxl,
      }}
    >
      <Panel tone="green">
        <Text selectable style={{ color: colors.ink, fontSize: typography.section, fontWeight: "800" }}>
          {text.nextReviewRhythm}
        </Text>
        <Text selectable style={{ color: colors.mutedInk, lineHeight: 23 }}>
          {text.reviewRhythmBody}
        </Text>
      </Panel>

      <Section title={text.reviewQueue}>
        <View style={{ gap: spacing.sm }}>
          {sorted.length > 0 ? (
            sorted.map((decision) => (
              <LinkedRow
                key={decision.id}
                href={{ pathname: "/decision/[id]", params: { id: decision.id } }}
                title={decision.title}
                subtitle={`${formatDate(decision.reviewDate, settings.language)} - ${decision.completedActions.length}/${decision.result.sevenDayPlan.length} ${text.step.toLocaleLowerCase(dateLocale(settings.language))}`}
                icon="calendar.badge.clock"
              />
            ))
          ) : (
            <Panel>
              <Text selectable style={{ color: colors.mutedInk }}>
                {text.noReviews}
              </Text>
            </Panel>
          )}
        </View>
      </Section>
    </ScrollView>
  );
}

function formatDate(value: string, language: LanguageCode) {
  return new Intl.DateTimeFormat(dateLocale(language), { weekday: "short", day: "numeric", month: "short" }).format(
    new Date(value)
  );
}

function dateLocale(language: LanguageCode) {
  return language === "tr" ? "tr-TR" : language === "ru" ? "ru-RU" : language === "de" ? "de-DE" : "en-US";
}
