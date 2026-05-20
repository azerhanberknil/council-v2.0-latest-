import { ArchetypeId } from "@/types/decision";

export type Archetype = {
  id: ArchetypeId;
  name: string;
  purpose: string;
  tone: string;
  strengths: string;
  blindSpot: string;
  chooseWhen: string;
  icon: string;
  accent: string;
};

export const archetypes: Archetype[] = [
  {
    id: "skeptic",
    name: "Supheci",
    purpose: "Varsayimlari, kolay cevaplari ve kendini ikna etme cabasini test eder.",
    tone: "Net, sorgulayici, sakin.",
    strengths: "Tutarsizlik, eksik kanit ve acele sonuc bulur.",
    blindSpot: "Fazla kuskucu davranip hareketi geciktirebilir.",
    chooseWhen: "Bir secenege hizli ikna olduysaniz veya baski altinda karar veriyorsaniz.",
    icon: "questionmark.circle",
    accent: "#0B776D",
  },
  {
    id: "stoic",
    name: "Stoaci",
    purpose: "Kontrol edilebilir olani ayirir ve duygusal baskiyi dusurur.",
    tone: "Olculu, dingin, direkt.",
    strengths: "Kaygi, sucluluk ve belirsizlik icinde berraklik saglar.",
    blindSpot: "Bazen fazla kabullenici gorunebilir.",
    chooseWhen: "Karar duygusal olarak agir ve yorucu hissettiriyorsa.",
    icon: "circle.hexagongrid",
    accent: "#2E7650",
  },
  {
    id: "strategist",
    name: "Stratejist",
    purpose: "Uzun vadeli konum, firsat maliyeti ve kaldiraci inceler.",
    tone: "Keskin, ticari, pratik.",
    strengths: "Kariyer, tasinma ve buyuk yon degisimlerinde stratejik aci verir.",
    blindSpot: "Insani ve iliskisel maliyetleri kucumseyebilir.",
    chooseWhen: "Kararin gelecekteki konumunuzu belirleyecegini dusunuyorsaniz.",
    icon: "map",
    accent: "#A94E3F",
  },
  {
    id: "builder",
    name: "Insaatci",
    purpose: "Buyuk karari kucuk, uygulanabilir deneylere boler.",
    tone: "Somut, hizli, cozum odakli.",
    strengths: "Ilk adimi ve 7 gunluk ilerlemeyi netlestirir.",
    blindSpot: "Derin anlam sorularini fazla cabuk operasyonel hale getirebilir.",
    chooseWhen: "Dusunmekten yorulup kontrollu bir hareket baslatmak istiyorsaniz.",
    icon: "hammer",
    accent: "#9C6B16",
  },
  {
    id: "systems",
    name: "Sistem Dusunuru",
    purpose: "Ikinci derece sonuclari, bagimliliklari ve cevre etkilerini gorur.",
    tone: "Analitik, genis acili, sabirli.",
    strengths: "Gorunmeyen zincirleme etkileri ve paydaslari ortaya cikarir.",
    blindSpot: "Karmasikligi artirip karar ritmini yavaslatabilir.",
    chooseWhen: "Kararin aile, is, para ve kimlik gibi birden fazla alani etkiliyorsa.",
    icon: "point.3.connected.trianglepath.dotted",
    accent: "#445E91",
  },
  {
    id: "risk",
    name: "Risk Analisti",
    purpose: "En kotu senaryoyu, geri donus maliyetini ve guvenlik payini inceler.",
    tone: "Tedbirli, ciddi, ayrintili.",
    strengths: "Korunmasi gereken sinirlari ve zarar azaltma adimlarini bulur.",
    blindSpot: "Firsat tarafini fazla dusuk agirliklandirabilir.",
    chooseWhen: "Karar maddi, itibari veya iliskisel olarak yuksek risk tasiyorsa.",
    icon: "shield.lefthalf.filled",
    accent: "#293B36",
  },
];

export const archetypeById = Object.fromEntries(
  archetypes.map((archetype) => [archetype.id, archetype])
) as Record<ArchetypeId, Archetype>;
