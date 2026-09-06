import Link from "next/link";
import { NeuroPathwayLogo } from "@/components/brand";
import { StatCard } from "@/components/stat-card";

const products = [
  "Safe Space wellbeing app",
  "AI Evidence Engine",
  "EHCP report generator",
  "Professional dashboard",
  "Adult support tracker",
  "Commissioner analytics",
];

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-12 px-6 py-8 lg:px-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <NeuroPathwayLogo />
        <nav className="flex gap-3 text-sm font-bold text-nhs-dark" aria-label="Primary navigation">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/safe-space">Safe Space</Link>
          <Link href="/reports">Reports</Link>
        </nav>
      </header>

      <section className="grid items-center gap-10 rounded-[2rem] bg-white p-8 shadow-soft lg:grid-cols-[1.2fr_0.8fr] lg:p-12">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.3em] text-nhs-blue">Created by Tanja Hanson</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
            AI-assisted early identification and lifelong support for neurodivergent people.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            NeuroPathway turns everyday observations from families, schools, health, and social care into structured evidence,
            timely risk insight, EHCP-ready reports, and compassionate Safe Space support.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link className="rounded-full bg-nhs-blue px-6 py-3 font-bold text-white" href="/dashboard">
              Open MVP dashboard
            </Link>
            <Link className="rounded-full bg-nhs-pale px-6 py-3 font-bold text-nhs-dark" href="/safe-space">
              Explore Safe Space
            </Link>
          </div>
        </div>
        <div className="grid gap-4">
          <StatCard label="Mission" value="Prevention" detail="Small Steps Create Big Change" />
          <StatCard label="Risk triage" value="Green / Amber / Red" detail="Evidence-led escalation" tone="amber" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <article key={product} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-nhs-dark">{product}</h2>
            <p className="mt-3 text-slate-600">Production module scaffolded for NHS-aligned, GDPR-conscious delivery.</p>
          </article>
        ))}
      </section>
    </main>
  );
}
