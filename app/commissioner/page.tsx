import { StatCard } from "@/components/stat-card";

export default function CommissionerPage() {
  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:px-10">
      <header className="rounded-[2rem] bg-white p-8 shadow-soft">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-nhs-blue">Commissioner analytics</p>
        <h1 className="mt-4 text-4xl font-black text-slate-950">Population insight without losing sight of families.</h1>
        <p className="mt-4 max-w-3xl text-slate-600">
          Aggregated waiting list insight, risk stratification, outcomes, service pressure, and cost-saving estimates for NHS Trusts, ICBs, local authorities, and schools.
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Waiting list" value="1,284" detail="23% high-priority" tone="amber" />
        <StatCard label="Early support" value="412" detail="Started this quarter" tone="green" />
        <StatCard label="Reports generated" value="186" detail="EHCP-ready packs" />
        <StatCard label="Estimated saving" value="£1.8m" detail="Modelled prevention value" tone="green" />
      </section>
    </main>
  );
}
