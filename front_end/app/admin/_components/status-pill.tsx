export function StatusPill({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <span
      className={
        active
          ? "inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700"
          : "inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600"
      }
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
