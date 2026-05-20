import { archetypeById } from "@/data/archetypes";
import { archetypeCopy, domainLabels, horizonLabels, stakesLabels } from "@/lib/i18n";
import {
  ArchetypeId,
  CouncilResult,
  DecisionDomain,
  DecisionDraft,
  DecisionSession,
  LanguageCode,
  LensResult,
  SafetyReview,
  StakesLevel,
} from "@/types/decision";

const defaultLanguage: LanguageCode = "en";

export function recommendedLenses(domain: DecisionDomain, stakes: StakesLevel): ArchetypeId[] {
  if (stakes === "high") return ["skeptic", "stoic", "strategist", "builder", "systems", "risk"];

  const byDomain: Record<DecisionDomain, ArchetypeId[]> = {
    career: ["skeptic", "strategist", "builder", "risk"],
    relocation: ["stoic", "strategist", "systems", "risk"],
    relationship: ["stoic", "skeptic", "systems", "builder"],
    "money-pressure": ["skeptic", "builder", "systems", "risk"],
    restart: ["stoic", "strategist", "builder", "systems"],
    other: ["skeptic", "stoic", "builder", "risk"],
  };

  return byDomain[domain];
}

export function buildDecision(
  draft: DecisionDraft,
  language: LanguageCode = defaultLanguage
): DecisionSession {
  const now = new Date();
  const reviewDate = new Date(now);
  reviewDate.setDate(now.getDate() + 7);

  const selectedLenses =
    draft.selectedLenses.length >= 3
      ? draft.selectedLenses
      : recommendedLenses(draft.domain, draft.stakes);

  const normalizedDraft = {
    ...draft,
    selectedLenses,
    options: draft.options.filter(Boolean),
  };

  return {
    ...normalizedDraft,
    id: `${now.getTime()}`,
    title: makeTitle(draft.question, language),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    reviewDate: reviewDate.toISOString(),
    confidence: draft.stakes === "high" ? 42 : 55,
    status: "open",
    result: generateCouncilResult(normalizedDraft, "balanced", language),
    completedActions: [],
  };
}

export function generateCouncilResult(
  draft: DecisionDraft,
  variant: CouncilResult["variant"] = "balanced",
  language: LanguageCode = defaultLanguage
): CouncilResult {
  const copy = engineCopy[language] ?? engineCopy.en;
  const safety = classifySafety(`${draft.question} ${draft.context} ${draft.constraints}`, language);
  const lensResults = safety.blocksDeepAnalysis
    ? []
    : draft.selectedLenses.map((id) => makeLensResult(id, draft, variant, language));

  return {
    problemRestatement: makeRestatement(draft, language),
    alternativeFraming: makeAlternativeFraming(language),
    mostImportant: safety.blocksDeepAnalysis
      ? copy.noDeepAnalysis
      : makeMostImportant(draft, variant, language),
    keyAgreements: safety.blocksDeepAnalysis
      ? copy.safetyAgreements
      : copy.keyAgreements,
    disagreements: safety.blocksDeepAnalysis ? [] : makeDisagreements(draft, variant, language),
    unresolvedQuestions: safety.blocksDeepAnalysis
      ? copy.safetyQuestions
      : copy.unresolvedQuestions,
    decisionOptions: safety.blocksDeepAnalysis ? [] : makeDecisionOptions(draft, language),
    biggestRisks: safety.blocksDeepAnalysis ? [safety.message] : copy.biggestRisks,
    avoidance: safety.blocksDeepAnalysis ? copy.professionalDisclaimer : copy.avoidance,
    missingInformation: safety.blocksDeepAnalysis ? copy.emergencyOrProfessional : makeMissingInfo(draft, language),
    sevenDayPlan: safety.blocksDeepAnalysis ? makeSafetyPlan(safety, language) : makeSevenDayPlan(draft, variant, language),
    lensResults,
    minorityReport: safety.blocksDeepAnalysis ? copy.minoritySafety : copy.minorityDefault,
    confidenceNote: safety.blocksDeepAnalysis
      ? copy.confidenceSafety
      : draft.stakes === "high"
        ? copy.confidenceHigh
        : copy.confidenceGeneral,
    protocolNotes: copy.protocolNotes,
    safety,
    generatedAt: new Date().toISOString(),
    variant,
  };
}

export function classifySafety(text: string, language: LanguageCode = defaultLanguage): SafetyReview {
  const copy = safetyCopy[language] ?? safetyCopy.en;
  const value = text.toLocaleLowerCase(localeFor(language));

  if (containsAny(value, safetyKeywords.crisis)) {
    return {
      category: "crisis",
      label: copy.crisisLabel,
      message: copy.crisisMessage,
      blocksDeepAnalysis: true,
    };
  }

  if (containsAny(value, safetyKeywords.violence)) {
    return {
      category: "violence",
      label: copy.violenceLabel,
      message: copy.violenceMessage,
      blocksDeepAnalysis: true,
    };
  }

  if (containsAny(value, safetyKeywords.medical)) {
    return {
      category: "medical",
      label: copy.medicalLabel,
      message: copy.medicalMessage,
      blocksDeepAnalysis: false,
    };
  }

  if (containsAny(value, safetyKeywords.legal)) {
    return {
      category: "legal",
      label: copy.legalLabel,
      message: copy.legalMessage,
      blocksDeepAnalysis: false,
    };
  }

  if (containsAny(value, safetyKeywords.financial)) {
    return {
      category: "financial",
      label: copy.financialLabel,
      message: copy.financialMessage,
      blocksDeepAnalysis: false,
    };
  }

  return {
    category: "general",
    label: copy.generalLabel,
    message: copy.generalMessage,
    blocksDeepAnalysis: false,
  };
}

function makeLensResult(
  archetypeId: ArchetypeId,
  draft: DecisionDraft,
  variant: CouncilResult["variant"],
  language: LanguageCode
): LensResult {
  const archetype = archetypeById[archetypeId];
  const copy = lensCopy[language][archetypeId];
  const localized = archetypeCopy[language][archetypeId];
  const options = draft.options.length > 0 ? draft.options.join(", ") : engineCopy[language].unclearOptions;
  const domain = domainLabels[language][draft.domain].toLocaleLowerCase(localeFor(language));
  const stakes = stakesLabels[language][draft.stakes].toLocaleLowerCase(localeFor(language));
  const horizon = horizonLabels[language][draft.timeHorizon].toLocaleLowerCase(localeFor(language));
  const variantSuffix =
    variant === "decisive"
      ? ` ${engineCopy[language].decisiveLensSuffix}`
      : variant === "cautious"
        ? ` ${engineCopy[language].cautiousLensSuffix}`
        : "";

  return {
    archetypeId,
    headline: copy.headline,
    restatement: copy.restatement,
    stance: copy.stance({ domain, stakes, horizon }),
    argument: copy.argument({ options, constraints: draft.constraints || engineCopy[language].constraintsMissing }) + variantSuffix,
    watchOut: copy.watchOut || localized.blindSpot,
    nextMove: copy.nextMove,
  };
}

function makeRestatement(draft: DecisionDraft, language: LanguageCode) {
  const title = makeTitle(draft.question, language);
  return engineCopy[language].restatement(title);
}

function makeAlternativeFraming(language: LanguageCode) {
  return engineCopy[language].alternativeFraming;
}

