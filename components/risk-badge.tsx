import type { RiskLevel } from "@/types/domain";

const LABELS: Record<RiskLevel, string> = {
  green: "Low / Green",
  amber: "Moderate / Amber",
  red: "High / Red",
};

const CLASSES: Record<RiskLevel, string> = {
  green: "border-green-200 bg-green-50 text-safety-green",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  red: "border-red-200 bg-red-50 text-safety-red",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <span className={`rounded-full border px-3 py-1 text-sm font-bold ${CLASSES[level]}`}>{LABELS[level]}</span>;
}
