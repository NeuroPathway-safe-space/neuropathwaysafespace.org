import { generateEhcpReportSections } from "@/lib/ehcp-report";

const sections = generateEhcpReportSections({
  childName: "Example child",
  strengths: ["Creative problem-solving", "Strong visual memory", "Kind relationship with trusted adults"],
  observations: [],
  riskScore: { level: "green", score: 20, rationale: [], recommendedAction: "Continue monitoring." },
});

export default function ReportsPage() {
  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-6 py-8">
      <header className="rounded-[2rem] bg-white p-8 shadow-soft">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-nhs-blue">EHCP report generator</p>
        <h1 className="mt-4 text-4xl font-black text-slate-950">Evidence packs ready for professional review.</h1>
      </header>
      {sections.map((section) => (
        <article key={section.heading} className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-nhs-dark">{section.heading}</h2>
          <p className="mt-3 leading-7 text-slate-600">{section.body}</p>
        </article>
      ))}
    </main>
  );
}
