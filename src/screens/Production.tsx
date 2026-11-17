import React, { useState } from 'react';
import { Text } from 'react-native';
import { Screen, Card, Btn, RefPicker, s, C } from '../ui';
import { projectAccount, splitTotal } from '../services/profit';
import { quickPdf, money } from '../services/pdf';

export default function Production() {
  const [id, setId] = useState<number | null>(null), [acc, setAcc] = useState<any>(null);
  const pick = async (v: number) => { setId(v); setAcc(await projectAccount(v)); };
  const pdf = () => quickPdf({ title: `الحساب الختامي — مشروع ${acc.p.name}`, meta: [['المشرف', acc.p.sup], ['رأس المال', money(acc.p.capital)], ['من', acc.p.start_date], ['إلى', acc.p.end_date]],
    columns: ['التاريخ', 'النوع', 'المستند', 'البيان', 'المبلغ'], rows: acc.tx.map((t: any) => [t.date, t.kind, t.doc_no ?? '', t.description ?? '', money(t.amount)]),
    footerRows: [['', '', '', 'إجمالي الإيرادات', money(acc.revenue)], ['', '', '', 'إجمالي المصروفات', money(acc.expense)], ['', '', '', 'صافي الربح / (الخسارة)', money(acc.net)]], signatures: ['المشرف', 'المراجع', 'مدير المدرسة'] });
  const dist = () => quickPdf({ title: `استمارة توزيع الأرباح — ${acc.p.name}`, meta: [['صافي الربح', money(acc.net)]], columns: ['الجهة', 'النسبة %', 'المبلغ'],
    rows: acc.lines.map((l: any) => [l.label, l.pct, money(l.amount)]), footerRows: [['الإجمالي', splitTotal(acc.split), money(acc.lines.reduce((a: number, l: any) => a + l.amount, 0))]], signatures: ['المشرف', 'مدير الإدارة', 'مدير المدرسة'] });
  return (<Screen>
    <Card><RefPicker label="المشروع" table="projects" labelCol="name" value={id} onChange={pick} /></Card>
    {acc && <Card><Text style={s.h}>{acc.p.name}</Text><Text style={s.t}>الإيرادات {money(acc.revenue)} | المصروفات {money(acc.expense)}</Text>
      <Text style={[s.t, { fontWeight: '700', color: acc.net < 0 ? C.danger : C.primary }]}>الصافي {money(acc.net)}</Text>
      {splitTotal(acc.split) !== 100 && <Text style={{ color: C.danger, textAlign: 'right' }}>تنبيه: مجموع نسب التوزيع {splitTotal(acc.split)}% — اضبطها من الإعدادات وفق القرار الوزاري</Text>}
      {acc.lines.map((l: any) => <Text key={l.key} style={s.t}>• {l.label} ({l.pct}%): {money(l.amount)}</Text>)}
      <Btn title="🖨 الحساب الختامي PDF" onPress={pdf} />{acc.net > 0 && <Btn title="🖨 استمارة توزيع الأرباح PDF" outline onPress={dist} />}</Card>}
  </Screen>);
}
