import { q } from '../db';
export async function getAlerts() {
  const out: { level: 'warn' | 'danger'; text: string }[] = [];
  const y = new Date().getFullYear();
  for (const r of await q(`SELECT e.name, SUM(l.days) used FROM leaves l JOIN employees e ON e.id=l.employee_id WHERE l.type='عارضة' AND l.from_date LIKE ? GROUP BY e.id HAVING used>=6`, [`${y}-%`]))
    out.push({ level: 'warn', text: `${r.name}: اقترب رصيد العارضة من النفاد (${r.used}/7)` });
  const t = new Date().toISOString().slice(0, 10), t30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  for (const r of await q(`SELECT e.name, p.type, p.erase_date FROM penalties p JOIN employees e ON e.id=p.employee_id WHERE p.erase_date BETWEEN ? AND ?`, [t, t30]))
    out.push({ level: 'warn', text: `موعد محو جزاء (${r.type}) للموظف ${r.name} بتاريخ ${r.erase_date}` });
  const grades = await q(`SELECT g.grade, g.rec, COALESCE(d.del,0) del, COALESCE(s.cnt,0) cnt FROM (SELECT grade, SUM(received) rec FROM textbook_stock GROUP BY grade) g
    LEFT JOIN (SELECT grade, SUM(qty) del FROM textbook_deliveries GROUP BY grade) d ON d.grade=g.grade LEFT JOIN (SELECT grade, COUNT(*) cnt FROM students GROUP BY grade) s ON s.grade=g.grade`);
  for (const g of grades) if (g.rec < g.cnt) out.push({ level: 'danger', text: `عجز في كتب ${g.grade}: الوارد ${g.rec} أقل من عدد الطلاب ${g.cnt}` });
  const late = (await q(`SELECT COUNT(*) c FROM v_student_fees WHERE due_fee-paid>0`))[0].c;
  if (late > 0) out.push({ level: 'warn', text: `${late} طالب متأخر عن سداد المصروفات` });
  return out;
}
