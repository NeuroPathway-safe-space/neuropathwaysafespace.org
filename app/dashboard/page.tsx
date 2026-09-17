import { RiskBadge } from "@/components/risk-badge";
import { StatCard } from "@/components/stat-card";
import { calculateRiskScore } from "@/lib/risk-scoring";
import type { Observation } from "@/types/domain";

const observations: Observation[] = [
  {
    id: "obs-001",
    childId: "child-001",
    category: "school_avoidance",
    narrative: "Became distressed before school and needed two hours of reassurance.",
    intensity: 4,
    occurredAt: new Date().toISOString(),
    sourceRole: "parent_carer",
  },
  {
    id: "obs-002",
    childId: "child-001",
    category: "sensory_processing",
    narrative: "Covered ears and left assembly due to noise sensitivity.",
    intensity: 3,
    occurredAt: new Date().toISOString(),
    sourceRole: "teacher_senco",
  },
];

export default function DashboardPage() {
  const risk = calculateRiskScore(observations);

  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:px-10">
      <div className="rounded-[2rem] bg-nhs-dark p-8 text-white shadow-soft">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-blue-100">Professional dashboard</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black">Unified child view</h1>
            <p className="mt-3 max-w-3xl text-blue-100">
              Bring together observations, Safe Space wellbeing logs, documents, tasks, and professional comments in one governed record.
            </p>
          </div>
          <RiskBadge level={risk.level} />
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Open observations" value="24" detail="8 added this week" />
        <StatCard label="Evidence readiness" value="72%" detail="EHCP pack in progress" tone="green" />
        <StatCard label="Current risk" value={`${risk.score}/100`} detail={risk.recommendedAction} tone={risk.level === "red" ? "red" : risk.level === "amber" ? "amber" : "green"} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <article className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="text-2xl font-black text-slate-950">Recent evidence timeline</h2>
          <div className="mt-5 grid gap-4">
            {observations.map((observation) => (
              <div key={observation.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-bold capitalize text-nhs-dark">{observation.category.replaceAll("_", " ")}</p>
                <p className="mt-2 text-slate-600">{observation.narrative}</p>
                <p className="mt-3 text-sm text-slate-500">Source: {observation.sourceRole.replaceAll("_", " ")}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="text-2xl font-black text-slate-950">AI pattern summary</h2>
          <ul className="mt-5 grid gap-3 text-slate-700">
            {risk.rationale.map((item) => (
              <li key={item} className="rounded-2xl bg-nhs-pale p-4">{item}</li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
