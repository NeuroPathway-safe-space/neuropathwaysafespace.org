interface StatCardProps {
  label: string;
  value: string;
  detail: string;
  tone?: "blue" | "green" | "amber" | "red";
}

const toneClasses = {
  blue: "bg-nhs-pale text-nhs-dark",
  green: "bg-green-50 text-safety-green",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-safety-red",
};

export function StatCard({ label, value, detail, tone = "blue" }: StatCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-4xl font-black text-slate-950">{value}</p>
      <p className={`mt-4 rounded-2xl px-3 py-2 text-sm font-semibold ${toneClasses[tone]}`}>{detail}</p>
    </article>
  );
}
