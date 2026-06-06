import Link from "next/link";

export default function ComingSoonPage({ searchParams }: { searchParams: { feature?: string } }) {
  const feature = searchParams.feature ? decodeURIComponent(searchParams.feature) : "This feature";

  return (
    <section className="mx-auto grid min-h-[60vh] max-w-2xl place-items-center">
      <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-soft">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-moss">Coming soon</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">{feature} is sprinting toward you.</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
          We know you are eager. Honestly, same. We are tying the laces, stretching the hamstrings, and catching up to your curiosity very soon.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="inline-flex h-10 items-center rounded-lg bg-moss px-4 text-sm font-bold text-black">Back home</Link>
          <Link href="/dashboard" className="inline-flex h-10 items-center rounded-lg border border-line bg-skyglass px-4 text-sm font-bold text-ink">Open dashboard</Link>
        </div>
      </div>
    </section>
  );
}
