import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";

import { SymbolIcon } from "@/components/symbol-icon";
import { FinePrint, Panel, Pill, PrimaryButton, SecondaryButton, Section } from "@/components/ui";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useDecisionStore } from "@/context/decision-store";
import { archetypeById } from "@/data/archetypes";
import { archetypeCopy, useCopy } from "@/lib/i18n";
import { CouncilResult, DecisionSession, LanguageCode } from "@/types/decision";

type DetailTab = "summary" | "lenses" | "plan" | "record";

export default function DecisionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    decisions,
    updateConfidence,
    toggleAction,
    refineDecision,
    reportDecision,
    deleteDecision,
    settings,
  } = useDecisionStore();
  const text = useCopy(settings.language);
  const [tab, setTab] = useState<DetailTab>("summary");
  const [refining, setRefining] = useState(false);
  const decision = useMemo(() => decisions.find((item) => item.id === id), [decisions, id]);

  if (!decision) {
    return (
      <ScrollView
        style={{ backgroundColor: colors.paper }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          minHeight: "100%",
          backgroundColor: colors.paper,
          padding: spacing.lg,
          gap: spacing.lg,
        }}
      >
        <Panel>
          <Text selectable style={{ color: colors.ink, fontWeight: "700" }}>
            {text.notFound}
          </Text>
          <SecondaryButton label={text.goBack} icon="chevron.left" onPress={() => router.back()} />
        </Panel>
      </ScrollView>
    );
  }

  const safetyTone = decision.result.safety.category === "general" ? "teal" : "amber";

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
      <Panel>
        <View style={{ gap: spacing.sm }}>
          <Text selectable style={{ color: colors.ink, fontSize: 24, fontWeight: "800", lineHeight: 30 }}>
            {decision.title}
          </Text>
          <Text selectable style={{ color: colors.mutedInk, lineHeight: 22 }}>
            {text.confidence} {decision.confidence}/100 - {decision.selectedLenses.length}{" "}
            {text.lensesLower} - {formatDate(decision.createdAt, settings.language)}
          </Text>
        </View>
        <PrimaryButton label={text.home} icon="house" onPress={() => router.replace("/(tabs)")} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {[35, 55, 75, 90].map((value) => (
            <Pill
              key={value}
              label={`${value}`}
              selected={decision.confidence === value}
              onPress={() => updateConfidence(decision.id, value)}
            />
          ))}
        </View>
      </Panel>

      <Panel tone={safetyTone}>
        <Text selectable style={{ color: colors.ink, fontWeight: "800", fontSize: 16 }}>
          {decision.result.safety.label}
        </Text>
        <FinePrint>{decision.result.safety.message}</FinePrint>
      </Panel>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        <Pill label={text.summary} selected={tab === "summary"} onPress={() => setTab("summary")} />
        <Pill label={text.lenses} selected={tab === "lenses"} onPress={() => setTab("lenses")} />
        <Pill label={text.sevenDays} selected={tab === "plan"} onPress={() => setTab("plan")} />
        <Pill label={text.record} selected={tab === "record"} onPress={() => setTab("record")} />
      </View>

      {refining ? (
        <Panel tone="teal">
          <ActivityIndicator color={colors.teal} />
          <Text selectable style={{ color: colors.mutedInk, textAlign: "center" }}>
            {text.refiningOutput}
          </Text>
        </Panel>
      ) : null}

      {tab === "summary" ? <SummaryTab decision={decision} text={text} /> : null}
      {tab === "lenses" ? <LensesTab decision={decision} text={text} language={settings.language} /> : null}
      {tab === "plan" ? <PlanTab decision={decision} text={text} onToggle={toggleAction} /> : null}
      {tab === "record" ? (
        <RecordTab
          decision={decision}
          text={text}
          language={settings.language}
          onReport={() => {
            reportDecision(decision.id);
            Alert.alert(text.reportReceivedTitle, text.reportReceivedBody);
          }}
          onRefine={async (variant) => {
            setRefining(true);
            try {
              await refineDecision(decision.id, variant);
            } finally {
              setRefining(false);
            }
          }}
          onDelete={() => {
            Alert.alert(text.deleteDecisionTitle, text.deleteDecisionBody, [
              { text: text.cancel, style: "cancel" },
              {
                text: text.delete,
                style: "destructive",
                onPress: () => {
                  deleteDecision(decision.id);
                  router.replace("/(tabs)/decisions");
                },
              },
            ]);
          }}
        />
      ) : null}
    </ScrollView>
  );
}

