import { q, one, getJson, getSetting } from '../db';

export async function monthlyTax(taxable: number) {
  const brackets: [number | null, number][] = await getJson('tax_brackets', []);
  const exempt = Number(await getSetting('tax_personal_exemption', '0'));
  const annual = Math.max(0, taxable * 12 - exempt);
  let prev = 0, tax = 0;
  for (const [limit, rate] of brackets) {
    const top = limit ?? Infinity;
    if (annual > prev) tax += (Math.min(annual, top) - prev) * rate / 100;
    prev = top; if (annual <= top) break;
  }
  return tax / 12;
}

export async function computeSlip(emp: any, month: string) { // month = YYYY-MM
  const insPct = Number(await getSetting('insurance_pct', '0'));
  const unionFee = Number(await getSetting('union_fee', '0'));
  const base = (emp.basic_salary || 0) + (emp.supp_salary || 0);
  const bonus = (await one(`SELECT COALESCE(SUM(amount),0) s FROM bonuses WHERE employee_id=? AND month=?`, [emp.id, month]))!.s;
  // ربط شؤون العاملين: الغياب بدون إذن والجزاءات تنعكس هنا مباشرة
  const absent = (await one(`SELECT COUNT(*) c FROM attendance WHERE employee_id=? AND status='غائب' AND date LIKE ?`, [emp.id, month + '-%']))!.c;
  const penDays = (await one(`SELECT COALESCE(SUM(deduction_days),0) s FROM penalties WHERE employee_id=? AND date LIKE ?`, [emp.id, month + '-%']))!.s;
  const gross = base + (emp.incentive || 0) + (emp.teacher_allowance || 0) + (emp.approval_allowance || 0) + bonus;
  const insurance = base * insPct / 100;
  const tax = await monthlyTax(gross - insurance);
  const union = emp.union_member === 'نعم' ? unionFee : 0;
  const absDed = absent * base / 30, penDed = penDays * base / 30;
  const net = gross - insurance - tax - union - absDed - penDed;
  const r = (n: number) => Math.round(n * 100) / 100;
  return { emp, month, base: r(base), incentive: emp.incentive || 0, teacher: emp.teacher_allowance || 0, approval: emp.approval_allowance || 0, bonus: r(bonus), gross: r(gross),
    insurance: r(insurance), tax: r(tax), union, absent, absDed: r(absDed), penDays, penDed: r(penDed), net: r(net) };
}
export async function computeAll(month: string) {
  const emps = await q(`SELECT * FROM employees WHERE status<>'منقطع'`);
  const out = []; for (const e of emps) out.push(await computeSlip(e, month)); return out;
}
