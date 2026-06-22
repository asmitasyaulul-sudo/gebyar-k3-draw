import { useApp } from "@/lib/store";

export type Bilingual = { id: string; zh: string };
export type LangMode = "id" | "zh" | "both";

export type TextsMap = {
  safetyFirst: Bilingual;
  brand: Bilingual;
  gebyar: Bilingual;
  titleMain: Bilingual;
  titleHighlight: Bilingual;
  subtitle: Bilingual;
  statTotal: Bilingual;
  statRemaining: Bilingual;
  statWinners: Bilingual;
  statRound: Bilingual;
  winnersPerSpin: Bilingual;
  displayLabel: Bilingual;
  startDraw: Bilingual;
  nextDraw: Bilingual;
  drawing: Bilingual;
  resetRound: Bilingual;
  roundWinners: Bilingual; // use {round}
  celebrate: Bilingual;
  wheelWinner: Bilingual;
  wheelSpinning: Bilingual;
  wheelReady: Bilingual;
};

export const defaultTexts: TextsMap = {
  safetyFirst:    { id: "SAFETY FIRST",                 zh: "安全第一" },
  brand:          { id: "K3 NATIONAL MONTH 2026",       zh: "2026 国家职业健康安全月" },
  gebyar:         { id: "━━ GEBYAR ━━",                 zh: "━━ 盛典 ━━" },
  titleMain:      { id: "BULAN K3",                     zh: "职业健康安全月" },
  titleHighlight: { id: "NASIONAL",                     zh: "全国" },
  subtitle:       { id: "SAFETY LUCKY DRAW",            zh: "安全幸运抽奖" },
  statTotal:      { id: "Total Participants",           zh: "参与者总数" },
  statRemaining:  { id: "Remaining",                    zh: "剩余" },
  statWinners:    { id: "Total Winners",                zh: "中奖总数" },
  statRound:      { id: "Current Round",                zh: "当前轮次" },
  winnersPerSpin: { id: "Winners / spin",               zh: "每轮中奖人数" },
  displayLabel:   { id: "Display",                      zh: "显示" },
  startDraw:      { id: "START DRAW",                   zh: "开始抽奖" },
  nextDraw:       { id: "NEXT DRAW",                    zh: "下一轮抽奖" },
  drawing:        { id: "DRAWING…",                     zh: "抽奖中…" },
  resetRound:     { id: "Reset Round",                  zh: "重置本轮" },
  roundWinners:   { id: "ROUND {round} WINNERS",        zh: "第 {round} 轮中奖名单" },
  celebrate:      { id: "🎉 SELAMAT PARA PEMENANG",     zh: "🎉 恭喜各位中奖者" },
  wheelWinner:    { id: "WINNER",                       zh: "中奖" },
  wheelSpinning:  { id: "SPINNING…",                    zh: "旋转中…" },
  wheelReady:     { id: "READY",                        zh: "就绪" },
};

export function useLang(): LangMode {
  return useApp((s) => s.settings.language ?? "id");
}

export function useText(key: keyof TextsMap, vars?: Record<string, string | number>): { primary: string; secondary?: string } {
  const lang = useLang();
  const stored = useApp((s) => s.settings.texts?.[key]);
  const t = { ...defaultTexts[key], ...(stored ?? {}) } as Bilingual;
  const fill = (s: string) =>
    vars ? s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : s;
  if (lang === "zh") return { primary: fill(t.zh) };
  if (lang === "both") return { primary: fill(t.id), secondary: fill(t.zh) };
  return { primary: fill(t.id) };
}

type BTextProps = {
  k: keyof TextsMap;
  vars?: Record<string, string | number>;
  className?: string;
  secondaryClassName?: string;
  as?: keyof React.JSX.IntrinsicElements;
};

export function BText({ k, vars, className, secondaryClassName, as: Tag = "span" }: BTextProps) {
  const { primary, secondary } = useText(k, vars);
  return (
    <Tag className={className}>
      <span className="block">{primary}</span>
      {secondary && (
        <span className={secondaryClassName ?? "block text-[0.65em] font-normal opacity-85 mt-0.5"}>
          {secondary}
        </span>
      )}
    </Tag>
  );
}
