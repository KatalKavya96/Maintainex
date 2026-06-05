export function SummaryList({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <section className="dcode-card rounded-2xl p-6 shadow-soft">
      <h3 className="mb-5 text-2xl font-black">{title}</h3>
      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.name}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium">{item.name}</span>
              <span className="text-slate-500">{item.value}</span>
            </div>
            <div className="h-2 rounded-full bg-skyglass">
              <div className="h-2 rounded-full bg-moss shadow-[0_0_18px_rgba(201,244,58,0.35)]" style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
