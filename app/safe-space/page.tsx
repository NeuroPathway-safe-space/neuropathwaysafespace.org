const moods = ["Calm", "Okay", "Worried", "Overloaded", "Unsafe"];
const tools = ["Box breathing", "Sensory break", "Trusted adult plan", "Grounding exercise", "Positive achievement"];

export default function SafeSpacePage() {
  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-6 py-8">
      <section className="rounded-[2rem] bg-white p-8 shadow-soft">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-nhs-blue">Safe Space app</p>
        <h1 className="mt-4 text-4xl font-black text-slate-950">How are you feeling today?</h1>
        <p className="mt-4 max-w-3xl text-slate-600">
          A child-centred wellbeing space for mood tracking, journaling, voice notes, coping tools, goals, rewards, and safety planning.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-5">
          {moods.map((mood) => (
            <button key={mood} className="rounded-2xl border border-slate-200 bg-nhs-pale px-4 py-5 font-black text-nhs-dark">
              {mood}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {tools.map((tool) => (
          <article key={tool} className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-nhs-dark">{tool}</h2>
            <p className="mt-3 text-slate-600">Accessible coping support with consent-aware sharing to parents and professionals.</p>
          </article>
        ))}
      </section>
    </main>
  );
}
