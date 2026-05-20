import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { SymbolIcon } from "@/components/symbol-icon";
import { FinePrint, Panel, Pill, PrimaryButton, SecondaryButton, Section } from "@/components/ui";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useDecisionStore } from "@/context/decision-store";
import { archetypes } from "@/data/archetypes";
import { archetypeCopy, domainLabels, horizonLabels, stakesLabels, useCopy } from "@/lib/i18n";
import { recommendedLenses } from "@/lib/council-engine";
import { ArchetypeId, DecisionDomain, StakesLevel, TimeHorizon } from "@/types/decision";

const domains: DecisionDomain[] = ["career", "relocation", "relationship", "money-pressure", "restart", "other"];

const horizons: TimeHorizon[] = ["7-days", "30-days", "90-days", "1-year"];

const stakes: StakesLevel[] = ["low", "medium", "high"];

export default function NewDecisionScreen() {
  const router = useRouter();
  const { createDecision, settings } = useDecisionStore();
  const text = useCopy(settings.language);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [question, setQuestion] = useState("");
  const [domain, setDomain] = useState<DecisionDomain>("career");
  const [context, setContext] = useState("");
  const [optionsText, setOptionsText] = useState("");
  const [constraints, setConstraints] = useState("");
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>("30-days");
  const [stakesLevel, setStakesLevel] = useState<StakesLevel>("medium");
  const [selectedLenses, setSelectedLenses] = useState<ArchetypeId[]>(() =>
    recommendedLenses("career", "medium")
  );

  const options = useMemo(
    () =>
      optionsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [optionsText]
  );

  const canContinue = step === 0 ? question.trim().length > 12 : step === 1 ? context.trim().length > 20 : true;

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
      <View style={{ gap: spacing.sm }}>
        <Text selectable style={{ color: colors.faintInk, fontWeight: "700" }}>
          {text.step} {step + 1}/4
        </Text>
        <View style={{ height: 6, borderRadius: radius.pill, backgroundColor: colors.softLine }}>
          <View
            style={{
              height: 6,
              borderRadius: radius.pill,
              width: `${((step + 1) / 4) * 100}%`,
              backgroundColor: colors.teal,
            }}
          />
        </View>
      </View>

      {step === 0 ? (
        <Section title={text.question}>
          <View style={{ gap: spacing.md }}>
            <Input
              value={question}
              onChangeText={setQuestion}
              placeholder={text.exampleQuestion}
              multiline
            />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {domains.map((item) => (
                <Pill
                  key={item}
                  label={domainLabels[settings.language][item]}
                  selected={domain === item}
                  onPress={() => {
                    setDomain(item);
                    setSelectedLenses(recommendedLenses(item, stakesLevel));
                  }}
                />
              ))}
            </View>
          </View>
        </Section>
      ) : null}

      {step === 1 ? (
        <Section title={text.context}>
          <View style={{ gap: spacing.md }}>
            <Input
              value={context}
              onChangeText={setContext}
              placeholder={text.contextPlaceholder}
              multiline
            />
            <Input
              value={optionsText}
              onChangeText={setOptionsText}
              placeholder={text.optionsPlaceholder}
            />
            <Input
              value={constraints}
              onChangeText={setConstraints}
              placeholder={text.constraintsPlaceholder}
              multiline
            />
          </View>
        </Section>
      ) : null}

      {step === 2 ? (
        <View style={{ gap: spacing.xl }}>
          <Section title={text.timeRisk}>
            <View style={{ gap: spacing.md }}>
              <Text selectable style={{ color: colors.mutedInk, fontWeight: "700" }}>
                {text.timeHorizon}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                {horizons.map((item) => (
                  <Pill
                    key={item}
                    label={horizonLabels[settings.language][item]}
                    selected={timeHorizon === item}
                    onPress={() => setTimeHorizon(item)}
                  />
                ))}
              </View>
              <Text selectable style={{ color: colors.mutedInk, fontWeight: "700" }}>
                {text.riskLevel}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                {stakes.map((item) => (
                  <Pill
                    key={item}
                    label={stakesLabels[settings.language][item]}
                    selected={stakesLevel === item}
                    onPress={() => {
                      setStakesLevel(item);
                      setSelectedLenses(recommendedLenses(domain, item));
                    }}
                  />
                ))}
              </View>
            </View>
          </Section>

          <Section title={text.lenses}>
            <View style={{ gap: spacing.sm }}>
              {archetypes.map((archetype) => {
                const selected = selectedLenses.includes(archetype.id);
                const localized = archetypeCopy[settings.language][archetype.id];
                return (
                  <Pressable
                    key={archetype.id}
                    onPress={() => toggleLens(archetype.id)}
                    style={{
                      borderRadius: radius.card,
                      borderColor: selected ? archetype.accent : colors.softLine,
                      borderWidth: 1,
                      backgroundColor: selected ? colors.surface : colors.paper,
                      padding: spacing.md,
                      flexDirection: "row",
                      gap: spacing.md,
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: radius.card,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: selected ? colors.tealSoft : colors.softLine,
                      }}
                    >
                      <SymbolIcon name={archetype.icon} color={archetype.accent} fallback="*" />
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text selectable style={{ color: colors.ink, fontWeight: "800", fontSize: 15 }}>
                        {localized.name}
                      </Text>
                      <Text selectable style={{ color: colors.mutedInk, lineHeight: 19, fontSize: 13 }}>
                        {localized.purpose}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Section>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={{ gap: spacing.xl }}>
          <Section title={text.finalCheck}>
            <Panel>
              <Text selectable style={{ color: colors.ink, fontSize: typography.section, fontWeight: "800" }}>
                {question}
              </Text>
              <Text selectable style={{ color: colors.mutedInk, lineHeight: 22 }}>
                {text.selectedSummary
                  .replace("{lenses}", String(selectedLenses.length))
                  .replace("{options}", String(options.length || 1))
                  .replace("{stakes}", stakesLabels[settings.language][stakesLevel])}
              </Text>
              <FinePrint>
                {text.disclaimer}
              </FinePrint>
            </Panel>
          </Section>
        </View>
      ) : null}

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        {step > 0 ? (
          <View style={{ flex: 1 }}>
            <SecondaryButton label={text.back} icon="chevron.left" onPress={() => setStep((value) => value - 1)} />
          </View>
        ) : null}
        <View style={{ flex: 2 }}>
          <PrimaryButton
            label={submitting ? text.working : step === 3 ? text.runCouncil : text.continue}
            icon={step === 3 ? "sparkles" : "chevron.right"}
            disabled={submitting || !canContinue || selectedLenses.length < 3}
            onPress={step === 3 ? submit : next}
          />
        </View>
      </View>
      {submitting ? (
        <View style={{ alignItems: "center", gap: spacing.sm }}>
          <ActivityIndicator color={colors.teal} />
            <Text selectable style={{ color: colors.mutedInk, fontSize: 13 }}>
            {text.protocolRunning}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );

  function next() {
    if (!canContinue) return;
    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
    setStep((value) => Math.min(3, value + 1));
  }

  function toggleLens(id: ArchetypeId) {
    setSelectedLenses((current) => {
      if (current.includes(id)) {
        if (current.length <= 3) return current;
        return current.filter((item) => item !== id);
      }
      return [...current, id];
    });
  }

  async function submit() {
    if (selectedLenses.length < 3) {
      Alert.alert(text.selectThreeTitle, text.selectThreeBody);
      return;
    }

    setSubmitting(true);
    try {
      const decision = await createDecision({
        question,
        domain,
        context,
        options,
        constraints,
        timeHorizon,
        stakes: stakesLevel,
        selectedLenses,
      });

      router.replace({ pathname: "/decision/[id]", params: { id: decision.id } });
    } finally {
      setSubmitting(false);
    }
  }
}

function Input({
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.faintInk}
      multiline={multiline}
      textAlignVertical={multiline ? "top" : "center"}
      style={{
        minHeight: multiline ? 132 : 50,
        borderRadius: radius.card,
        borderColor: colors.line,
        borderWidth: 1,
        backgroundColor: colors.surface,
        color: colors.ink,
        padding: spacing.md,
        fontSize: 16,
        lineHeight: 22,
      }}
    />
  );
}
