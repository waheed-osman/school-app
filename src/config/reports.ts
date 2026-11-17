import { q, getJson, getSetting } from '../db';
import { leaveBalance } from '../services/leave';
import { money } from '../services/pdf';

export type Report = { id: string; title: string; columns: string[]; rows: () => Promise<any[][]>; footer?: (rows: any[][]) => any[][] };
const ymd = () => new Date().toISOString().slice(0, 10);
const sum = (rows: any[][], i: number) => rows.reduce((a, r) => a + (Number(String(r[i]).replace(/,/g, '')) || 0), 0);

export const REPORTS: Record<string, Report> = {
  daily_sign: { id: 'daily_sign', title: 'كشف التوقيع اليومي', columns: ['م', 'الاسم', 'التخصص', 'توقيع الحضور', 'توقيع الانصراف'],
    rows: async () => (await q(`SELECT name, specialty FROM employees WHERE status<>'منقطع' ORDER BY name`)).map((r, i) => [i + 1, r.name, r.specialty ?? '', '', '']) },
  register68: { id: 'register68', title: 'سجل الحضور والانصراف (68) — اليوم', columns: ['م', 'الاسم', 'الحالة', 'الحضور', 'الانصراف', 'تأخير (د)'],
    rows: async () => (await q(`SELECT e.name, a.status, a.in_time, a.out_time, a.late_minutes FROM attendance a JOIN employees e ON e.id=a.employee_id WHERE a.date=? ORDER BY e.name`, [ymd()])).map((r, i) => [i + 1, r.name, r.status, r.in_time ?? '', r.out_time ?? '', r.late_minutes]) },
  leave_balances: { id: 'leave_balances', title: 'أرصدة الإجازات', columns: ['الاسم', 'الاستحقاق', 'اعتيادية', 'عارضة', 'مرضية', 'المتبقي'],
    rows: async () => { const y = new Date().getFullYear(), out: any[][] = []; for (const e of await q('SELECT * FROM employees')) { const b = await leaveBalance(e, y); out.push([e.name, b.entitlement, b.usedAnnual, b.usedCasual, b.usedSick, b.annualLeft]); } return out; } },
  penalties_due: { id: 'penalties_due', title: 'الجزاءات ومواعيد المحو', columns: ['الموظف', 'الجزاء', 'التاريخ', 'تاريخ المحو'],
    rows: async () => (await q(`SELECT e.name, p.type, p.date, p.erase_date FROM penalties p JOIN employees e ON e.id=p.employee_id ORDER BY p.erase_date`)).map(r => [r.name, r.type, r.date, r.erase_date ?? '-']) },
  exempt_list: { id: 'exempt_list', title: 'حصر الفئات المعفاة من المصروفات', columns: ['م', 'الاسم', 'الصف', 'الفصل', 'فئة الإعفاء'],
    rows: async () => (await q(`SELECT name, grade, class_name, exempt_type FROM students WHERE exempt_type<>'' ORDER BY exempt_type, grade, name`)).map((r, i) => [i + 1, r.name, r.grade, r.class_name, r.exempt_type]) },
  arrears: { id: 'arrears', title: 'كشف المتأخرين عن سداد المصروفات', columns: ['م', 'الاسم', 'الصف', 'الفصل', 'المستحق', 'المسدد', 'المتبقي'],
    rows: async () => (await q(`SELECT name, grade, class_name, due_fee, paid FROM v_student_fees WHERE due_fee-paid>0 ORDER BY grade, class_name, name`)).map((r, i) => [i + 1, r.name, r.grade, r.class_name, money(r.due_fee), money(r.paid), money(r.due_fee - r.paid)]),
    footer: rows => [['', 'الإجمالي', '', '', '', '', money(sum(rows, 6))]] },
  stock_balance: { id: 'stock_balance', title: 'كشف أرصدة المخازن', columns: ['الكود', 'الصنف', 'النوع', 'الوحدة', 'الرصيد', 'القيمة'],
    rows: async () => (await q(`SELECT * FROM items ORDER BY kind, name`)).map(r => [r.code ?? '', r.name, r.kind, r.unit ?? '', r.qty, money(r.qty * r.unit_price)]) },
  annual_stocktake: { id: 'annual_stocktake', title: 'كشف الجرد السنوي', columns: ['م', 'الصنف', 'النوع', 'الدفتري', 'الفعلي', 'العجز/الزيادة'],
    rows: async () => (await q(`SELECT name, kind, qty FROM items ORDER BY name`)).map((r, i) => [i + 1, r.name, r.kind, r.qty, '', '']) },
  fees_month: { id: 'fees_month', title: 'كشف التحصيل — الشهر الحالي', columns: ['م', 'الطالب', 'رقم القسيمة', 'التاريخ', 'المبلغ'],
    rows: async () => (await q(`SELECT s.name, r.no, r.date, r.amount FROM receipts r JOIN students s ON s.id=r.student_id WHERE r.date LIKE ? ORDER BY r.date`, [ymd().slice(0, 7) + '-%'])).map((r, i) => [i + 1, r.name, r.no ?? '', r.date, money(r.amount)]),
    footer: rows => [['', 'الإجمالي', '', '', money(sum(rows, 4))]] },
  settlement: { id: 'settlement', title: 'كشف التسوية الشهرية', columns: ['البند', 'القيمة'],
    rows: async () => { const m = ymd().slice(0, 7) + '-%';
      const g = async (sql: string) => (await q(sql, [m]))[0].v ?? 0;
      const inc = await g(`SELECT SUM(amount) v FROM receipts WHERE date LIKE ?`), out = await g(`SELECT SUM(amount) v FROM payment_orders WHERE date LIKE ?`), adv = (await q(`SELECT SUM(amount-spent) v FROM advances`))[0].v ?? 0;
      return [['إجمالي التحصيل', money(inc)], ['إجمالي أوامر الدفع', money(out)], ['صافي الحركة', money(inc - out)], ['أرصدة السلف غير المسواة', money(adv)]]; } },
  support_dist: { id: 'support_dist', title: 'توزيع حصيلة مجموعات الدعم', columns: ['المجموعة', 'الإجمالي', 'الجهة', 'النسبة %', 'المبلغ'],
    rows: async () => { const split: any[] = await getJson('support_split', []); const out: any[][] = [];
      for (const g of await q(`SELECT g.name, COALESCE(SUM(s.paid),0) tot FROM support_groups g LEFT JOIN support_subs s ON s.group_id=g.id GROUP BY g.id`))
        for (const p of split) out.push([g.name, money(g.tot), p.label, p.pct, money(g.tot * p.pct / 100)]);
      return out; } },
};
void getSetting;
