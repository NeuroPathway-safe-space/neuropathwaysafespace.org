const categories = [
  "Emotional dysregulation",
  "Executive functioning",
  "Sensory issues",
  "Communication differences",
  "Sleep problems",
  "School avoidance",
  "Anxiety",
  "Self-harm risk",
];

export default function ObservationsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <section className="rounded-[2rem] bg-white p-8 shadow-soft">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-nhs-blue">Observation capture</p>
        <h1 className="mt-4 text-4xl font-black text-slate-950">Turn everyday moments into structured evidence.</h1>
        <form className="mt-8 grid gap-5" aria-label="Observation form scaffold">
          <label className="grid gap-2 font-bold text-slate-700">
            Category
            <select className="rounded-2xl border border-slate-300 p-3 font-normal">
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label className="grid gap-2 font-bold text-slate-700">
            What happened?
            <textarea className="min-h-36 rounded-2xl border border-slate-300 p-3 font-normal" placeholder="Describe the context, triggers, response, support provided, and outcome." />
          </label>
          <button className="w-fit rounded-full bg-nhs-blue px-6 py-3 font-bold text-white" type="button">Save draft observation</button>
        </form>
      </section>
    </main>
  );
}
