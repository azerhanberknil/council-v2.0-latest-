export type DecisionDomain =
  | "career"
  | "relocation"
  | "relationship"
  | "money-pressure"
  | "restart"
  | "other";

export type TimeHorizon = "7-days" | "30-days" | "90-days" | "1-year";

export type StakesLevel = "low" | "medium" | "high";

export type ArchetypeId =
  | "skeptic"
  | "stoic"
  | "strategist"
  | "builder"
  | "systems"
  | "risk";

export type SafetyCategory =
  | "general"
  | "crisis"
  | "medical"
  | "legal"
  | "financial"
  | "violence"
  | "unsafe";

export type LanguageCode = "en" | "tr" | "ru" | "de";

export type AuthMode = "signed-out" | "member" | "guest";

export type MembershipPlan = "free" | "pro";

export type SafetyReview = {
  category: SafetyCategory;
  label: string;
  message: string;
  blocksDeepAnalysis: boolean;
};

export type DecisionDraft = {
  question: string;
  domain: DecisionDomain;
  context: string;
  options: string[];
  constraints: string;
  timeHorizon: TimeHorizon;
  stakes: StakesLevel;
  selectedLenses: ArchetypeId[];
};

export type LensResult = {
  archetypeId: ArchetypeId;
  headline: string;
  restatement: string;
  stance: string;
  argument: string;
  watchOut: string;
  nextMove: string;
};

export type DecisionOption = {
  label: string;
  tradeoff: string;
  whenItWins: string;
};

export type CouncilResult = {
  problemRestatement: string;
  alternativeFraming: string;
  mostImportant: string;
  keyAgreements: string[];
  disagreements: string[];
  unresolvedQuestions: string[];
  decisionOptions: DecisionOption[];
  biggestRisks: string[];
  avoidance: string;
  missingInformation: string[];
  sevenDayPlan: string[];
  lensResults: LensResult[];
  minorityReport: string;
  confidenceNote: string;
  protocolNotes: string[];
  safety: SafetyReview;
  generatedAt: string;
  variant: "balanced" | "cautious" | "decisive";
};

export type DecisionSession = DecisionDraft & {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  reviewDate: string;
  confidence: number;
  status: "open" | "review" | "closed";
  result: CouncilResult;
  completedActions: number[];
  reportedAt?: string;
};

export type UserSettings = {
  acceptedBasics: boolean;
  privateMode: boolean;
  allowPersonalization: boolean;
  reminderDay: "sunday" | "monday" | "none";
  authMode: AuthMode;
  language: LanguageCode;
  theme: "light" | "dark";
  plan: MembershipPlan;
  accountEmail?: string;
  accountName?: string;
};