function SummaryTab({ decision, text }: { decision: DecisionSession; text: ReturnType<typeof useCopy> }) {
  const result = decision.result;
  return (
    <View style={{ gap: spacing.xl }}>
      <Section title={text.problemGate}>
        <Panel>
          <Text selectable style={{ color: colors.ink, lineHeight: 23 }}>
            {result.problemRestatement}
          </Text>
          <Text selectable style={{ color: colors.mutedInk, lineHeight: 22 }}>
            {result.alternativeFraming}
          </Text>
        </Panel>
      </Section>

      <Section title={text.mostImportant}>
        <Panel>
          <Text selectable style={{ color: colors.ink, fontSize: typography.body, lineHeight: 24 }}>
            {result.mostImportant}
          </Text>
        </Panel>
      </Section>

      <ListSection title={text.keyAgreements} items={result.keyAgreements} />
      <ListSection title={text.disagreements} items={result.disagreements} />
      <ListSection title={text.unresolvedQuestions} items={result.unresolvedQuestions} />
      <OptionsSection title={text.decisionOptions} options={result.decisionOptions} />
      <ListSection title={text.biggestRisks} items={result.biggestRisks} tone="clay" />

      <Section title={text.avoidance}>
        <Panel tone="amber">
          <Text selectable style={{ color: colors.ink, lineHeight: 23 }}>
            {result.avoidance}
          </Text>
        </Panel>
      </Section>

      <ListSection title={text.missingInfo} items={result.missingInformation} />

      <Section title={text.minorityReport}>
        <Panel>
          <Text selectable style={{ color: colors.ink, lineHeight: 23 }}>
            {result.minorityReport}
          </Text>
          <FinePrint>{result.confidenceNote}</FinePrint>
        </Panel>
      </Section>
    </View>
  );
}

