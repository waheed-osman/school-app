import { q, one, getJson } from '../db';
export type Split = { key: string; label: string; pct: number }[];
export const splitTotal = (s: Split) => s.reduce((a, b) => a + Number(b.pct || 0), 0);
export const distribute = (net: number, split: Split) => split.map(s => ({ ...s, amount: Math.round(net * Number(s.pct) ) / 100 }));

export async function projectAccount(projectId: number) {
  const p = await one(`SELECT p.*, e.name AS sup FROM projects p LEFT JOIN employees e ON e.id=p.supervisor_id WHERE p.id=?`, [projectId]);
  const tx = await q(`SELECT * FROM project_txns WHERE project_id=? ORDER BY date,id`, [projectId]);
  const revenue = tx.filter(t => t.kind === 'إيراد').reduce((a, t) => a + t.amount, 0);
  const expense = tx.filter(t => t.kind === 'مصروف').reduce((a, t) => a + t.amount, 0);
  const net = revenue - expense;
  const split: Split = await getJson('profit_split', []);
  return { p, tx, revenue, expense, net, split, lines: net > 0 ? distribute(net, split) : [] };
}
