import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { FinePrint, LinkedRow, Panel, PrimaryButton, SecondaryButton, Section } from "@/components/ui";
import { colors, spacing, typography } from "@/constants/theme";
import { useDecisionStore } from "@/context/decision-store";
import { useCopy } from "@/lib/i18n";
import { LanguageCode } from "@/types/decision";

export default function HomeScreen() {
  const router = useRouter();
  const { decisions, settings, updateSettings } = useDecisionStore();
  const text = useCopy(settings.language);
  const openDecisions = decisions.filter((decision) => decision.status !== "closed").slice(0, 3);
  const nextReview = [...decisions].sort(
    (a, b) => new Date(a.reviewDate).getTime() - new Date(b.reviewDate).getTime()
  )[0];

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
      {!settings.acceptedBasics ? (
        <Panel tone="amber">
          <View style={{ gap: spacing.sm }}>
            <Text selectable style={{ color: colors.ink, fontSize: typography.section, fontWeight: "800" }}>
              {text.beforeStart}
            </Text>
            <FinePrint>
              {text.disclaimer}
            </FinePrint>
          </View>
          <SecondaryButton
            label={text.understood}
            icon="checkmark"
            onPress={() => updateSettings({ acceptedBasics: true })}
          />
        </Panel>
      ) : null}

      <Panel tone="teal">
        <View style={{ gap: spacing.sm }}>
          <Text selectable style={{ color: colors.ink, fontSize: typography.title, fontWeight: "800" }}>
            {text.welcomeTitle}
          </Text>
          <Text selectable style={{ color: colors.mutedInk, fontSize: typography.body, lineHeight: 24 }}>
            {text.welcomeBody}
          </Text>
        </View>
        <PrimaryButton
          label={text.askNew}
          icon="plus"
          onPress={() => router.push("/new-decision")}
        />
      </Panel>

      {nextReview ? (
        <Section title={text.nextDecision}>
          <LinkedRow
            href={{ pathname: "/decision/[id]", params: { id: nextReview.id } }}
            title={nextReview.title}
            subtitle={`${text.confidence} ${nextReview.confidence}/100 - ${formatDate(nextReview.reviewDate, settings.language)}`}
            icon="arrow.triangle.2.circlepath"
          />
        </Section>
      ) : null}

      <Section title={text.openSessions}>
        <View style={{ gap: spacing.sm }}>
          {openDecisions.length > 0 ? (
            openDecisions.map((decision) => (
              <LinkedRow
                key={decision.id}
                href={{ pathname: "/decision/[id]", params: { id: decision.id } }}
                title={decision.title}
                subtitle={`${decision.selectedLenses.length} ${text.lensesLower} - ${decision.result.biggestRisks.length} ${text.risksLower} - ${decision.confidence}/100`}
                icon="rectangle.stack"
              />
            ))
          ) : (
            <Panel>
              <Text selectable style={{ color: colors.mutedInk, lineHeight: 22 }}>
                {text.noOpen}
              </Text>
            </Panel>
          )}
        </View>
      </Section>
    </ScrollView>
  );
}

function formatDate(value: string, language: LanguageCode) {
  return new Intl.DateTimeFormat(dateLocale(language), { day: "numeric", month: "short" }).format(new Date(value));
}

function dateLocale(language: LanguageCode) {
  return language === "tr" ? "tr-TR" : language === "ru" ? "ru-RU" : language === "de" ? "de-DE" : "en-US";
}
