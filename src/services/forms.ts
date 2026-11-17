import { buildDoc } from './pdf';
import { getSetting } from '../db';

// نماذج رسمية جاهزة. kind: hr (مرجعها موظف) أو student (مرجعها طالب)
export const FORMS = {
  hr: [
    { id: 'absence_report', title: 'محضر إثبات حالة — انقطاع عن العمل' },
    { id: 'return_report', title: 'محضر إثبات حالة — عودة للعمل' },
    { id: 'clearance', title: 'إخلاء طرف' },
    { id: 'job_status', title: 'بيان حالة وظيفية' },
  ],
  student: [
    { id: 'enroll_cert', title: 'إفادة قيد' },
    { id: 'absence_warning', title: 'إنذار غياب / فصل' },
  ],
};

export async function makeForm(id: string, r: any, date: string, extra: string) {
  const school = await getSetting('school_name');
  const id1: [string, any][] = [['الاسم', r.name], ['الرقم القومي', r.national_id]];
  switch (id) {
    case 'absence_report': return buildDoc({ title: 'محضر إثبات حالة (انقطاع عن العمل)', meta: [...id1, ['الوظيفة', r.specialty], ['الدرجة', r.grade]],
      paragraphs: [`إنه في يوم ${date} حضرت لجنة من ${school} وتبين أن السيد/ة ${r.name} لم يحضر إلى مقر العمل منذ تاريخ ${extra || '........'} دون إذن أو إجازة معتمدة، وقد أُثبتت الحالة بهذا المحضر للعرض على السلطة المختصة لاتخاذ اللازم قانوناً.`], signatures: ['عضو', 'عضو', 'مدير المدرسة'] });
    case 'return_report': return buildDoc({ title: 'محضر إثبات حالة (عودة للعمل)', meta: id1,
      paragraphs: [`إنه في يوم ${date} حضر السيد/ة ${r.name} إلى مقر العمل بعد انقطاع منذ تاريخ ${extra || '........'}، وقد تم إثبات عودته/ا واستلامه/ا العمل.`], signatures: ['المعني', 'شؤون العاملين', 'مدير المدرسة'] });
    case 'clearance': return buildDoc({ title: 'إخلاء طرف', meta: [...id1, ['كود الموظف', r.code]],
      paragraphs: [`يُفيد ${school} بأن السيد/ة ${r.name} ليس عليه/ا أي عهد أو مستحقات لدى المدرسة (العهدة المخزنية / السلف / الكتب) حتى تاريخ ${date}. ${extra}`], signatures: ['أمين التوريدات', 'الشؤون المالية', 'مدير المدرسة'] });
    case 'job_status': return buildDoc({ title: 'بيان حالة وظيفية', meta: [...id1, ['الكود', r.code], ['تاريخ التعيين', r.hire_date], ['الدرجة المالية', r.grade], ['التخصص', r.specialty], ['الموقف من العمل', r.status]],
      paragraphs: [`يُعطى هذا البيان بناءً على طلبه/ا لتقديمه إلى من يهمه الأمر. ${extra}`], signatures: ['شؤون العاملين', 'مدير المدرسة'] });
    case 'enroll_cert': return buildDoc({ title: 'إفادة قيد', meta: [...id1, ['الصف', r.grade], ['الفصل', r.class_name], ['حالة القيد', r.enroll_status]],
      paragraphs: [`تُفيد ${school} بأن الطالب/ة ${r.name} مقيد/ة بالمدرسة بالصف ${r.grade} للعام الدراسي الحالي، وقد أُعطيت هذه الإفادة بناءً على طلبه/ا لتقديمها إلى من يهمه الأمر. ${extra}`], signatures: ['شؤون الطلبة', 'مدير المدرسة'] });
    default: return buildDoc({ title: 'إنذار غياب', meta: [...id1, ['الصف', r.grade], ['الفصل', r.class_name]],
      paragraphs: [`السيد/ ولي أمر الطالب/ة ${r.name}: نُحيطكم علماً بتكرار غياب الطالب/ة عن المدرسة، ونرجو سرعة الحضور لبيان أسباب الغياب، وإلا اتُّخذت الإجراءات القانونية المقررة. ${extra}`], signatures: ['شؤون الطلبة', 'ولي الأمر (استلمت)', 'مدير المدرسة'] });
  }
}
