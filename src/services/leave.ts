import { one, getSetting } from '../db';

const d = (s: string) => new Date(s + 'T00:00:00');
export const daysInclusive = (a: string, b: string) => Math.round((+d(b) - +d(a)) / 86400000) + 1;
const monthsBetween = (a: string, b: Date) => (b.getFullYear() - d(a).getFullYear()) * 12 + (b.getMonth() - d(a).getMonth());
const ageAt = (birth: string, on: Date) => (on.getFullYear() - d(birth).getFullYear()) - (on < new Date(on.getFullYear(), d(birth).getMonth(), d(birth).getDate()) ? 1 : 0);

// الاستحقاق السنوي للاعتيادية (قيم الاستحقاق من شاشة الإعدادات — قانون 81 لسنة 2016)
export async function annualEntitlement(emp: any, on: Date) {
  if (!emp.hire_date) return 0;
  const [f, a1, a10, a60] = await Promise.all(['annual_first', 'annual_after1', 'annual_after10_or_50', 'annual_60'].map(async k => Number(await getSetting(k, '0'))));
  const months = monthsBetween(emp.hire_date, on);
  const age = emp.birth_date ? ageAt(emp.birth_date, on) : 0;
  if (months < 6) return 0;
  if (age >= 60) return a60;
  if (months >= 120 || age >= 50) return a10;
  if (months >= 12) return a1;
  return f;
}

export async function leaveBalance(emp: any, year: number) {
  const ent = await annualEntitlement(emp, new Date(year, 11, 31));
  const sum = async (type: string) => (await one(`SELECT COALESCE(SUM(days),0) s FROM leaves WHERE employee_id=? AND type=? AND from_date LIKE ?`, [emp.id, type, `${year}-%`]))!.s as number;
  const usedAnnual = await sum('اعتيادية'), usedCasual = await sum('عارضة'), usedSick = await sum('مرضية');
  // العارضة تُخصم من رصيد الاعتيادية
  return { entitlement: ent, usedAnnual, usedCasual, usedSick, annualLeft: ent - usedAnnual - usedCasual, casualLeft: Number(await getSetting('casual_max_year', '7')) - usedCasual };
}

export async function validateLeave(emp: any, type: string, from: string, to: string) {
  const errors: string[] = [];
  if (!emp) return { ok: false, days: 0, errors: ['اختر الموظف'] };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return { ok: false, days: 0, errors: ['صيغة التاريخ YYYY-MM-DD'] };
  const days = daysInclusive(from, to);
  if (days < 1) errors.push('تاريخ النهاية قبل البداية');
  const bal = await leaveBalance(emp, Number(from.slice(0, 4)));
  if (type === 'عارضة') {
    const maxOnce = Number(await getSetting('casual_max_per_time', '2'));
    if (days > maxOnce) errors.push(`العارضة بحد أقصى ${maxOnce} يوم في المرة`);
    if (bal.usedCasual + days > Number(await getSetting('casual_max_year', '7'))) errors.push(`تجاوز الحد السنوي للعارضة (المتبقي ${bal.casualLeft})`);
  }
  if ((type === 'عارضة' || type === 'اعتيادية') && days > bal.annualLeft) errors.push(`الرصيد غير كافٍ (المتبقي ${bal.annualLeft} يوم)`);
  return { ok: errors.length === 0, days, errors, bal };
}
