import { useMemo, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

import { LinkedRow, Panel, Section } from "@/components/ui";
import { colors, radius, spacing } from "@/constants/theme";
import { useDecisionStore } from "@/context/decision-store";
import { useCopy } from "@/lib/i18n";
import { LanguageCode } from "@/types/decision";

export default function DecisionsScreen() {
  const { decisions, settings } = useDecisionStore();
  const text = useCopy(settings.language);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const locale = dateLocale(settings.language);
    const value = query.trim().toLocaleLowerCase(locale);
    if (!value) return decisions;
    return decisions.filter((decision) =>
      `${decision.title} ${decision.context}`.toLocaleLowerCase(locale).includes(value)
    );
  }, [decisions, query, settings.language]);

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
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={text.searchDecisions}
        placeholderTextColor={colors.faintInk}
        style={{
          minHeight: 48,
          borderRadius: radius.card,
          borderColor: colors.line,
          borderWidth: 1,
          backgroundColor: colors.surface,
          paddingHorizontal: spacing.md,
          color: colors.ink,
          fontSize: 16,
        }}
      />

      <Section title={text.decisions}>
        <View style={{ gap: spacing.sm }}>
          {filtered.length > 0 ? (
            filtered.map((decision) => (
              <LinkedRow
                key={decision.id}
                href={{ pathname: "/decision/[id]", params: { id: decision.id } }}
                title={decision.title}
                subtitle={`${decision.status === "closed" ? text.closed : text.open} - ${text.confidence} ${decision.confidence}/100 - ${formatDate(decision.createdAt, settings.language)}`}
                icon={decision.status === "closed" ? "checkmark.seal" : "doc.text.magnifyingglass"}
              />
            ))
          ) : (
            <Panel>
              <Text selectable style={{ color: colors.mutedInk }}>
                {text.noSearchResults}
              </Text>
            </Panel>
          )}
        </View>
      </Section>
    </ScrollView>
  );
}

function formatDate(value: string, language: LanguageCode) {
  return new Intl.DateTimeFormat(dateLocale(language), { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(value)
  );
}

function dateLocale(language: LanguageCode) {
  return language === "tr" ? "tr-TR" : language === "ru" ? "ru-RU" : language === "de" ? "de-DE" : "en-US";
}
