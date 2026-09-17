export function NeuroPathwayLogo() {
  return (
    <div className="flex items-center gap-3" aria-label="NeuroPathway">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-nhs-blue text-lg font-black text-white shadow-soft">
        NP
      </div>
      <div>
        <p className="text-lg font-black tracking-tight text-nhs-dark">NeuroPathway</p>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Prevention Is the Cure</p>
      </div>
    </div>
  );
}
