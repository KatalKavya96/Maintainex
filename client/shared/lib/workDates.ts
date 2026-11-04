/** Work deadlines are calendar dates, not elapsed 24-hour periods. */
export function calendarDay(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86400000;
}
export function dueLabel(value?: string | null, status?: string, today = new Date()) {
  if (status === "DONE") return "Completed";
  if (status === "CANCELLED") return "Cancelled";
  if (!value) return "No due date";
  const current = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000;
  const days = calendarDay(value) - current;
  if (!Number.isFinite(days)) return "Invalid due date";
  if (days === 0) return "Due today";
  if (days > 0) return `Due in ${days} day${days === 1 ? "" : "s"}`;
  return `Overdue by ${Math.abs(days)} day${days === -1 ? "" : "s"}`;
}
