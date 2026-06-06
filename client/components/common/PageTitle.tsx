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
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-ink md:text-3xl">{title}</h2>
        <p className="mt-1.5 max-w-4xl text-sm font-semibold leading-6 text-slate-500 md:text-base">{description}</p>
      </div>
      {action}
    </div>
  );
}