function makeDecisionOptions(draft: DecisionDraft, language: LanguageCode) {
  const copy = engineCopy[language];
  const source = draft.options.length > 0 ? draft.options : copy.fallbackOptions;

  return source.slice(0, 4).map((option, index) => ({
    label: option,
    tradeoff: index === 0 ? copy.optionTradeoffFast : copy.optionTradeoffData,
    whenItWins: index === 0 ? copy.optionWinsFast : copy.optionWinsData,
  }));
}

function makeMostImportant(
  draft: DecisionDraft,
  variant: CouncilResult["variant"],
  language: LanguageCode
) {
  const copy = engineCopy[language];
  const base = copy.mostImportantBase(makeTitle(draft.question, language));
  if (variant === "cautious") return `${base} ${copy.mostImportantCautious}`;
  if (variant === "decisive") return `${base} ${copy.mostImportantDecisive}`;
  return `${base} ${copy.mostImportantBalanced}`;
}

function makeDisagreements(
  draft: DecisionDraft,
  variant: CouncilResult["variant"],
  language: LanguageCode
) {
  const copy = engineCopy[language];
  const domain = domainLabels[language][draft.domain];
  const actionBias = variant === "cautious" ? copy.disagreementCautious : copy.disagreementBalanced;
  return [actionBias, copy.disagreementSystem, copy.disagreementDomain(domain)];
}

function makeMissingInfo(draft: DecisionDraft, language: LanguageCode) {
  const copy = engineCopy[language];
  const missing = [...copy.missingInfo];
  if (draft.options.length < 2) missing.unshift(copy.missingNeedOptions);
  if (!draft.constraints.trim()) missing.unshift(copy.missingConstraints);
  return missing;
}

function makeSevenDayPlan(
  draft: DecisionDraft,
  variant: CouncilResult["variant"],
  language: LanguageCode
) {
  const copy = engineCopy[language];
  const first = variant === "cautious" ? copy.sevenDayCautious : copy.sevenDayBase;
  return [first, copy.sevenDayScore, copy.sevenDayInfo, copy.sevenDayConversation, copy.sevenDayReview];
}

function makeSafetyPlan(safety: SafetyReview, language: LanguageCode) {
  const copy = engineCopy[language];
  if (safety.category === "crisis" || safety.category === "violence") {
    return copy.safetyPlan;
  }

  return [copy.professionalDisclaimer];
}

function makeTitle(question: string, language: LanguageCode) {
  const trimmed = question.trim().replace(/\s+/g, " ");
  if (!trimmed) return engineCopy[language].fallbackTitle;
  return trimmed.length > 56 ? `${trimmed.slice(0, 53)}...` : trimmed;
}

function containsAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}

function localeFor(language: LanguageCode) {
  return language === "tr" ? "tr-TR" : language === "ru" ? "ru-RU" : language === "de" ? "de-DE" : "en-US";
}

type LensTemplate = {
  headline: string;
  restatement: string;
  stance: (input: { domain: string; stakes: string; horizon: string }) => string;
  argument: (input: { options: string; constraints: string }) => string;
  watchOut: string;
  nextMove: string;
};

const safetyKeywords = {
  crisis: [
    "suicide",
    "kill myself",
    "hurt myself",
    "want to die",
    "intihar",
    "kendime zarar",
    "yasamak istemiyorum",
    "olmek istiyorum",
    "самоубий",
    "умереть",
    "покончить",
    "selbstmord",
    "suizid",
    "mich umbringen",
  ],
  violence: [
    "kill them",
    "attack",
    "weapon",
    "hurt someone",
    "oldur",
    "saldir",
    "silah",
    "zarar ver",
    "убить",
    "напасть",
    "оружие",
    "angreifen",
    "waffe",
    "verletzen",
  ],
  medical: [
    "medical",
    "doctor",
    "surgery",
    "medicine",
    "tibbi",
    "hastalik",
    "ilac",
    "ameliyat",
    "doktor",
    "медицин",
    "врач",
    "лекарств",
    "операц",
    "medizin",
    "arzt",
    "operation",
    "medikament",
  ],
  legal: [
    "lawsuit",
    "lawyer",
    "contract",
    "court",
    "visa",
    "dava",
    "avukat",
    "sozlesme",
    "hukuk",
    "mahkeme",
    "vize",
    "юрист",
    "суд",
    "контракт",
    "виза",
    "anwalt",
    "gericht",
    "vertrag",
    "visum",
  ],
  financial: [
    "investment",
    "stock",
    "crypto",
    "loan",
    "debt",
    "mortgage",
    "yatirim",
    "hisse",
    "kripto",
    "kredi",
    "borc",
    "ипотек",
    "кредит",
    "долг",
    "крипт",
    "акции",
    "investition",
    "aktie",
    "krypto",
    "kredit",
    "schuld",
  ],
};

const safetyCopy: Record<
  LanguageCode,
  {
    crisisLabel: string;
    crisisMessage: string;
    violenceLabel: string;
    violenceMessage: string;
    medicalLabel: string;
    medicalMessage: string;
    legalLabel: string;
    legalMessage: string;
    financialLabel: string;
    financialMessage: string;
    generalLabel: string;
    generalMessage: string;
  }
