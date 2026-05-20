import React, { createContext, useCallback, useMemo, useState } from "react";

import { buildDecision, generateCouncilResult } from "@/lib/council-engine";
import { requestCouncilResult } from "@/lib/ai-client";
import { readJson, removeValue, writeJson } from "@/lib/storage";
import { setActiveTheme } from "@/constants/theme";
import { DecisionDraft, DecisionSession, UserSettings } from "@/types/decision";

type DecisionStore = {
  decisions: DecisionSession[];
  settings: UserSettings;
  createDecision: (draft: DecisionDraft) => Promise<DecisionSession>;
  updateConfidence: (id: string, confidence: number) => void;
  toggleAction: (id: string, actionIndex: number) => void;
  refineDecision: (id: string, variant: DecisionSession["result"]["variant"]) => Promise<void>;
  reportDecision: (id: string) => void;
  deleteDecision: (id: string) => void;
  clearAllData: () => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  signIn: (email: string, name?: string) => void;
  register: (email: string, name?: string) => void;
  continueAsGuest: () => void;
  signOut: () => void;
};

const decisionsKey = "council.decisions";
const settingsKey = "council.settings";

const defaultSettings: UserSettings = {
  acceptedBasics: false,
  privateMode: false,
  allowPersonalization: false,
  reminderDay: "sunday",
  authMode: "signed-out",
  language: "en",
  theme: "light",
  plan: "free",
};

const DecisionContext = createContext<DecisionStore | null>(null);

export function DecisionProvider({ children }: { children: React.ReactNode }) {
  const [decisions, setDecisionsState] = useState<DecisionSession[]>(() =>
    readJson(decisionsKey, [])
  );
  const [settings, setSettingsState] = useState<UserSettings>(() =>
    ({ ...defaultSettings, ...readJson(settingsKey, defaultSettings) })
  );

  setActiveTheme(settings.theme);

  const persistDecisions = useCallback(
    (updater: (current: DecisionSession[]) => DecisionSession[]) => {
      setDecisionsState((current) => {
        const next = updater(current);
        if (settings.authMode === "member") writeJson(decisionsKey, next);
        return next;
      });
    },
    [settings.authMode]
  );

  const createDecision = useCallback(
    async (draft: DecisionDraft) => {
      let decision = buildDecision(draft, settings.language);

      try {
        const result = await requestCouncilResult(draft, settings.language, "balanced");
        decision = { ...decision, result };
      } catch {
        decision = {
          ...decision,
          result: generateCouncilResult(draft, "balanced", settings.language),
        };
      }

      persistDecisions((current) =>
        settings.authMode === "guest" ? [decision] : [decision, ...current]
      );
      return decision;
    },
    [persistDecisions, settings.authMode, settings.language]
  );

  const updateConfidence = useCallback(
    (id: string, confidence: number) => {
      persistDecisions((current) =>
        current.map((decision) =>
          decision.id === id
            ? {
                ...decision,
                confidence,
                updatedAt: new Date().toISOString(),
                status: confidence >= 75 ? "closed" : "review",
              }
            : decision
        )
      );
    },
    [persistDecisions]
  );

  const toggleAction = useCallback(
    (id: string, actionIndex: number) => {
      persistDecisions((current) =>
        current.map((decision) => {
          if (decision.id !== id) return decision;

          const completedActions = decision.completedActions.includes(actionIndex)
            ? decision.completedActions.filter((index) => index !== actionIndex)
            : [...decision.completedActions, actionIndex];

          return {
            ...decision,
            completedActions,
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    [persistDecisions]
  );

  const refineDecision = useCallback(
    async (id: string, variant: DecisionSession["result"]["variant"]) => {
      const target = decisions.find((decision) => decision.id === id);
      if (!target) return;

      let result = generateCouncilResult(target, variant, settings.language);
      try {
        result = await requestCouncilResult(target, settings.language, variant);
      } catch {
        result = generateCouncilResult(target, variant, settings.language);
      }

      persistDecisions((current) =>
        current.map((decision) =>
          decision.id === id
            ? {
                ...decision,
                result,
                updatedAt: new Date().toISOString(),
              }
            : decision
        )
      );
    },
    [decisions, persistDecisions, settings.language]
  );

  const reportDecision = useCallback(
    (id: string) => {
      persistDecisions((current) =>
        current.map((decision) =>
          decision.id === id ? { ...decision, reportedAt: new Date().toISOString() } : decision
        )
      );
    },
    [persistDecisions]
  );

  const deleteDecision = useCallback(
    (id: string) => {
      persistDecisions((current) => current.filter((decision) => decision.id !== id));
    },
    [persistDecisions]
  );

  const clearAllData = useCallback(() => {
    removeValue(decisionsKey);
    removeValue(settingsKey);
    setDecisionsState([]);
    setSettingsState(defaultSettings);
  }, []);

  const updateSettings = useCallback((patch: Partial<UserSettings>) => {
    setSettingsState((current) => {
      const next = { ...current, ...patch };
      writeJson(settingsKey, next);
      setActiveTheme(next.theme);
      return next;
    });
  }, []);

  const signIn = useCallback(
    (email: string, name?: string) => {
      updateSettings({
        authMode: "member",
        accountEmail: email.trim(),
        accountName: name?.trim() || email.trim().split("@")[0],
      });
      setDecisionsState(readJson(decisionsKey, []));
    },
    [updateSettings]
  );

  const register = useCallback(
    (email: string, name?: string) => {
      signIn(email, name);
    },
    [signIn]
  );

  const continueAsGuest = useCallback(() => {
    updateSettings({ authMode: "guest", accountEmail: undefined, accountName: undefined });
    setDecisionsState([]);
  }, [updateSettings]);

  const signOut = useCallback(() => {
    setDecisionsState([]);
    updateSettings({ authMode: "signed-out", accountEmail: undefined, accountName: undefined });
  }, [updateSettings]);

  const value = useMemo(
    () => ({
      decisions,
      settings,
      createDecision,
      updateConfidence,
      toggleAction,
      refineDecision,
      reportDecision,
      deleteDecision,
      clearAllData,
      updateSettings,
      signIn,
      register,
      continueAsGuest,
      signOut,
    }),
    [
      decisions,
      settings,
      createDecision,
      updateConfidence,
      toggleAction,
      refineDecision,
      reportDecision,
      deleteDecision,
      clearAllData,
      updateSettings,
      signIn,
      register,
      continueAsGuest,
      signOut,
    ]
  );

  return <DecisionContext value={value}>{children}</DecisionContext>;
}

export function useDecisionStore() {
  const store = React.use(DecisionContext);
  if (!store) throw new Error("useDecisionStore must be used inside DecisionProvider");
  return store;
}
