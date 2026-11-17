import React, { useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Screen, Card, Btn, Input, s } from '../ui';
import { computeAll } from '../services/payroll';
import { quickPdf, money } from '../services/pdf';

export default function Payroll() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)), [slips, setSlips] = useState<any[]>([]);
  const calc = async () => setSlips(await computeAll(month));
  const slipPdf = (x: any) => quickPdf({ title: `مفردات مرتب شهر ${month}`, meta: [['الاسم', x.emp.name], ['الكود', x.emp.code], ['الدرجة', x.emp.grade], ['الرقم القومي', x.emp.national_id]],
    columns: ['البند', 'استحقاقات', 'استقطاعات'], rows: [
      ['الأجر الأساسي + المكمل', money(x.base), ''], ['الحوافز', money(x.incentive), ''], ['بدل المعلم', money(x.teacher), ''], ['بدل الاعتماد', money(x.approval), ''], ['مكافآت إضافية', money(x.bonus), ''],
      ['التأمينات والمعاشات', '', money(x.insurance)], ['ضريبة كسب العمل', '', money(x.tax)], ['اشتراك النقابة', '', money(x.union)],
      [`خصم غياب (${x.absent} يوم)`, '', money(x.absDed)], [`خصم جزاءات (${x.penDays} يوم)`, '', money(x.penDed)]],
    footerRows: [['الإجمالي', money(x.gross), money(x.insurance + x.tax + x.union + x.absDed + x.penDed)], ['صافي المستحق', money(x.net), '']], signatures: ['المراجع', 'مسؤول الماهيات', 'مدير المدرسة'] });
  const all = () => quickPdf({ title: `كشف المرتبات — شهر ${month}`, columns: ['م', 'الاسم', 'الإجمالي', 'تأمينات', 'ضريبة', 'نقابة', 'غياب+جزاءات', 'الصافي', 'التوقيع'],
    rows: slips.map((x, i) => [i + 1, x.emp.name, money(x.gross), money(x.insurance), money(x.tax), money(x.union), money(x.absDed + x.penDed), money(x.net), '']),
    footerRows: [['', 'الإجمالي', money(slips.reduce((a, x) => a + x.gross, 0)), '', '', '', '', money(slips.reduce((a, x) => a + x.net, 0)), '']] });
  return (<Screen>
    <Card><Input label="الشهر (YYYY-MM)" value={month} onChangeText={setMonth} /><Btn title="احتساب المرتبات" onPress={calc} />{slips.length > 0 && <Btn title="🖨 كشف المرتبات الشامل" outline onPress={all} />}</Card>
    {slips.map(x => (<TouchableOpacity key={x.emp.id} onPress={() => slipPdf(x)}><Card><Text style={s.h}>{x.emp.name}</Text>
      <Text style={s.t}>الإجمالي {money(x.gross)} | استقطاعات {money(x.insurance + x.tax + x.union + x.absDed + x.penDed)}</Text>
      <Text style={[s.t, { fontWeight: '700' }]}>الصافي {money(x.net)}  — اضغط لطباعة المفردات</Text></Card></TouchableOpacity>))}
  </Screen>);
}