> = {
  en: {
    crisisLabel: "Crisis support may be needed",
    crisisMessage:
      "If there is any risk of self-harm, Council is not the right support. Contact local emergency services or a crisis line now.",
    violenceLabel: "Safety boundary",
    violenceMessage:
      "If there is risk of harming someone, Council will not generate a plan. Move to safety and contact local emergency support.",
    medicalLabel: "Medical-domain notice",
    medicalMessage:
      "This decision may involve medical information. Council does not provide medical advice; use it only to structure your thinking.",
    legalLabel: "Legal-domain notice",
    legalMessage:
      "This decision may involve legal risk. Council does not provide legal advice; verify with a qualified professional.",
    financialLabel: "Financial-domain notice",
    financialMessage:
      "This decision may involve financial risk. Council does not provide investment or financial advice; consult a licensed expert.",
    generalLabel: "AI-supported assessment",
    generalMessage:
      "Outputs may be incomplete, wrong or unsuitable for your situation. Verify with your own judgment and reliable sources before acting.",
  },
  tr: {
    crisisLabel: "Kriz destegi gerekli olabilir",
    crisisMessage:
      "Kendinize zarar verme riski varsa Council uygun destek degildir. Yerel acil servislerle veya kriz destek hattiyla hemen iletisime gecin.",
    violenceLabel: "Guvenlik siniri",
    violenceMessage:
      "Birine zarar verme riski varsa Council plan uretmez. Guvenli bir ortama gecin ve yerel acil destek kanallarina ulasin.",
    medicalLabel: "Tibbi alan uyarisi",
    medicalMessage:
      "Bu karar tibbi bilgi icerebilir. Council tibbi tavsiye vermez; yalnizca dusunme yapisini destekler.",
    legalLabel: "Hukuki alan uyarisi",
    legalMessage:
      "Bu karar hukuki risk tasiyabilir. Council hukuki tavsiye vermez; uygun bir profesyonelle dogrulama yapin.",
    financialLabel: "Finansal alan uyarisi",
    financialMessage:
      "Bu karar finansal risk tasiyabilir. Council yatirim veya finansal tavsiye vermez; lisansli uzmandan destek alin.",
    generalLabel: "Yapay zeka destekli degerlendirme",
    generalMessage:
      "Ciktilar eksik, hatali veya durumunuza uygun olmayabilir. Karar vermeden once kendi muhakemenizle ve guvenilir kaynaklarla dogrulayin.",
  },
  ru: {
    crisisLabel: "Может понадобиться кризисная помощь",
    crisisMessage:
      "Если есть риск самоповреждения, Council не подходит как поддержка. Сейчас обратитесь в местные экстренные службы или кризисную линию.",
    violenceLabel: "Граница безопасности",
    violenceMessage:
      "Если есть риск причинить вред другому человеку, Council не будет строить план. Перейдите в безопасное место и обратитесь за срочной помощью.",
    medicalLabel: "Медицинское предупреждение",
    medicalMessage:
      "Решение может затрагивать медицинскую информацию. Council не дает медицинских советов; используйте его только для структуры мышления.",
    legalLabel: "Юридическое предупреждение",
    legalMessage:
      "Решение может иметь юридический риск. Council не дает юридических советов; проверьте вопрос с квалифицированным специалистом.",
    financialLabel: "Финансовое предупреждение",
    financialMessage:
      "Решение может иметь финансовый риск. Council не дает инвестиционных или финансовых советов; обратитесь к лицензированному специалисту.",
    generalLabel: "Оценка с поддержкой ИИ",
    generalMessage:
      "Ответы могут быть неполными, ошибочными или неподходящими для вашей ситуации. Проверяйте их своим суждением и надежными источниками.",
  },
  de: {
    crisisLabel: "Krisenhilfe kann noetig sein",
    crisisMessage:
      "Wenn ein Risiko fuer Selbstverletzung besteht, ist Council nicht die richtige Hilfe. Kontaktieren Sie jetzt lokale Notdienste oder eine Krisenstelle.",
    violenceLabel: "Sicherheitsgrenze",
    violenceMessage:
      "Wenn Gefahr besteht, jemandem zu schaden, erzeugt Council keinen Plan. Gehen Sie in Sicherheit und kontaktieren Sie lokale Nothilfe.",
    medicalLabel: "Medizinischer Hinweis",
    medicalMessage:
      "Diese Entscheidung kann medizinische Informationen beruehren. Council gibt keine medizinische Beratung; nutzen Sie es nur zur Strukturierung.",
    legalLabel: "Rechtlicher Hinweis",
    legalMessage:
      "Diese Entscheidung kann rechtliche Risiken beruehren. Council gibt keine Rechtsberatung; pruefen Sie es mit einer qualifizierten Fachperson.",
    financialLabel: "Finanzieller Hinweis",
    financialMessage:
      "Diese Entscheidung kann finanzielle Risiken beruehren. Council gibt keine Anlage- oder Finanzberatung; sprechen Sie mit einer lizenzierten Fachperson.",
    generalLabel: "KI-gestuetzte Einschätzung",
    generalMessage:
      "Ausgaben koennen unvollstaendig, falsch oder unpassend sein. Pruefen Sie sie mit eigenem Urteil und verlaesslichen Quellen, bevor Sie handeln.",
  },
};

