import { aiLanguageNames } from "@/lib/i18n";
import { CouncilResult, DecisionDraft, LanguageCode } from "@/types/decision";

type CouncilApiResponse = {
  result: CouncilResult;
};

export async function requestCouncilResult(
  draft: DecisionDraft,
  language: LanguageCode,
  variant: CouncilResult["variant"],
  signal?: AbortSignal
) {
  const response = await fetch(`${getApiUrl()}/api/council`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      draft,
      language: aiLanguageNames[language],
      variant,
    }),
    signal,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Council API failed with ${response.status}`);
  }

  const payload = (await response.json()) as CouncilApiResponse;
  return payload.result;
}

export function getApiUrl() {
  const configured = process.env.EXPO_PUBLIC_COUNCIL_API_URL;
  if (configured) return configured.replace(/\/$/, "");

  if (process.env.EXPO_OS === "android") return "http://10.0.2.2:8787";
  return "http://localhost:8787";
}
