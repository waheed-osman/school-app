import { q, one, run, getJson, getSetting } from '../db';
import { daysInclusive } from '../services/leave';

export type Field = { k: string; l: string; t?: 'text' | 'number' | 'date' | 'select' | 'ref' | 'multiline'; o?: string[]; os?: string; ref?: { table: string; label: string }; req?: boolean };
export type Entity = { title: string; table: string; fields: Field[]; cols: string[]; noEdit?: boolean; beforeSave?: (row: any, isNew: boolean, old?: any) => Promise<void>; afterSave?: (row: any, id: number, isNew: boolean) => Promise<void>; afterDelete?: (row: any) => Promise<void> };

const emp: Field = { k: 'employee_id', l: 'الموظف', t: 'ref', ref: { table: 'employees', label: 'name' }, req: true };
const stu: Field = { k: 'student_id', l: 'الطالب', t: 'ref', ref: { table: 'students', label: 'name' }, req: true };
const item: Field = { k: 'item_id', l: 'الصنف', t: 'ref', ref: { table: 'items', label: 'name' }, req: true };
const date = (k = 'date', l = 'التاريخ'): Field => ({ k, l, t: 'date' });
const num = (k: string, l: string): Field => ({ k, l, t: 'number' });
const txt = (k: string, l: string, req = false): Field => ({ k, l, req });

const VTYPES = ['1 ع.ح إذن إضافة', '2 ع.ح إذن صرف', '118 ع.ح عهدة شخصية', '112 ع.ح شطب'];
const isAdd = (t: string) => t.startsWith('1 ');
async function applyVoucher(v: any, sign: 1 | -1) {
  const delta = (isAdd(v.type) ? 1 : -1) * sign * Number(v.qty);
  await run('UPDATE items SET qty = qty + ? WHERE id=?', [delta, v.item_id]);
}

