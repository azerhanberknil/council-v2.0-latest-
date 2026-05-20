import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

import { Panel, Pill, PrimaryButton, SecondaryButton } from "@/components/ui";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useDecisionStore } from "@/context/decision-store";
import { languageNames, useCopy } from "@/lib/i18n";
import { LanguageCode } from "@/types/decision";

type AuthForm = "none" | "sign-in" | "register";

export default function AuthScreen() {
  const router = useRouter();
  const { settings, updateSettings, signIn, register, continueAsGuest } = useDecisionStore();
  const text = useCopy(settings.language);
  const [form, setForm] = useState<AuthForm>("none");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  return (
    <ScrollView
      style={{ backgroundColor: colors.paper }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        minHeight: "100%",
        padding: spacing.xl,
        justifyContent: "center",
        gap: spacing.xl,
        backgroundColor: colors.paper,
      }}
    >
      <View style={{ gap: spacing.md, alignItems: "center" }}>
        <Text selectable style={{ color: colors.ink, fontSize: 38, fontWeight: "900" }}>
          Council
        </Text>
        <Text
          selectable
          style={{
            color: colors.mutedInk,
            fontSize: typography.body,
            lineHeight: 24,
            textAlign: "center",
            maxWidth: 320,
          }}
        >
          {text.welcomeBody}
        </Text>
      </View>

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

        {form !== "none" ? (
          <View style={{ gap: spacing.sm }}>
            {form === "register" ? (
              <Input value={name} onChangeText={setName} placeholder={text.name} />
            ) : null}
            <Input value={email} onChangeText={setEmail} placeholder={text.email} />
            <PrimaryButton label={text.start} icon="arrow.right" onPress={submit} disabled={!email.trim()} />
            <SecondaryButton label={text.back} icon="chevron.left" onPress={() => setForm("none")} />
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            <PrimaryButton label={text.signIn} icon="person" onPress={() => setForm("sign-in")} />
            <SecondaryButton label={text.createAccount} icon="person.badge.plus" onPress={() => setForm("register")} />
            <SecondaryButton label={text.continueGuest} icon="eye" onPress={guest} />
            <Text selectable style={{ color: colors.faintInk, fontSize: typography.caption, lineHeight: 18 }}>
              {text.guestNote}
            </Text>
          </View>
        )}
      </Panel>
    </ScrollView>
  );

  function submit() {
    if (form === "register") register(email, name);
    else signIn(email);
    router.replace("/(tabs)");
  }

  function guest() {
    continueAsGuest();
    router.replace("/(tabs)");
  }
}

function Input({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.faintInk}
      autoCapitalize="none"
      style={{
        minHeight: 50,
        borderRadius: radius.card,
        borderColor: colors.line,
        borderWidth: 1,
        backgroundColor: colors.surface,
        color: colors.ink,
        paddingHorizontal: spacing.md,
        fontSize: 16,
      }}
    />
  );
}