const engineCopy = {
  en: {
    fallbackTitle: "New decision",
    professionalDisclaimer:
      "Council does not provide therapy, legal advice, medical advice, financial advice or licensed professional services. Consult a qualified professional before acting in those areas.",
    noDeepAnalysis:
      "This topic should not be handled with deep decision analysis inside the app. Safety and appropriate professional support come first.",
    safetyAgreements: ["Safety comes first.", "Appropriate professional or emergency support may be needed."],
    keyAgreements: [
      "The decision should not be made from one emotional spike.",
      "A reversible test can reduce pressure for a final commitment.",
      "Options cannot be compared fairly until missing information is named.",
    ],
    safetyQuestions: ["How can appropriate safety support be reached now?"],
    unresolvedQuestions: [
      "What is the real success criterion: freedom, safety, progress or belonging?",
      "What new information would change today’s preference?",
      "Is the reversal cost acceptable in the worst reasonable scenario?",
    ],
    biggestRisks: [
      "Letting one emotional moment or one person’s reaction carry the decision.",
      "Taking a large commitment before clarifying reversal cost and time horizon.",
      "Using false certainty to feel relieved while key information is missing.",
    ],
    avoidance:
      "You may not be avoiding the decision itself; you may be avoiding the first concrete conversation, cost or identity shift that follows it.",
    emergencyOrProfessional: ["Appropriate emergency support or a qualified professional view."],
    minoritySafety: "This session was limited to safety guidance instead of deep analysis.",
    minorityDefault:
      "Minority report: more analysis is not always a better decision. Sometimes the best move is to set a loss limit and run a small test.",
    confidenceSafety: "Low: the topic is near a safety or professional-support boundary.",
    confidenceHigh: "Medium-low: stakes are high; more verification is needed.",
    confidenceGeneral: "Medium: this is decision support, not certainty.",
    protocolNotes: [
      "Problem Restate Gate applied.",
      "At least two dissenting views were preserved.",
      "The output recommends a next information-producing step rather than deciding for you.",
    ],
    restatement: (title: string) =>
      `This session reframes "${title}" through options, constraints, risks and one usable first step.`,
    alternativeFraming:
      'Alternative frame: instead of "Which option comforts me today?", ask "Which option creates better information in 7 days while keeping reversal cost low?"',
    fallbackOptions: ["Decide now", "Run a 7-day test", "Wait intentionally"],
    optionTradeoffFast: "Creates faster clarity, but risks over-committing with incomplete information.",
    optionTradeoffData: "Creates better data, but asks you to carry uncertainty a little longer.",
    optionWinsFast: "Wins if reversal cost is low and delay is becoming more expensive.",
    optionWinsData: "Wins if missing information could meaningfully change today’s choice.",
    mostImportantBase: (title: string) =>
      `The real decision is not only "${title}"; it is which value you are willing to protect, and at what cost.`,
    mostImportantCautious: "Clarify reversal cost and safety margin first.",
    mostImportantDecisive: "Turn the decision into one information-producing action within 7 days.",
    mostImportantBalanced: "Separate options by evidence, risk and feasibility instead of searching for one perfect answer.",
    disagreementCautious:
      "The Risk Analyst wants more protection, while the Builder wants progress through a smaller test.",
    disagreementBalanced:
      "The Strategist wants a clearer direction, while the Stoic warns against trying to erase all uncertainty.",
    disagreementSystem:
      "The Skeptic may find the current reasons thin; the Systems Thinker may care more about people and dependencies around the decision.",
    disagreementDomain: (domain: string) =>
      `In ${domain}, short-term relief and long-term position are pulling against each other.`,
    missingInfo: [
      "Three measurable criteria for calling this decision successful.",
      "The time, money and reputation cost if you need to reverse course.",
      "The real need or reaction of the most affected person.",
    ],
    missingNeedOptions: "At least two clear options, or waiting as one explicit option.",
    missingConstraints: "Hard constraints: money, time, family, visa, health, work or location.",
    sevenDayCautious: "Write the worst reasonable scenario and one harm-reduction step for each risk.",
    sevenDayBase: "Reduce the decision question to one sentence and write success criteria.",
    sevenDayScore: "Put options side by side; score cost, reversibility and energy impact.",
    sevenDayInfo: "Pick the one piece of information that could change the decision and plan how to get it.",
    sevenDayConversation: "Have a 30-minute clarity conversation with someone trustworthy but not directly invested.",
    sevenDayReview: "On day 7, score confidence again; if it changed by more than 15 points, rerun Council.",
    safetyPlan: [
      "Do not use the app as a decision tool; physical safety comes first.",
      "Contact local emergency services or a crisis line.",
      "Tell a trusted person clearly that you should not be alone right now.",
    ],
    fallbackOptionsLabel: "options are not clear yet",
    unclearOptions: "options are not clear yet",
    constraintsMissing: "not written clearly",
    decisiveLensSuffix: "This lens recommends a small commitment with a date.",
    cautiousLensSuffix: "This lens recommends writing harm-reduction boundaries first.",
  },
  tr: {
    fallbackTitle: "Yeni karar",
    professionalDisclaimer:
      "Council terapi, hukuki danismanlik, tibbi danismanlik, finansal danismanlik veya lisansli profesyonel hizmet sunmaz. Bu alanlarda karar vermeden once nitelikli bir profesyonele danisin.",
    noDeepAnalysis:
      "Bu konu uygulama icinde derin karar analiziyle ele alinmamalidir. Oncelik guvenlik ve uygun profesyonel destektir.",
    safetyAgreements: ["Oncelik guvenliktir.", "Uygun profesyonel veya acil destek gerekebilir."],
    keyAgreements: [
      "Karar tek bir duygusal tepkiyle verilmemeli.",
      "Geri donulebilir bir test, kesin karar baskisini azaltir.",
      "Eksik bilgi acikca yazilmadan secenekler adil karsilastirilamaz.",
    ],
    safetyQuestions: ["Uygun guvenlik destegine nasil ulasilacak?"],
    unresolvedQuestions: [
      "Bu karari basarili yapan asil kriter ozgurluk mu, guvenlik mi, ilerleme mi?",
      "Hangi bilgi ortaya cikarsa bugunku tercihiniz degisir?",
      "En kotu makul senaryoda geri donus maliyeti kabul edilebilir mi?",
    ],
    biggestRisks: [
      "Karari tek bir duygusal ana veya tek bir kisinin tepkisine gore vermek.",
      "Geri donus maliyetini ve zaman ufkunu netlestirmeden buyuk taahhut almak.",
      "Eksik bilgiye ragmen kendinizi kesinlik varmis gibi rahatlatmak.",
    ],
    avoidance:
      "Kaciniyor olabileceginiz sey karar degil; karar verdikten sonra ortaya cikacak ilk somut konusma, maliyet veya kimlik degisimidir.",
    emergencyOrProfessional: ["Uygun acil destek veya lisansli profesyonel gorusu."],
    minoritySafety: "Bu oturum derin analiz yerine guvenlik yonlendirmesiyle sinirlandirildi.",
    minorityDefault:
      "Azinlik gorusu: daha fazla analiz her zaman daha iyi karar demek degil; bazen en iyi hamle zarar limiti koyup kucuk bir deney baslatmaktir.",
    confidenceSafety: "Dusuk: konu guvenlik/profesyonel destek sinirina yakin.",
    confidenceHigh: "Orta-dusuk: risk seviyesi yuksek; daha fazla dogrulama gerekir.",
    confidenceGeneral: "Orta: bu bir karar destek sentezi, kesinlik iddiasi degil.",
    protocolNotes: [
      "Problem yeniden cerceveleme uygulandi.",
      "En az iki farkli itiraz korunacak sekilde sentezlendi.",
      "Sonuc, karar vermek yerine bilgi ureten sonraki adimi onerir.",
    ],
    restatement: (title: string) =>
      `Bu oturum, "${title}" sorusunu secenekler, kisitlar, riskler ve uygulanabilir ilk adim acisindan yeniden cerceveler.`,
    alternativeFraming:
      'Alternatif cerceve: "Hangi secenek bugun beni rahatlatir?" yerine "Hangi secenek 7 gun icinde daha iyi bilgi uretir ve geri donus maliyetimi dusuk tutar?"',
    fallbackOptions: ["Hemen karar vermek", "7 gunluk test yapmak", "Beklemek"],
    optionTradeoffFast: "Daha hizli netlik verir, ama eksik bilgiyle asiri taahhut riski tasir.",
    optionTradeoffData: "Daha fazla veri verir, ama belirsizligi bir sure daha tasimaniz gerekir.",
    optionWinsFast: "Geri donus maliyeti dusukse ve karar gecikmesi daha pahaliya geliyorsa.",
    optionWinsData: "Eksik bilgi bugunku karari anlamli sekilde degistirebilecekse.",
    mostImportantBase: (title: string) =>
      `Asil karar sadece "${title}" degil; hangi degeri, hangi maliyetle korumaya razi oldugunuz.`,
    mostImportantCautious: "Once geri donus maliyetini ve guvenlik payini netlestirin.",
    mostImportantDecisive: "Sonraki 7 gun icinde karari bilgi ureten bir eyleme cevirmelisiniz.",
    mostImportantBalanced: "Tek dogru cevap aramak yerine secenekleri veri, risk ve uygulanabilirlik acisindan ayirin.",
    disagreementCautious:
      "Risk Analisti daha fazla koruma isterken Insaatci daha kucuk bir testle ilerlemeyi oneriyor.",
    disagreementBalanced:
      "Stratejist daha net yon isterken Stoaci belirsizligi tamamen yok etmeye calismamanizi oneriyor.",
    disagreementSystem:
      "Supheci mevcut gerekceleri zayif bulabilir; Sistem Dusunuru karar cevresindeki insanlari ve bagimliliklari daha onemli gorebilir.",
    disagreementDomain: (domain: string) =>
      `${domain} alaninda kisa vadeli rahatlik ile uzun vadeli konum arasinda gerilim var.`,
    missingInfo: [
      "Bu karari basarili saymaniz icin olculebilir 3 kriter.",
      "Geri donmek zorunda kalirsaniz kaybedeceginiz zaman, para ve itibar miktari.",
      "Karardan etkilenecek en onemli kisinin gercek tepkisi veya ihtiyaci.",
    ],
    missingNeedOptions: "En az iki net secenek veya seceneklerden biri olarak 'beklemek'.",
    missingConstraints: "Zorunlu sinirlar: para, zaman, aile, vize, saglik, is veya lokasyon.",
    sevenDayCautious: "En kotu makul senaryoyu yazin ve her risk icin bir zarar azaltma adimi belirleyin.",
    sevenDayBase: "Karar sorusunu tek cumleye indirin ve basari kriterlerinizi yazin.",
    sevenDayScore: "Seceneklerinizi yan yana koyun; maliyet, geri donulebilirlik ve enerji etkisini puanlayin.",
    sevenDayInfo: "Karari degistirebilecek tek bilgiyi secin ve onu elde etmek icin plan yapin.",
    sevenDayConversation: "Guvenilir ama karardan cikar saglamayan biriyle 30 dakikalik netlik konusmasi yapin.",
    sevenDayReview: "7. gunde guven puaninizi yeniden verin; 15 puandan fazla degistiyse Council oturumunu yenileyin.",
    safetyPlan: [
      "Uygulamayi karar araci olarak kullanmayin; oncelik fiziksel guvenliktir.",
      "Yerel acil servislerle veya kriz destek hattiyla iletisime gecin.",
      "Guvenilir bir kisiye yalniz kalmamaniz gerektigini acikca soyleyin.",
    ],
    fallbackOptionsLabel: "secenekler henuz net degil",
    unclearOptions: "secenekler henuz net degil",
    constraintsMissing: "net yazilmamis",
    decisiveLensSuffix: "Bu mercek, kucuk ama tarihli bir taahhut belirlemenizi onerir.",
    cautiousLensSuffix: "Bu mercek, once zarar azaltma sinirlarini yazmanizi onerir.",
  },
  ru: {
    fallbackTitle: "Новое решение",
    professionalDisclaimer:
      "Council не является терапией, юридической, медицинской, финансовой консультацией или лицензированной профессиональной услугой. Перед действиями в этих областях обратитесь к квалифицированному специалисту.",
    noDeepAnalysis:
      "Эту тему не стоит разбирать в приложении как глубокий анализ решения. Сначала безопасность и подходящая профессиональная поддержка.",
    safetyAgreements: ["Безопасность важнее всего.", "Может понадобиться профессиональная или экстренная поддержка."],
    keyAgreements: [
      "Решение не стоит принимать из одного эмоционального всплеска.",
      "Обратимый тест снижает давление окончательного выбора.",
      "Варианты нельзя честно сравнить, пока недостающая информация не названа.",
    ],
    safetyQuestions: ["Как сейчас получить подходящую поддержку безопасности?"],
    unresolvedQuestions: [
      "Главный критерий успеха: свобода, безопасность, прогресс или принадлежность?",
      "Какая новая информация изменила бы сегодняшний выбор?",
      "При худшем разумном сценарии цена возврата приемлема?",
    ],
    biggestRisks: [
      "Позволить одному эмоциональному моменту или реакции одного человека нести все решение.",
      "Взять большой обязательство до ясности по цене возврата и горизонту времени.",
      "Использовать ложную уверенность для облегчения, когда ключевой информации нет.",
    ],
    avoidance:
      "Возможно, вы избегаете не решения, а первого конкретного разговора, расхода или сдвига идентичности после него.",
    emergencyOrProfessional: ["Подходящая экстренная поддержка или мнение квалифицированного специалиста."],
    minoritySafety: "Эта сессия ограничена безопасностью вместо глубокого анализа.",
    minorityDefault:
      "Особое мнение: больше анализа не всегда означает лучшее решение. Иногда лучший шаг — поставить предел потерь и начать малый тест.",
    confidenceSafety: "Низкая: тема близка к границе безопасности или профессиональной поддержки.",
    confidenceHigh: "Средне-низкая: ставки высоки; нужна дополнительная проверка.",
    confidenceGeneral: "Средняя: это поддержка решения, а не уверенность.",
    protocolNotes: [
      "Проблема была переформулирована.",
      "Сохранены как минимум две несогласные позиции.",
      "Итог предлагает следующий шаг для получения информации, а не решает за вас.",
    ],
    restatement: (title: string) =>
      `Эта сессия переформулирует "${title}" через варианты, ограничения, риски и первый практический шаг.`,
    alternativeFraming:
      'Альтернативная рамка: не "какой вариант успокоит меня сегодня?", а "какой вариант за 7 дней даст лучшую информацию и сохранит низкую цену возврата?"',
    fallbackOptions: ["Решить сейчас", "Провести 7-дневный тест", "Подождать осознанно"],
    optionTradeoffFast: "Дает более быструю ясность, но несет риск чрезмерного обязательства при неполной информации.",
    optionTradeoffData: "Дает больше данных, но требует дольше держать неопределенность.",
    optionWinsFast: "Побеждает, если цена возврата низкая, а задержка становится дороже.",
    optionWinsData: "Побеждает, если недостающая информация может заметно изменить сегодняшний выбор.",
    mostImportantBase: (title: string) =>
      `Настоящее решение не только "${title}"; оно о том, какую ценность вы готовы защищать и какой ценой.`,
    mostImportantCautious: "Сначала уточните цену возврата и запас безопасности.",
    mostImportantDecisive: "За 7 дней превратите решение в действие, которое даст новую информацию.",
    mostImportantBalanced: "Разделите варианты по фактам, риску и выполнимости вместо поиска одного идеального ответа.",
    disagreementCautious:
      "Аналитик риска хочет больше защиты, а Строитель предлагает двигаться через меньший тест.",
    disagreementBalanced:
      "Стратег хочет более ясное направление, а Стоик предупреждает, что всю неопределенность убрать нельзя.",
    disagreementSystem:
      "Скептик может считать текущие причины слабыми; Системный мыслитель может больше смотреть на людей и зависимости вокруг решения.",
    disagreementDomain: (domain: string) =>
      `В области ${domain} краткосрочное облегчение и долгосрочная позиция тянут в разные стороны.`,
    missingInfo: [
      "Три измеримых критерия, по которым решение будет считаться успешным.",
      "Цена возврата во времени, деньгах и репутации.",
      "Реальная потребность или реакция человека, которого решение затронет сильнее всего.",
    ],
    missingNeedOptions: "Минимум два ясных варианта, либо ожидание как явный вариант.",
    missingConstraints: "Жесткие ограничения: деньги, время, семья, виза, здоровье, работа или место.",
    sevenDayCautious: "Опишите худший разумный сценарий и один шаг снижения вреда для каждого риска.",
    sevenDayBase: "Сведите вопрос решения к одному предложению и запишите критерии успеха.",
    sevenDayScore: "Поставьте варианты рядом; оцените стоимость, обратимость и влияние на энергию.",
    sevenDayInfo: "Выберите одну информацию, которая может изменить решение, и спланируйте, как ее получить.",
    sevenDayConversation: "Проведите 30-минутный разговор о ясности с надежным человеком без прямой выгоды.",
    sevenDayReview: "На 7-й день снова оцените уверенность; если она изменилась более чем на 15 пунктов, повторите Council.",
    safetyPlan: [
      "Не используйте приложение как инструмент решения; физическая безопасность важнее.",
      "Обратитесь в местные экстренные службы или кризисную линию.",
      "Ясно скажите надежному человеку, что вам сейчас не стоит оставаться одному.",
    ],
    fallbackOptionsLabel: "варианты пока не ясны",
    unclearOptions: "варианты пока не ясны",
    constraintsMissing: "не записаны ясно",
    decisiveLensSuffix: "Эта перспектива рекомендует малое обязательство с датой.",
    cautiousLensSuffix: "Эта перспектива рекомендует сначала записать границы снижения вреда.",
  },
  de: {
    fallbackTitle: "Neue Entscheidung",
    professionalDisclaimer:
      "Council bietet keine Therapie, Rechtsberatung, medizinische Beratung, Finanzberatung oder lizenzierte professionelle Dienstleistung. Konsultieren Sie in diesen Bereichen eine qualifizierte Fachperson.",
    noDeepAnalysis:
      "Dieses Thema sollte in der App nicht als tiefe Entscheidungsanalyse behandelt werden. Sicherheit und passende professionelle Hilfe stehen zuerst.",
    safetyAgreements: ["Sicherheit steht zuerst.", "Professionelle oder akute Hilfe kann noetig sein."],
    keyAgreements: [
      "Die Entscheidung sollte nicht aus einem einzigen emotionalen Ausschlag entstehen.",
      "Ein umkehrbarer Test kann den Druck einer endgueltigen Festlegung senken.",
      "Optionen sind erst fair vergleichbar, wenn fehlende Informationen benannt sind.",
    ],
    safetyQuestions: ["Wie kann jetzt passende Sicherheitsunterstuetzung erreicht werden?"],
    unresolvedQuestions: [
      "Was ist das echte Erfolgskriterium: Freiheit, Sicherheit, Fortschritt oder Zugehoerigkeit?",
      "Welche neue Information wuerde die heutige Praeferenz aendern?",
      "Ist die Rueckkehr-Kosten im schlechtesten vernuenftigen Szenario tragbar?",
    ],
    biggestRisks: [
      "Einen emotionalen Moment oder die Reaktion einer Person die Entscheidung tragen lassen.",
      "Eine grosse Verpflichtung eingehen, bevor Rueckkehr-Kosten und Zeithorizont klar sind.",
      "Falsche Gewissheit nutzen, um sich zu beruhigen, obwohl Schluesselinformationen fehlen.",
    ],
    avoidance:
      "Vielleicht vermeiden Sie nicht die Entscheidung selbst, sondern das erste konkrete Gespraech, die Kosten oder die Identitaetsverschiebung danach.",
    emergencyOrProfessional: ["Passende akute Hilfe oder eine qualifizierte professionelle Einschaetzung."],
    minoritySafety: "Diese Sitzung wurde auf Sicherheitsorientierung statt Tiefenanalyse begrenzt.",
    minorityDefault:
      "Minderheitsbericht: Mehr Analyse ist nicht immer eine bessere Entscheidung. Manchmal ist der beste Schritt, ein Verlustlimit zu setzen und einen kleinen Test zu starten.",
    confidenceSafety: "Niedrig: Das Thema liegt nahe an einer Sicherheits- oder Fachhilfegrenze.",
    confidenceHigh: "Mittel-niedrig: Die Einsaetze sind hoch; mehr Pruefung ist noetig.",
    confidenceGeneral: "Mittel: Das ist Entscheidungsunterstuetzung, keine Gewissheit.",
    protocolNotes: [
      "Problem-Neurahmung angewendet.",
      "Mindestens zwei abweichende Sichtweisen wurden erhalten.",
      "Das Ergebnis empfiehlt einen naechsten informationsbildenden Schritt, statt fuer Sie zu entscheiden.",
    ],
    restatement: (title: string) =>
      `Diese Sitzung rahmt "${title}" ueber Optionen, Grenzen, Risiken und einen nutzbaren ersten Schritt neu.`,
    alternativeFraming:
      'Alternative Rahmung: nicht "Welche Option beruhigt mich heute?", sondern "Welche Option erzeugt in 7 Tagen bessere Informationen und haelt Rueckkehr-Kosten niedrig?"',
    fallbackOptions: ["Jetzt entscheiden", "7-Tage-Test durchfuehren", "Bewusst warten"],
    optionTradeoffFast: "Schafft schnellere Klarheit, riskiert aber Ueberbindung mit unvollstaendigen Informationen.",
    optionTradeoffData: "Schafft bessere Daten, verlangt aber, Unsicherheit noch etwas laenger zu tragen.",
    optionWinsFast: "Gewinnt, wenn Rueckkehr-Kosten niedrig sind und Verzoegerung teurer wird.",
    optionWinsData: "Gewinnt, wenn fehlende Informationen die heutige Wahl deutlich aendern koennen.",
    mostImportantBase: (title: string) =>
      `Die eigentliche Entscheidung ist nicht nur "${title}", sondern welchen Wert Sie zu welchem Preis schuetzen wollen.`,
    mostImportantCautious: "Klaeren Sie zuerst Rueckkehr-Kosten und Sicherheitsmarge.",
    mostImportantDecisive: "Machen Sie die Entscheidung innerhalb von 7 Tagen zu einer informationsbildenden Handlung.",
    mostImportantBalanced: "Trennen Sie Optionen nach Evidenz, Risiko und Machbarkeit, statt eine perfekte Antwort zu suchen.",
    disagreementCautious:
      "Der Risikoanalyst will mehr Schutz, waehrend der Builder Fortschritt durch einen kleineren Test empfiehlt.",
    disagreementBalanced:
      "Der Stratege will eine klarere Richtung, waehrend der Stoiker warnt, nicht jede Unsicherheit beseitigen zu wollen.",
    disagreementSystem:
      "Der Skeptiker kann die aktuellen Gruende duenn finden; der Systemdenker achtet staerker auf Menschen und Abhaengigkeiten.",
    disagreementDomain: (domain: string) =>
      `Im Bereich ${domain} ziehen kurzfristige Erleichterung und langfristige Position gegeneinander.`,
    missingInfo: [
      "Drei messbare Kriterien, wann diese Entscheidung erfolgreich ist.",
      "Zeit-, Geld- und Reputationskosten, falls Sie zurueckgehen muessen.",
      "Das echte Beduerfnis oder die Reaktion der am staerksten betroffenen Person.",
    ],
    missingNeedOptions: "Mindestens zwei klare Optionen, oder Warten als ausdrueckliche Option.",
    missingConstraints: "Harte Grenzen: Geld, Zeit, Familie, Visum, Gesundheit, Arbeit oder Ort.",
    sevenDayCautious: "Schreiben Sie das schlechteste vernuenftige Szenario und je Risiko einen Schadensminderungsschritt.",
    sevenDayBase: "Reduzieren Sie die Entscheidungsfrage auf einen Satz und schreiben Sie Erfolgskriterien.",
    sevenDayScore: "Legen Sie Optionen nebeneinander; bewerten Sie Kosten, Umkehrbarkeit und Energieauswirkung.",
    sevenDayInfo: "Waehlen Sie eine Information, die die Entscheidung aendern koennte, und planen Sie, wie Sie sie bekommen.",
    sevenDayConversation: "Fuehren Sie ein 30-minuetiges Klarheitsgespraech mit einer vertrauenswuerdigen, nicht direkt beteiligten Person.",
    sevenDayReview: "Bewerten Sie am 7. Tag Ihr Vertrauen neu; bei mehr als 15 Punkten Veraenderung Council erneut starten.",
    safetyPlan: [
      "Nutzen Sie die App nicht als Entscheidungswerkzeug; physische Sicherheit steht zuerst.",
      "Kontaktieren Sie lokale Notdienste oder eine Krisenstelle.",
      "Sagen Sie einer vertrauenswuerdigen Person klar, dass Sie jetzt nicht allein sein sollten.",
    ],
    fallbackOptionsLabel: "Optionen sind noch nicht klar",
    unclearOptions: "Optionen sind noch nicht klar",
    constraintsMissing: "nicht klar notiert",
    decisiveLensSuffix: "Diese Perspektive empfiehlt eine kleine Verpflichtung mit Datum.",
    cautiousLensSuffix: "Diese Perspektive empfiehlt, zuerst Schadensgrenzen zu notieren.",
  },
} satisfies Record<LanguageCode, Record<string, unknown>>;

