export function PageTitle({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-xl font-extrabold tracking-tight text-ink md:text-2xl">{title}</h2>
        <p className="mt-1 max-w-3xl text-sm font-semibold leading-5 text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}
