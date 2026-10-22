import type { ReactNode } from "react";

export type Column<T> = { id: string; label: string; render: (row: T) => ReactNode; className?: string };
/** Native table semantics; page-specific data and actions stay with the owning feature. */
export function DataTable<T>({ label, rows, columns, rowKey }: { label: string; rows: T[]; columns: Column<T>[]; rowKey: (row: T) => string }) {
  return <div className="ds-table-scroll"><table className="ds-table"><caption className="sr-only">{label}</caption>
    <thead><tr>{columns.map((column) => <th scope="col" key={column.id}>{column.label}</th>)}</tr></thead>
    <tbody>{rows.map((row) => <tr key={rowKey(row)}>{columns.map((column) => <td key={column.id} className={column.className}>{column.render(row)}</td>)}</tr>)}</tbody>
  </table></div>;
}