export const ENTITIES: Record<string, Entity> = {
  employees: { title: 'قاعدة بيانات العاملين', table: 'employees', cols: ['name', 'code', 'grade', 'status'],
    fields: [txt('name', 'الاسم', true), txt('national_id', 'الرقم القومي'), txt('code', 'كود المعلم/الموظف'), date('hire_date', 'تاريخ التعيين'), date('birth_date', 'تاريخ الميلاد'), txt('grade', 'الدرجة المالية'), txt('specialty', 'التخصص'),
      { k: 'status', l: 'الموقف من العمل', t: 'select', o: ['على رأس العمل', 'إجازة', 'معار', 'منقطع', 'مأمورية'] },
      { k: 'union_member', l: 'عضو نقابة', t: 'select', o: ['نعم', 'لا'] },
      num('basic_salary', 'الأجر الأساسي'), num('supp_salary', 'الأجر المكمل'), num('incentive', 'الحوافز'), num('teacher_allowance', 'بدل المعلم'), num('approval_allowance', 'بدل الاعتماد')] },
  attendance: { title: 'سجل الحضور والانصراف (68)', table: 'attendance', cols: ['employee_id', 'date', 'status', 'late_minutes'],
    fields: [emp, date(), { k: 'status', l: 'الحالة', t: 'select', o: ['حاضر', 'غائب', 'إذن', 'مأمورية', 'إجازة'] }, txt('in_time', 'الحضور (HH:MM)'), txt('out_time', 'الانصراف (HH:MM)'), num('late_minutes', 'دقائق التأخير'), txt('note', 'ملاحظات')] },
  missions: { title: 'المأموريات وخطوط السير', table: 'missions', cols: ['employee_id', 'date', 'destination'], fields: [emp, date(), txt('destination', 'جهة المأمورية'), txt('purpose', 'الغرض'), txt('route', 'خط السير')] },
  leaves: { title: 'سجل الإجازات (للإضافة استخدم محرك الإجازات)', table: 'leaves', cols: ['employee_id', 'type', 'from_date', 'days'], noEdit: true,
    fields: [emp, txt('type', 'النوع'), date('from_date', 'من'), date('to_date', 'إلى'), num('days', 'الأيام')] },
  penalties: { title: 'الجزاءات', table: 'penalties', cols: ['employee_id', 'type', 'date', 'erase_date'],
    fields: [emp, date(), { k: 'type', l: 'نوع الجزاء', t: 'select', os: 'penalty_types' }, txt('reason', 'سبب الجزاء'), num('deduction_days', 'أيام الخصم من الأجر'), date('erase_date', 'تاريخ المحو (يُحسب تلقائياً إن تُرك فارغاً)')],
    beforeSave: async (row) => {
      if (!row.erase_date && row.date && row.type) {
        const m = (await getJson<Record<string, number>>('penalty_erase_months', {}))[row.type];
        if (m) { const d = new Date(row.date + 'T00:00:00'); d.setMonth(d.getMonth() + m); row.erase_date = d.toISOString().slice(0, 10); }
      }
    } },

  students: { title: 'سجلات القيد', table: 'students', cols: ['name', 'grade', 'class_name', 'exempt_type'],
    fields: [txt('name', 'اسم الطالب', true), txt('national_id', 'الرقم القومي'), { k: 'grade', l: 'الصف', t: 'select', os: 'grades' }, txt('class_name', 'الفصل'),
      { k: 'enroll_status', l: 'حالة القيد', t: 'select', o: ['مستجد', 'باقٍ للإعادة', 'منقول'] },
      { k: 'exempt_type', l: 'فئة الإعفاء', t: 'select', o: ['', 'يتيم', 'تكافل وكرامة', 'ابن عامل بالتربية والتعليم', 'بحث اجتماعي'] },
      num('fee', 'مصروفات خاصة (اتركها فارغة للقيمة العامة)'), txt('guardian_phone', 'هاتف ولي الأمر')] },
  absences: { title: 'غياب الطلبة', table: 'absences', cols: ['student_id', 'date', 'warning_no'], fields: [stu, date(), txt('reason', 'السبب'), num('warning_no', 'رقم الإنذار')] },
  transfers: { title: 'التحويلات', table: 'transfers', cols: ['student_id', 'direction', 'other_school', 'status'],
    fields: [{ ...stu, req: false }, { k: 'direction', l: 'الاتجاه', t: 'select', o: ['من المدرسة', 'إلى المدرسة'] }, txt('other_school', 'المدرسة الأخرى'), date(), { k: 'status', l: 'الحالة', t: 'select', o: ['قيد الإجراء', 'تم', 'مرفوض'] }, txt('note', 'ملاحظات')] },

  items: { title: 'الأصناف والعهد', table: 'items', cols: ['name', 'kind', 'qty', 'unit'],
    fields: [txt('code', 'الكود'), txt('name', 'اسم الصنف', true), { k: 'kind', l: 'النوع', t: 'select', o: ['مستديم', 'مستهلك'] }, txt('unit', 'الوحدة'), num('qty', 'الرصيد الافتتاحي'), num('unit_price', 'سعر الوحدة'), txt('location', 'المكان')] },
  vouchers: { title: 'الدفاتر المخزنية (1، 2، 118، 112 ع.ح)', table: 'vouchers', cols: ['type', 'no', 'item_id', 'qty'], noEdit: true,
    fields: [{ k: 'type', l: 'نوع الدفتر', t: 'select', o: VTYPES, req: true }, txt('no', 'رقم الإذن'), date(), item, { ...num('qty', 'الكمية'), req: true }, txt('party', 'الجهة / المستلم'), txt('note', 'ملاحظات')],
    beforeSave: async (v) => {
      if (!isAdd(v.type)) { const it = await one('SELECT qty,name FROM items WHERE id=?', [v.item_id]); if (!it || it.qty < Number(v.qty)) throw new Error(`الرصيد غير كافٍ (${it?.qty ?? 0})`); }
    },
    afterSave: async (v) => applyVoucher(v, 1), afterDelete: async (v) => applyVoucher(v, -1) },
  stock_docs: { title: 'محاضر الفحص والجرد والتكهين', table: 'stock_docs', cols: ['kind', 'item_id', 'qty', 'date'],
    fields: [{ k: 'kind', l: 'النوع', t: 'select', o: ['فحص واستلام', 'جرد سنوي', 'تكهين'] }, date(), { ...item, req: false }, num('qty', 'الكمية'), txt('committee', 'أعضاء اللجنة'), txt('note', 'ملاحظات')] },

  receipts: { title: 'قسائم التحصيل (123 ت.ع)', table: 'receipts', cols: ['student_id', 'no', 'date', 'amount'], fields: [stu, txt('no', 'رقم القسيمة'), date(), { ...num('amount', 'المبلغ'), req: true }, txt('term', 'الفصل الدراسي'), txt('note', 'ملاحظات')] },
  advances: { title: 'السلف', table: 'advances', cols: ['kind', 'date', 'amount', 'spent'], fields: [{ k: 'kind', l: 'النوع', t: 'select', o: ['مستديمة', 'مؤقتة'] }, date(), num('amount', 'المبلغ'), num('spent', 'المنصرف'), txt('purpose', 'الغرض'), txt('note', 'ملاحظات')] },
  payment_orders: { title: 'أوامر الدفع', table: 'payment_orders', cols: ['no', 'date', 'beneficiary', 'amount'], fields: [txt('no', 'رقم الأمر'), date(), txt('beneficiary', 'المستفيد'), txt('clause', 'البند'), num('amount', 'المبلغ'), txt('note', 'ملاحظات')] },
  support_groups: { title: 'مجموعات الدعم', table: 'support_groups', cols: ['name', 'subject', 'teacher_id', 'fee'],
    fields: [txt('name', 'اسم المجموعة', true), txt('subject', 'المادة'), { k: 'teacher_id', l: 'المعلم', t: 'ref', ref: { table: 'employees', label: 'name' } }, num('fee', 'الاشتراك'), txt('term', 'الفصل')] },
  support_subs: { title: 'اشتراكات الدعم', table: 'support_subs', cols: ['group_id', 'student_id', 'paid'],
    fields: [{ k: 'group_id', l: 'المجموعة', t: 'ref', ref: { table: 'support_groups', label: 'name' }, req: true }, stu, date(), num('paid', 'المسدد')] },

  bonuses: { title: 'المكافآت الإضافية', table: 'bonuses', cols: ['employee_id', 'month', 'kind', 'amount'],
    fields: [emp, txt('month', 'الشهر (YYYY-MM)', true), { k: 'kind', l: 'النوع', t: 'select', o: ['مكافأة امتحانات', 'نوبتجية', 'حصص زائدة'] }, num('qty', 'العدد'), num('rate', 'فئة الوحدة')],
    beforeSave: async (r) => { r.amount = Number(r.qty || 0) * Number(r.rate || 0); } },

  projects: { title: 'المشروعات', table: 'projects', cols: ['name', 'supervisor_id', 'capital', 'status'],
    fields: [txt('name', 'اسم المشروع', true), { k: 'supervisor_id', l: 'المشرف', t: 'ref', ref: { table: 'employees', label: 'name' } }, num('capital', 'رأس المال المبدئي'), date('start_date', 'تاريخ البدء'), date('end_date', 'تاريخ الانتهاء'), { k: 'status', l: 'الحالة', t: 'select', o: ['جاري', 'منتهي'] }] },
  project_txns: { title: 'إيرادات ومصروفات المشروعات', table: 'project_txns', cols: ['project_id', 'kind', 'date', 'amount'],
    fields: [{ k: 'project_id', l: 'المشروع', t: 'ref', ref: { table: 'projects', label: 'name' }, req: true }, date(), { k: 'kind', l: 'النوع', t: 'select', o: ['مصروف', 'إيراد'], req: true }, txt('doc_no', 'رقم الفاتورة/المستند'), txt('description', 'البيان'), { ...num('amount', 'المبلغ'), req: true }] },

  laws: { title: 'مكتبة القوانين واللوائح', table: 'laws', cols: ['title', 'number'], fields: [txt('title', 'العنوان', true), txt('number', 'الرقم / السنة'), { k: 'body', l: 'النص / الملخص', t: 'multiline' }] },
};
void daysInclusive; void q; void getSetting;
