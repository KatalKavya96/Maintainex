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
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-4xl font-black tracking-tight text-ink">{title}</h2>
        <p className="mt-2 max-w-4xl text-xl font-bold leading-8 text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}