function LensesTab({
  decision,
  text,
  language,
}: {
  decision: DecisionSession;
  text: ReturnType<typeof useCopy>;
  language: LanguageCode;
}) {
  if (decision.result.lensResults.length === 0) {
    return (
      <Panel tone="amber">
        <FinePrint>{decision.result.safety.message}</FinePrint>
      </Panel>
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      {decision.result.lensResults.map((lens) => {
        const archetype = archetypeById[lens.archetypeId];
        const localized = archetypeCopy[language][lens.archetypeId];
        return (
          <Panel key={lens.archetypeId}>
            <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: radius.card,
                  backgroundColor: colors.tealSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SymbolIcon name={archetype.icon} color={archetype.accent} fallback="*" />
              </View>
              <View style={{ flex: 1 }}>
                <Text selectable style={{ color: colors.ink, fontSize: 17, fontWeight: "800" }}>
                  {localized.name}
                </Text>
                <Text selectable style={{ color: colors.mutedInk, fontSize: 13 }}>
                  {lens.headline}
                </Text>
              </View>
            </View>
            <Text selectable style={{ color: colors.ink, lineHeight: 23 }}>
              {lens.restatement}
            </Text>
            <Text selectable style={{ color: colors.mutedInk, lineHeight: 22 }}>
              {lens.stance}
            </Text>
            <Text selectable style={{ color: colors.mutedInk, lineHeight: 22 }}>
              {lens.argument}
            </Text>
            <View style={{ gap: spacing.xs }}>
              <Text selectable style={{ color: colors.clay, fontWeight: "800" }}>
                {text.blindSpot}
              </Text>
              <Text selectable style={{ color: colors.mutedInk, lineHeight: 22 }}>
                {lens.watchOut}
              </Text>
            </View>
            <View style={{ gap: spacing.xs }}>
              <Text selectable style={{ color: colors.teal, fontWeight: "800" }}>
                {text.nextMove}
              </Text>
              <Text selectable style={{ color: colors.ink, lineHeight: 22 }}>
                {lens.nextMove}
              </Text>
            </View>
          </Panel>
        );
      })}
    </View>
  );
}

function PlanTab({
  decision,
  text,
  onToggle,
}: {
  decision: DecisionSession;
  text: ReturnType<typeof useCopy>;
  onToggle: (id: string, actionIndex: number) => void;
}) {
  return (
    <Section title={text.sevenDays}>
      <View style={{ gap: spacing.sm }}>
        {decision.result.sevenDayPlan.map((item, index) => {
          const done = decision.completedActions.includes(index);
          return (
            <Pressable
              key={item}
              onPress={() => onToggle(decision.id, index)}
              style={{
                backgroundColor: done ? colors.greenSoft : colors.surface,
                borderColor: done ? colors.green : colors.softLine,
                borderWidth: 1,
                borderRadius: radius.card,
                padding: spacing.md,
                flexDirection: "row",
                gap: spacing.md,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: radius.pill,
                  backgroundColor: done ? colors.green : colors.softLine,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SymbolIcon
                  name={done ? "checkmark" : "circle"}
                  color={done ? colors.white : colors.faintInk}
                  size={15}
                  fallback={done ? "v" : ""}
                />
              </View>
              <Text
                selectable
                style={{
                  flex: 1,
                  color: done ? colors.green : colors.ink,
                  lineHeight: 22,
                  fontWeight: done ? "700" : "500",
                }}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Section>
  );
}

function RecordTab({
  decision,
  text,
  language,
  onReport,
  onRefine,
  onDelete,
}: {
  decision: DecisionSession;
  text: ReturnType<typeof useCopy>;
  language: LanguageCode;
  onReport: () => void;
  onRefine: (variant: CouncilResult["variant"]) => void;
  onDelete: () => void;
}) {
  return (
    <View style={{ gap: spacing.xl }}>
      <Section title={text.refine}>
        <View style={{ gap: spacing.sm }}>
          <SecondaryButton label={text.cautiousRefine} icon="shield" onPress={() => onRefine("cautious")} />
          <SecondaryButton label={text.decisiveRefine} icon="figure.walk" onPress={() => onRefine("decisive")} />
          <SecondaryButton label={text.balancedRefine} icon="arrow.triangle.2.circlepath" onPress={() => onRefine("balanced")} />
        </View>
      </Section>

      <Section title={text.savedInfo}>
        <Panel>
          <Text selectable style={{ color: colors.mutedInk, lineHeight: 22 }}>
            {text.created}: {formatDate(decision.createdAt, language)}
          </Text>
          <Text selectable style={{ color: colors.mutedInk, lineHeight: 22 }}>
            {text.updated}: {formatDate(decision.updatedAt, language)}
          </Text>
          <Text selectable style={{ color: colors.mutedInk, lineHeight: 22 }}>
            {text.outputMode}: {decision.result.variant}
          </Text>
          <FinePrint>
            {text.recordNote}
          </FinePrint>
        </Panel>
      </Section>

      <Section title={text.safety}>
        <View style={{ gap: spacing.sm }}>
          <SecondaryButton
            label={decision.reportedAt ? text.reported : text.report}
            icon="exclamationmark.bubble"
            onPress={onReport}
          />
          <SecondaryButton label={text.deleteDecision} icon="trash" destructive onPress={onDelete} />
        </View>
      </Section>
    </View>
  );
}

function OptionsSection({
  title,
  options,
}: {
  title: string;
  options: DecisionSession["result"]["decisionOptions"];
}) {
  if (options.length === 0) return null;

  return (
    <Section title={title}>
      <View style={{ gap: spacing.sm }}>
        {options.map((option) => (
          <Panel key={option.label}>
            <Text selectable style={{ color: colors.ink, fontWeight: "800", fontSize: 16 }}>
              {option.label}
            </Text>
            <Text selectable style={{ color: colors.mutedInk, lineHeight: 22 }}>
              {option.tradeoff}
            </Text>
            <Text selectable style={{ color: colors.teal, lineHeight: 22, fontWeight: "700" }}>
              {option.whenItWins}
            </Text>
          </Panel>
        ))}
      </View>
    </Section>
  );
}

function ListSection({
  title,
  items,
  tone = "surface",
}: {
  title: string;
  items: string[];
  tone?: "surface" | "clay";
}) {
  if (items.length === 0) return null;

  return (
    <Section title={title}>
      <View style={{ gap: spacing.sm }}>
        {items.map((item, index) => (
          <Panel key={`${title}-${item}`} tone={tone}>
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <Text selectable style={{ color: tone === "clay" ? colors.clay : colors.teal, fontWeight: "800" }}>
                {index + 1}
              </Text>
              <Text selectable style={{ flex: 1, color: colors.ink, lineHeight: 23 }}>
                {item}
              </Text>
            </View>
          </Panel>
        ))}
      </View>
    </Section>
  );
}

function formatDate(value: string, language: LanguageCode) {
  return new Intl.DateTimeFormat(dateLocale(language), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function dateLocale(language: LanguageCode) {
  return language === "tr" ? "tr-TR" : language === "ru" ? "ru-RU" : language === "de" ? "de-DE" : "en-US";
}