const lensCopy: Record<LanguageCode, Record<ArchetypeId, LensTemplate>> = {
  en: {
    skeptic: {
      headline: "Separate evidence first",
      restatement: "The core question is which assumptions have started acting like facts.",
      stance: ({ domain }) => `This is a ${domain} decision, but emotion and evidence may be mixed together.`,
      argument: ({ options }) => `Across your options (${options}), the decision stays blurry until facts and guesses are separated.`,
      watchOut: "The least frightening option can start to feel like the most truthful one.",
      nextMove: "Write 3 pieces of evidence that could change the decision and test at least one this week.",
    },
    stoic: {
      headline: "Narrow the field of control",
      restatement: "The core question is what you can control versus what uncertainty you must carry.",
      stance: () => "Other people’s reactions, timing or market conditions may not be fully controllable.",
      argument: () => "Your controllable field is behavior, preparation, boundaries and the rhythm after the decision.",
      watchOut: "Trying to remove every uncertainty can keep you stuck.",
      nextMove: "List 5 controllable actions and 3 uncertainties you must accept.",
    },
    strategist: {
      headline: "Think in position",
      restatement: "The core question is the tradeoff between today’s comfort and future position.",
      stance: ({ domain }) => `A ${domain} decision changes not only today’s comfort, but your 6-12 month position.`,
      argument: () => "Name the opportunity cost: which doors does this choice open, and which does it temporarily close?",
      watchOut: "Short-term relief can hide long-term loss of direction.",
      nextMove: "Describe the most plausible 1-year outcome for each option in one paragraph.",
    },
    builder: {
      headline: "Turn the decision into an experiment",
      restatement: "The core question is how to make a large decision produce information through a small test.",
      stance: ({ horizon }) => `Your time horizon is ${horizon}; a small test can improve the quality of the choice.`,
      argument: () => "Rather than deciding the whole future today, design a reversible test.",
      watchOut: "Planning can feel like progress before anything has changed.",
      nextMove: "Choose one 7-day test: a conversation, budget check, trial application or information interview.",
    },
    systems: {
      headline: "See the chain effects",
      restatement: "The core question is how people, habits and resources around the decision will change.",
      stance: () => "This choice is connected to money, energy, relationships and identity.",
      argument: ({ constraints }) => `Your constraints (${constraints}) define the system boundary. If boundaries are unclear, a good decision may be applied badly.`,
      watchOut: "Listening only to your inner voice can make you miss stakeholders in the system.",
      nextMove: "Write the people and areas affected; note one second-order effect for each.",
    },
    risk: {
      headline: "Calculate reversal cost",
      restatement: "The core question is how fast and how costly recovery would be if you are wrong.",
      stance: ({ stakes }) => `For a ${stakes}-risk decision, the key question is how quickly you can recover from a mistake.`,
      argument: () => "Writing the worst reasonable scenario is not pessimism; it creates a safety margin.",
      watchOut: "Courage without known risks can just be speed.",
      nextMove: "Set loss limits for time, money, reputation and emotional energy.",
    },
  },
  tr: {
    skeptic: {
      headline: "Once kaniti ayirin",
      restatement: "Sorunun asil cekirdegi, hangi varsayimlarin kanit gibi davranmaya basladigini ayirmak.",
      stance: ({ domain }) => `Bu ${domain} karari, fakat duygu ve gerekce birbirine karismis olabilir.`,
      argument: ({ options }) => `Secenekleriniz (${options}) icinde gercek veri ile tahmini ayirmadan karar netlesmez.`,
      watchOut: "Kendinizi en az korkutan secenegi en dogru secenek sanabilirsiniz.",
      nextMove: "Karari degistirebilecek 3 kanit yazin ve bu kanitlardan en az birini bu hafta test edin.",
    },
    stoic: {
      headline: "Kontrol alanini daraltin",
      restatement: "Sorunun asil cekirdegi, kontrol edebildiginiz alan ile tasimaniz gereken belirsizligi ayirmak.",
      stance: () => "Baskalarinin tepkisi, zamanlama veya piyasa kosullari tamamen kontrolunuzde olmayabilir.",
      argument: () => "Kontrol edebileceginiz alan davranisiniz, hazirlik seviyeniz, sinirlariniz ve karar sonrasi ritminizdir.",
      watchOut: "Belirsizligi tamamen yok etmeye calismak sizi ayni yerde tutabilir.",
      nextMove: "Kontrol edebildiginiz 5 unsur ve kabul etmeniz gereken 3 belirsizlik yazin.",
    },
    strategist: {
      headline: "Konumunuzu dusunun",
      restatement: "Sorunun asil cekirdegi, bugunku rahatlik ile gelecekteki konum arasindaki takas.",
      stance: ({ domain }) => `${domain} karari sadece bugunku rahatligi degil, 6-12 ay sonraki konumunuzu da etkiler.`,
      argument: () => "Firsat maliyetini acik yazin: bu secim hangi kapilari acar, hangilerini gecici olarak kapatir?",
      watchOut: "Kisa vadeli rahatlik uzun vadeli yon kaybini gizleyebilir.",
      nextMove: "Her secenek icin 1 yil sonraki en makul sonucu tek paragrafla tarif edin.",
    },
    builder: {
      headline: "Karari deneye cevirin",
      restatement: "Sorunun asil cekirdegi, buyuk karari bilgi ureten kucuk bir deneye cevirmek.",
      stance: ({ horizon }) => `Zaman ufkunuz ${horizon}; kucuk bir deney karar kalitesini artirabilir.`,
      argument: () => "Buyuk kararin tamamini bugun vermek yerine geri donulebilir bir test tasarlamak daha saglam.",
      watchOut: "Plan yapmayi ilerleme sanmak.",
      nextMove: "7 gun icinde bitirilebilir tek bir deney secin: konusma, butce hesaplama, deneme basvurusu veya bilgi gorusmesi.",
    },
    systems: {
      headline: "Zincir etkilerini gorun",
      restatement: "Sorunun asil cekirdegi, karar etrafindaki insanlar, aliskanliklar ve kaynak akislarinin nasil degisecegi.",
      stance: () => "Bu secim para, enerji, iliskiler ve kimlik alginizla baglantili.",
      argument: ({ constraints }) => `Kisitlariniz (${constraints}) karar sisteminin sinirlarini belirliyor. Sinirlar net degilse iyi karar kotu uygulanabilir.`,
      watchOut: "Sadece kendi ic sesinizi dinleyip sistemdeki paydaslari unutmak.",
      nextMove: "Karardan etkilenecek kisileri ve alanlari yazin; her biri icin olasi ikinci derece sonucu not edin.",
    },
    risk: {
      headline: "Geri donus maliyetini hesaplayin",
      restatement: "Sorunun asil cekirdegi, hata yaparsaniz ne kadar hizli ve ne maliyetle toparlanabileceginiz.",
      stance: ({ stakes }) => `${stakes} riskli bir karar icin en onemli soru, hata yaparsaniz ne kadar hizli toparlayabileceginizdir.`,
      argument: () => "En kotu makul senaryoyu yazmak karamsarlik degil, guvenlik payi olusturmaktir.",
      watchOut: "Riskleri bilmeden cesaret, sadece hiz olabilir.",
      nextMove: "Kayip limiti belirleyin: zaman, para, itibar ve duygusal enerji icin durma noktaniz ne?",
    },
  },
  ru: {
    skeptic: {
      headline: "Сначала отделите факты",
      restatement: "Суть вопроса в том, какие предположения начали выглядеть как доказательства.",
      stance: ({ domain }) => `Это решение в области ${domain}, но эмоции и факты могут быть смешаны.`,
      argument: ({ options }) => `В ваших вариантах (${options}) решение не прояснится, пока факты и догадки не разделены.`,
      watchOut: "Наименее пугающий вариант может начать казаться самым верным.",
      nextMove: "Запишите 3 факта, которые могли бы изменить решение, и проверьте хотя бы один на этой неделе.",
    },
    stoic: {
      headline: "Сузьте поле контроля",
      restatement: "Суть вопроса в том, что вы контролируете, а какую неопределенность придется нести.",
      stance: () => "Реакции других людей, время или рынок могут быть не полностью под вашим контролем.",
      argument: () => "В зоне контроля остаются поведение, подготовка, границы и ритм после решения.",
      watchOut: "Попытка убрать всю неопределенность может удерживать вас на месте.",
      nextMove: "Запишите 5 контролируемых действий и 3 неопределенности, которые придется принять.",
    },
    strategist: {
      headline: "Думайте позицией",
      restatement: "Суть вопроса в обмене между сегодняшним комфортом и будущей позицией.",
      stance: ({ domain }) => `Решение в области ${domain} влияет не только на комфорт сегодня, но и на позицию через 6-12 месяцев.`,
      argument: () => "Назовите цену возможности: какие двери выбор открывает, а какие временно закрывает?",
      watchOut: "Краткосрочное облегчение может скрыть потерю долгосрочного направления.",
      nextMove: "Опишите самый вероятный исход через 1 год для каждого варианта одним абзацем.",
    },
    builder: {
      headline: "Превратите решение в эксперимент",
      restatement: "Суть вопроса в том, как большое решение может дать информацию через малый тест.",
      stance: ({ horizon }) => `Ваш горизонт времени — ${horizon}; малый тест может повысить качество выбора.`,
      argument: () => "Вместо решения всего будущего сегодня спроектируйте обратимый тест.",
      watchOut: "Планирование может ощущаться как прогресс до реального изменения.",
      nextMove: "Выберите один тест на 7 дней: разговор, расчет бюджета, пробная заявка или информационное интервью.",
    },
    systems: {
      headline: "Увидьте цепные эффекты",
      restatement: "Суть вопроса в том, как изменятся люди, привычки и ресурсы вокруг решения.",
      stance: () => "Этот выбор связан с деньгами, энергией, отношениями и идентичностью.",
      argument: ({ constraints }) => `Ваши ограничения (${constraints}) задают границы системы. Если границы не ясны, хорошее решение может плохо выполняться.`,
      watchOut: "Если слушать только внутренний голос, можно пропустить участников системы.",
      nextMove: "Запишите людей и области, которых коснется решение; для каждого отметьте один вторичный эффект.",
    },
    risk: {
      headline: "Посчитайте цену возврата",
      restatement: "Суть вопроса в том, как быстро и какой ценой вы восстановитесь, если ошибетесь.",
      stance: ({ stakes }) => `Для решения с уровнем риска ${stakes} главный вопрос — как быстро можно восстановиться после ошибки.`,
      argument: () => "Худший разумный сценарий — это не пессимизм, а запас безопасности.",
      watchOut: "Смелость без понимания рисков может быть просто скоростью.",
      nextMove: "Поставьте пределы потерь по времени, деньгам, репутации и эмоциональной энергии.",
    },
  },
  de: {
    skeptic: {
      headline: "Evidenz zuerst trennen",
      restatement: "Der Kern ist, welche Annahmen bereits wie Fakten wirken.",
      stance: ({ domain }) => `Das ist eine ${domain}-Entscheidung, aber Gefuehl und Evidenz koennen vermischt sein.`,
      argument: ({ options }) => `Bei Ihren Optionen (${options}) bleibt die Entscheidung unscharf, bis Fakten und Vermutungen getrennt sind.`,
      watchOut: "Die am wenigsten beaengstigende Option kann sich wie die wahrste anfuehlen.",
      nextMove: "Schreiben Sie 3 Evidenzen auf, die die Entscheidung aendern koennten, und testen Sie eine davon diese Woche.",
    },
    stoic: {
      headline: "Kontrollfeld verengen",
      restatement: "Der Kern ist, was Sie kontrollieren koennen und welche Unsicherheit Sie tragen muessen.",
      stance: () => "Reaktionen anderer, Timing oder Marktbedingungen liegen moeglicherweise nicht voll in Ihrer Kontrolle.",
      argument: () => "Kontrollierbar sind Verhalten, Vorbereitung, Grenzen und der Rhythmus nach der Entscheidung.",
      watchOut: "Jede Unsicherheit beseitigen zu wollen, kann Sie festhalten.",
      nextMove: "Listen Sie 5 kontrollierbare Handlungen und 3 Unsicherheiten auf, die Sie akzeptieren muessen.",
    },
    strategist: {
      headline: "In Position denken",
      restatement: "Der Kern ist der Tausch zwischen heutigem Komfort und zukuenftiger Position.",
      stance: ({ domain }) => `Eine ${domain}-Entscheidung veraendert nicht nur Komfort heute, sondern Ihre Position in 6-12 Monaten.`,
      argument: () => "Benennen Sie Opportunitaetskosten: Welche Tueren oeffnet diese Wahl, welche schliesst sie voruebergehend?",
      watchOut: "Kurzfristige Erleichterung kann langfristigen Richtungsverlust verdecken.",
      nextMove: "Beschreiben Sie fuer jede Option das plausibelste Ergebnis in 1 Jahr in einem Absatz.",
    },
    builder: {
      headline: "Entscheidung zum Experiment machen",
      restatement: "Der Kern ist, eine grosse Entscheidung durch einen kleinen Test Informationen erzeugen zu lassen.",
      stance: ({ horizon }) => `Ihr Zeithorizont ist ${horizon}; ein kleiner Test kann die Wahl verbessern.`,
      argument: () => "Statt heute die ganze Zukunft zu entscheiden, entwerfen Sie einen umkehrbaren Test.",
      watchOut: "Planen kann sich wie Fortschritt anfuehlen, bevor sich etwas veraendert.",
      nextMove: "Waehlen Sie einen 7-Tage-Test: Gespraech, Budgetcheck, Probe-Bewerbung oder Informationsgespraech.",
    },
    systems: {
      headline: "Ketteneffekte sehen",
      restatement: "Der Kern ist, wie Menschen, Gewohnheiten und Ressourcen um die Entscheidung herum wechseln.",
      stance: () => "Diese Wahl ist mit Geld, Energie, Beziehungen und Identitaet verbunden.",
      argument: ({ constraints }) => `Ihre Grenzen (${constraints}) definieren die Systemgrenze. Sind sie unklar, kann eine gute Entscheidung schlecht umgesetzt werden.`,
      watchOut: "Nur auf die innere Stimme zu hoeren kann Beteiligte im System unsichtbar machen.",
      nextMove: "Schreiben Sie betroffene Menschen und Bereiche auf; notieren Sie je einen Zweitfolge-Effekt.",
    },
    risk: {
      headline: "Rueckkehr-Kosten berechnen",
      restatement: "Der Kern ist, wie schnell und wie teuer Erholung waere, wenn Sie falsch liegen.",
      stance: ({ stakes }) => `Bei einer ${stakes}-Risikoentscheidung ist wichtig, wie schnell Sie sich von einem Fehler erholen koennen.`,
      argument: () => "Das schlechteste vernuenftige Szenario aufzuschreiben ist kein Pessimismus, sondern Sicherheitsmarge.",
      watchOut: "Mut ohne bekannte Risiken kann nur Geschwindigkeit sein.",
      nextMove: "Setzen Sie Verlustlimits fuer Zeit, Geld, Ruf und emotionale Energie.",
    },
  },
};
