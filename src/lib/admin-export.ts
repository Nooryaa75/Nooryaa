function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const cols = Array.from(rows.reduce((s, r) => { Object.keys(r).forEach((k) => s.add(k)); return s; }, new Set<string>()));
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [cols.map(escape).join(";")];
  for (const r of rows) lines.push(cols.map((c) => escape(cell(r[c]))).join(";"));
  return "\uFEFF" + lines.join("\n");
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printRows(title: string, rows: Record<string, unknown>[]) {
  const cols = rows.length
    ? Array.from(rows.reduce((s, r) => { Object.keys(r).forEach((k) => s.add(k)); return s; }, new Set<string>()))
    : [];
  const esc = (v: string) => v.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(title)}</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;padding:24px;color:#1f2033}
    h1{font-size:18px;margin:0 0 4px}
    p{color:#666;font-size:12px;margin:0 0 16px}
    table{border-collapse:collapse;width:100%;font-size:10px}
    th,td{border:1px solid #ddd;padding:4px 6px;text-align:left;vertical-align:top;word-break:break-word}
    th{background:#f4f4f8}
  </style></head><body>
  <h1>${esc(title)}</h1>
  <p>${rows.length} élément(s) — édité le ${new Date().toLocaleString("fr-FR")}</p>
  <table><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>
  <tbody>${rows
    .map((r) => `<tr>${cols.map((c) => `<td>${esc(cell(r[c])).slice(0, 400)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>
  <script>window.onload=()=>{window.print()}<\/script></body></html>`;
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  return true;
}
