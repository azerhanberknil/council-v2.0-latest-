import { Alert, ScrollView, Switch, Text, View } from "react-native";

import { FinePrint, Panel, Pill, PrimaryButton, SecondaryButton, Section } from "@/components/ui";
import { colors, spacing, typography } from "@/constants/theme";
import { useDecisionStore } from "@/context/decision-store";
import { languageNames, useCopy } from "@/lib/i18n";
import { LanguageCode } from "@/types/decision";

export default function SettingsScreen() {
  const { settings, updateSettings, clearAllData, decisions, signOut } = useDecisionStore();
  const text = useCopy(settings.language);

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
      <Section title={text.plan}>
        <Panel>
          <View style={{ gap: spacing.xs }}>
            <Text selectable style={{ color: colors.ink, fontSize: typography.section, fontWeight: "800" }}>
              {text.freePlan}
            </Text>
            <Text selectable style={{ color: colors.mutedInk, lineHeight: 22 }}>
              {settings.authMode === "guest"
                ? text.guestNote
                : `${decisions.length} ${text.decisions}`}
            </Text>
            <FinePrint>{text.proDisabled}</FinePrint>
          </View>
          <PrimaryButton
            label={text.purchasesDisabled}
            icon="creditcard"
            onPress={() => {}}
            disabled
          />
        </Panel>
      </Section>

      <Section title={text.language}>
        <Panel>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {(Object.keys(languageNames) as LanguageCode[]).map((language) => (
              <Pill
                key={language}
                label={languageNames[language]}
                selected={settings.language === language}
                onPress={() => updateSettings({ language })}
              />
            ))}
          </View>
        </Panel>
      </Section>

      <Section title={text.theme}>
        <Panel>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <Pill
              label={text.light}
              selected={settings.theme === "light"}
              onPress={() => updateSettings({ theme: "light" })}
            />
            <Pill
              label={text.dark}
              selected={settings.theme === "dark"}
              onPress={() => updateSettings({ theme: "dark" })}
            />
          </View>
        </Panel>
      </Section>

      <Section title={text.privacy}>
        <Panel>
          <SettingSwitch
            label={text.privateMode}
            detail={text.privateModeDetail}
            value={settings.privateMode}
            onChange={(privateMode) => updateSettings({ privateMode })}
          />
          <SettingSwitch
            label={text.personalization}
            detail={text.personalizationDetail}
            value={settings.allowPersonalization}
            onChange={(allowPersonalization) => updateSettings({ allowPersonalization })}
          />
        </Panel>
      </Section>

      <Section title={text.safety}>
        <Panel tone="amber">
          <FinePrint>
            {text.disclaimer}
          </FinePrint>
          <FinePrint>
            {text.safetyEmergency}
          </FinePrint>
        </Panel>
      </Section>

      <Section title={text.data}>
        <Panel>
          <SecondaryButton label={text.deleteAll} icon="trash" destructive onPress={confirmDelete} />
          <FinePrint>
            {text.dataDeleteFine}
          </FinePrint>
          <SecondaryButton label={text.signOut} icon="rectangle.portrait.and.arrow.right" onPress={signOut} />
        </Panel>
      </Section>
    </ScrollView>
  );

  function confirmDelete() {
    Alert.alert(text.deleteAll, text.deleteAllBody, [
      { text: text.cancel, style: "cancel" },
      { text: text.delete, style: "destructive", onPress: clearAllData },
    ]);
  }
}

function SettingSwitch({
  label,
  detail,
  value,
  onChange,
}: {
  label: string;
  detail: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text selectable style={{ color: colors.ink, fontWeight: "700", fontSize: 15 }}>
          {label}
        </Text>
        <Text selectable style={{ color: colors.mutedInk, lineHeight: 19, fontSize: 13 }}>
          {detail}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.softLine, true: colors.tealSoft }}
        thumbColor={value ? colors.teal : colors.faintInk}
      />
    </View>
  );
}
