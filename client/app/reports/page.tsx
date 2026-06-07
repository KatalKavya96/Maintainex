"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bot,
  Brain,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Link2,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Wand2
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Field, Input, Textarea } from "@/components/common/FormControls";
import { PageTitle } from "@/components/common/PageTitle";
import {
  askAiCoach,
  generateAiIssuePrContext,
  generateAiReviewNotes,
  getAiContributionPlan,
  getAiMaintainerMemory,
  getAiWeeklyReport
} from "@/lib/api";
import type { AiCoachResponse, AiContributionPlan, AiIssuePrContext, AiMaintainerMemory, AiReviewNotes, AiWeeklyReport } from "@/types/ai";

const quickQuestions = [
  "What should I work on today?",
  "Which repo am I neglecting?",
  "How did I perform this month?",
  "Am I improving as a maintainer?"
];

const metricCards = [
  ["PR reviews", "prReviewed"],
  ["PRs raised", "prRaised"],
  ["Issues raised", "issuesRaised"],
  ["PRs closed", "prClosed"],
  ["Issues closed", "issuesClosed"]
] as const;

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-line bg-white p-4 shadow-soft ${className}`}>{children}</section>;
}

function SectionHeader({ icon: Icon, title, eyebrow }: { icon: typeof Sparkles; title: string; eyebrow?: string }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-skyglass text-moss">
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          {eyebrow ? <p className="text-[11px] font-black uppercase tracking-[0.18em] text-moss">{eyebrow}</p> : null}
          <h2 className="text-base font-extrabold tracking-tight text-ink">{title}</h2>
        </div>
      </div>
    </div>
  );
}

function LoadingLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-line bg-skyglass px-3 py-3 text-sm font-semibold text-slate-500">
      <Loader2 className="animate-spin" size={16} />
      {label}
    </div>
  );
}

function EmptyLine({ label }: { label: string }) {
  return <div className="rounded-lg border border-dashed border-line bg-skyglass px-3 py-3 text-sm font-semibold text-slate-500">{label}</div>;
}

function formatDate(value?: string | null) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function comparisonCopy(changePercent: number | null, direction: string) {
  if (changePercent === null) return direction === "up" ? "new momentum" : "no baseline";
  if (changePercent === 0) return "steady";
  return `${changePercent > 0 ? "+" : ""}${changePercent}%`;
}

export default function ReportsPage() {
  const [report, setReport] = useState<AiWeeklyReport | null>(null);
  const [plan, setPlan] = useState<AiContributionPlan | null>(null);
  const [memory, setMemory] = useState<AiMaintainerMemory | null>(null);
  const [coach, setCoach] = useState<AiCoachResponse | null>(null);
  const [context, setContext] = useState<AiIssuePrContext | null>(null);
  const [review, setReview] = useState<AiReviewNotes | null>(null);
  const [question, setQuestion] = useState("What should I work on today?");
  const [contextUrl, setContextUrl] = useState("");
  const [roughNotes, setRoughNotes] = useState("");
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingCoach, setLoadingCoach] = useState(false);
  const [loadingContext, setLoadingContext] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);
  const [message, setMessage] = useState("");

  async function loadCoreData() {
    setLoadingInitial(true);
    setMessage("");
    try {
      const [nextReport, nextPlan, nextMemory] = await Promise.all([getAiWeeklyReport(), getAiContributionPlan(), getAiMaintainerMemory()]);
      setReport(nextReport);
      setPlan(nextPlan);
      setMemory(nextMemory);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load AI reports.");
    } finally {
      setLoadingInitial(false);
    }
  }

  useEffect(() => {
    loadCoreData();
  }, []);

  const maxMetric = useMemo(() => {
    if (!report) return 1;
    return Math.max(1, ...metricCards.map((item) => report.counts[item[1]]));
  }, [report]);

  async function submitCoach(nextQuestion = question) {
    setLoadingCoach(true);
    setMessage("");
    try {
      setQuestion(nextQuestion);
      setCoach(await askAiCoach(nextQuestion));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Coach could not answer right now.");
    } finally {
      setLoadingCoach(false);
    }
  }

  async function handleCoachSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitCoach();
  }

  async function handleContextSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingContext(true);
    setMessage("");
    try {
      setContext(await generateAiIssuePrContext(contextUrl));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not generate context for that URL.");
    } finally {
      setLoadingContext(false);
    }
  }

  async function handleReviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingReview(true);
    setMessage("");
    try {
      setReview(await generateAiReviewNotes(roughNotes));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not generate review notes.");
    } finally {
      setLoadingReview(false);
    }
  }

  return (
    <>
      <PageTitle
        title="AI Reports"
        description="Weekly summaries, planning, review notes, and maintainer memory generated from your Maintainex workspace."
        action={
          <Button variant="secondary" onClick={loadCoreData} disabled={loadingInitial}>
            <RefreshCw size={16} className={loadingInitial ? "animate-spin" : ""} />
            Refresh
          </Button>
        }
      />

      {message ? <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">{message}</div> : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
        <Card>
          <SectionHeader icon={Sparkles} title="Weekly AI report" eyebrow={report ? `${formatDate(report.period.start)} - ${formatDate(report.period.end)}` : "This week"} />
          {loadingInitial && !report ? (
            <LoadingLine label="Generating weekly summary..." />
          ) : report ? (
            <>
              <div className="rounded-lg border border-line bg-skyglass p-3">
                <p className="text-lg font-extrabold text-ink">{report.headline}</p>
                <div className="mt-2 space-y-1 text-sm font-semibold leading-5 text-slate-500">
                  {report.summary.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                {metricCards.map(([label, key]) => {
                  const value = report.counts[key];
                  return (
                    <div key={key} className="rounded-lg border border-line bg-white p-3">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
                      <p className="mt-2 text-2xl font-black text-moss">{value}</p>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-skyglass">
                        <div className="h-full rounded-full bg-moss transition-all duration-700" style={{ width: `${Math.max(5, (value / maxMetric) * 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-line bg-white p-3">
                  <p className="text-sm font-extrabold text-ink">Compared to last week</p>
                  <div className="mt-3 space-y-2">
                    {report.comparedToLastWeek.map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-slate-500">{item.label}</span>
                        <span className={`rounded-full px-2 py-1 text-xs font-black ${item.direction === "down" ? "bg-red-500/10 text-red-300" : item.direction === "up" ? "bg-moss/15 text-moss" : "bg-skyglass text-slate-500"}`}>
                          {comparisonCopy(item.changePercent, item.direction)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-line bg-white p-3">
                  <p className="text-sm font-extrabold text-ink">Suggested focus</p>
                  <div className="mt-3 space-y-2">
                    {report.suggestedFocus.map((item) => (
                      <div key={item} className="flex gap-2 text-sm font-semibold leading-5 text-slate-500">
                        <CheckCircle2 className="mt-0.5 shrink-0 text-moss" size={16} />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(report.effortTags.length ? report.effortTags : ["add tags for sharper insights"]).map((tag) => (
                  <span key={tag} className="rounded-full bg-skyglass px-2.5 py-1 text-xs font-black text-moss">
                    #{tag}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <EmptyLine label="No report data available yet." />
          )}
        </Card>

        <Card>
          <SectionHeader icon={Bot} title="AI progress coach" eyebrow="Ask your workspace" />
          <form onSubmit={handleCoachSubmit} className="space-y-3">
            <Field label="Question">
              <div className="flex gap-2">
                <Input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="What should I work on today?" />
                <Button type="submit" disabled={loadingCoach || question.trim().length < 3} className="shrink-0">
                  {loadingCoach ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  Ask
                </Button>
              </div>
            </Field>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {quickQuestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => submitCoach(item)}
                className="rounded-full border border-line bg-skyglass px-3 py-1.5 text-xs font-black text-slate-500 transition hover:border-moss hover:text-ink"
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-line bg-skyglass p-3">
            {loadingCoach ? (
              <LoadingLine label="Coach is reading your workspace..." />
            ) : coach ? (
              <>
                <p className="text-sm font-extrabold text-ink">{coach.answer}</p>
                <div className="mt-3 space-y-2">
                  {coach.bullets.map((item) => (
                    <p key={item} className="text-sm font-semibold leading-5 text-slate-500">
                      {item}
                    </p>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {coach.dataPoints.map((point) => (
                    <span key={point} className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-500">
                      {point}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm font-semibold leading-5 text-slate-500">Ask a question or use a quick prompt to get guidance from your current data.</p>
            )}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <SectionHeader icon={CalendarDays} title={plan?.title ?? "Contribution planner"} eyebrow="Next 5 days" />
          {loadingInitial && !plan ? (
            <LoadingLine label="Building your contribution plan..." />
          ) : plan ? (
            <>
              <p className="mb-3 text-sm font-semibold text-slate-500">{plan.summary}</p>
              <div className="grid gap-3 md:grid-cols-5">
                {plan.days.map((day) => (
                  <div key={day.date} className="rounded-lg border border-line bg-white p-3">
                    <p className="text-xs font-black uppercase tracking-wide text-moss">Day {day.day}</p>
                    <p className="mt-1 text-sm font-extrabold text-ink">{day.label}</p>
                    <div className="mt-3 space-y-2">
                      {day.actions.map((action) => (
                        <p key={action} className="text-xs font-semibold leading-5 text-slate-500">
                          {action}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-line bg-skyglass p-3">
                  <p className="text-sm font-extrabold text-ink">Goal signals</p>
                  <div className="mt-3 space-y-2">
                    {plan.sourceGoals.length ? (
                      plan.sourceGoals.map((goal) => (
                        <div key={goal.id}>
                          <div className="flex items-center justify-between gap-3 text-xs font-black text-slate-500">
                            <span className="truncate">{goal.title}</span>
                            <span>{goal.progress}/{goal.target}</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white">
                            <div className="h-full rounded-full bg-moss transition-all duration-700" style={{ width: `${goal.percent}%` }} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm font-semibold text-slate-500">No active goals yet.</p>
                    )}
                  </div>
                </div>
                <div className="rounded-lg border border-line bg-skyglass p-3">
                  <p className="text-sm font-extrabold text-ink">Urgent work</p>
                  <div className="mt-3 space-y-2">
                    {plan.urgentWork.length ? (
                      plan.urgentWork.map((work) => (
                        <div key={work.id} className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-500">
                          <span className="min-w-0 truncate">{work.title}</span>
                          <span className="shrink-0 text-xs font-black text-moss">{formatDate(work.dueDate)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm font-semibold text-slate-500">Nothing urgent is due soon.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <EmptyLine label="No plan available yet." />
          )}
        </Card>

        <Card>
          <SectionHeader icon={Link2} title="Issue/PR context generator" eyebrow="From a link" />
          <form onSubmit={handleContextSubmit} className="space-y-3">
            <Field label="GitHub PR or issue URL">
              <Input value={contextUrl} onChange={(event) => setContextUrl(event.target.value)} placeholder="https://github.com/org/repo/pull/123" />
            </Field>
            <Button type="submit" disabled={loadingContext || !contextUrl.trim()}>
              {loadingContext ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
              Generate context
            </Button>
          </form>
          {context ? (
            <div className="mt-4 rounded-lg border border-line bg-skyglass p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-ink">{context.title}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{context.organizationName}/{context.repositoryName} · {context.contextType}</p>
                </div>
                <a href={context.sourceUrl} target="_blank" rel="noreferrer" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-slate-500 transition hover:border-moss hover:text-ink">
                  <ArrowUpRight size={16} />
                </a>
              </div>
              <p className="mt-3 text-sm font-semibold leading-5 text-slate-500">{context.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {context.suggestedTags.map((tag) => (
                  <span key={tag} className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-moss">
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                {context.reviewChecklist.map((item) => (
                  <p key={item} className="flex gap-2 text-xs font-semibold leading-5 text-slate-500">
                    <ClipboardCheck className="mt-0.5 shrink-0 text-moss" size={14} />
                    {item}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </Card>

        <Card>
          <SectionHeader icon={FileText} title="Review notes generator" eyebrow="Polish rough notes" />
          <form onSubmit={handleReviewSubmit} className="space-y-3">
            <Field label="Rough notes">
              <Textarea value={roughNotes} onChange={(event) => setRoughNotes(event.target.value)} placeholder="border is not visible in dark mode" />
            </Field>
            <Button type="submit" disabled={loadingReview || roughNotes.trim().length < 3}>
              {loadingReview ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
              Generate notes
            </Button>
          </form>
          {review ? (
            <div className="mt-4 rounded-lg border border-line bg-skyglass p-3">
              <p className="text-sm font-extrabold text-ink">Professional review</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{review.professionalNote}</p>
              <div className="mt-3 space-y-2">
                {review.checklist.map((item) => (
                  <p key={item} className="flex gap-2 text-xs font-semibold leading-5 text-slate-500">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-moss" size={14} />
                    {item}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </Card>

        <Card className="xl:col-span-2">
          <SectionHeader icon={Brain} title="Maintainer memory" eyebrow="Repository context" />
          {loadingInitial && !memory ? (
            <LoadingLine label="Reading repository patterns..." />
          ) : memory?.repositories.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {memory.repositories.slice(0, 6).map((repo) => (
                <div key={repo.repo} className="rounded-lg border border-line bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-ink">{repo.repo}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">{repo.totalActivities} tracked activit{repo.totalActivities === 1 ? "y" : "ies"}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-skyglass px-2.5 py-1 text-xs font-black text-moss">{repo.lastActivityAt ? formatDate(repo.lastActivityAt) : "No date"}</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-5 text-slate-500">{repo.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {repo.focusAreas.map((area) => (
                      <span key={area} className="rounded-full bg-skyglass px-2.5 py-1 text-xs font-black text-slate-500">
                        {area}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {repo.commonReviewPattern.slice(0, 4).map((pattern) => (
                      <p key={pattern} className="text-xs font-semibold leading-5 text-slate-500">
                        {pattern}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyLine label="Log repository activity to build maintainer memory." />
          )}
        </Card>
      </div>
    </>
  );
}
