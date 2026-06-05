export function SummaryList({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <section className="rounded-md border border-line bg-white p-5 shadow-soft">
      <h3 className="mb-4 text-lg font-bold">{title}</h3>
      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.name}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium">{item.name}</span>
              <span className="text-slate-500">{item.value}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-moss" style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
