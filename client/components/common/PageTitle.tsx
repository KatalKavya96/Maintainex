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
        <h2 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">{title}</h2>
        <p className="mt-2 max-w-4xl text-base font-semibold leading-7 text-slate-500 md:text-lg">{description}</p>
      </div>
      {action}
    </div>
  );
}
