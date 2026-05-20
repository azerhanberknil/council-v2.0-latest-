import { Link, type Href } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { SymbolIcon } from "@/components/symbol-icon";
import { colors, radius, spacing, typography } from "@/constants/theme";

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text selectable style={{ color: colors.ink, fontSize: typography.section, fontWeight: "700" }}>
          {title}
        </Text>
        {action}
      </View>
      {children}
    </View>
  );
}

export function Panel({
  children,
  tone = "surface",
}: {
  children: React.ReactNode;
  tone?: "surface" | "teal" | "clay" | "amber" | "green";
}) {
  const background =
    tone === "teal"
      ? colors.tealSoft
      : tone === "clay"
        ? colors.claySoft
        : tone === "amber"
          ? colors.amberSoft
          : tone === "green"
            ? colors.greenSoft
            : colors.surface;

  return (
    <View
      style={{
        backgroundColor: background,
        borderColor: tone === "surface" ? colors.softLine : "transparent",
        borderWidth: 1,
        borderRadius: radius.card,
        padding: spacing.lg,
        gap: spacing.md,
      }}
    >
      {children}
    </View>
  );
}

export function PrimaryButton({
  label,
  icon,
  onPress,
  disabled,
}: {
  label: string;
  icon?: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        minHeight: 52,
        borderRadius: radius.card,
        paddingHorizontal: spacing.lg,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: spacing.sm,
        backgroundColor: disabled ? colors.line : pressed ? colors.buttonPressed : colors.buttonBg,
        opacity: disabled ? 0.7 : 1,
      })}
    >
      {icon ? <SymbolIcon name={icon} color={disabled ? colors.faintInk : colors.buttonText} fallback="+" /> : null}
      <Text style={{ color: disabled ? colors.faintInk : colors.buttonText, fontWeight: "700", fontSize: typography.body }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  icon,
  onPress,
  destructive,
}: {
  label: string;
  icon?: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 46,
        borderRadius: radius.card,
        paddingHorizontal: spacing.md,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: destructive ? colors.clay : colors.line,
        backgroundColor: pressed ? colors.softLine : colors.surface,
      })}
    >
      {icon ? (
        <SymbolIcon
          name={icon}
          color={destructive ? colors.clay : colors.ink}
          size={18}
          fallback="*"
        />
      ) : null}
      <Text
        style={{
          color: destructive ? colors.clay : colors.ink,
          fontWeight: "700",
          fontSize: typography.small,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Pill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: selected ? colors.teal : colors.line,
        backgroundColor: selected ? colors.tealSoft : colors.surface,
      }}
    >
      <Text
        selectable={!onPress}
        style={{
          color: selected ? colors.teal : colors.mutedInk,
          fontWeight: "700",
          fontSize: typography.small,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function FinePrint({ children }: { children: React.ReactNode }) {
  return (
    <Text selectable style={{ color: colors.faintInk, fontSize: typography.caption, lineHeight: 18 }}>
      {children}
    </Text>
  );
}

export function LinkedRow({
  href,
  title,
  subtitle,
  icon,
}: {
  href: Href;
  title: string;
  subtitle: string;
  icon: string;
}) {
  return (
    <Link href={href} asChild>
      <Pressable
        style={({ pressed }) => ({
          backgroundColor: pressed ? colors.softLine : colors.surface,
          borderColor: colors.softLine,
          borderWidth: 1,
          borderRadius: radius.card,
          padding: spacing.md,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
        })}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: radius.card,
            backgroundColor: colors.tealSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SymbolIcon name={icon} color={colors.teal} fallback=">" />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text selectable style={{ color: colors.ink, fontWeight: "700", fontSize: 15 }}>
            {title}
          </Text>
          <Text selectable style={{ color: colors.mutedInk, lineHeight: 19, fontSize: 13 }}>
            {subtitle}
          </Text>
        </View>
        <SymbolIcon name="chevron.right" color={colors.faintInk} size={16} fallback=">" />
      </Pressable>
    </Link>
  );
}
