import React, { useEffect, useState } from 'react';
import { Text, Alert } from 'react-native';
import { Screen, Card, Btn, Input, Chips, RefPicker, s, C } from '../ui';
import { one, run, audit } from '../db';
import { validateLeave, leaveBalance } from '../services/leave';
import { quickPdf } from '../services/pdf';

export default function Leave() {
  const [empId, setEmpId] = useState<number | null>(null), [type, setType] = useState('عارضة'), [from, setFrom] = useState(''), [to, setTo] = useState(''), [note, setNote] = useState('');
  const [emp, setEmp] = useState<any>(null), [bal, setBal] = useState<any>(null), [errs, setErrs] = useState<string[]>([]);
  useEffect(() => { (async () => { if (!empId) return; const e = await one('SELECT * FROM employees WHERE id=?', [empId]); setEmp(e); setBal(await leaveBalance(e, new Date().getFullYear())); })(); }, [empId]);
  const submit = async (print: boolean) => {
    const v = await validateLeave(emp, type, from, to || from);
    setErrs(v.errors); if (!v.ok) return;
    const r = await run('INSERT INTO leaves(employee_id,type,from_date,to_date,days,note) VALUES(?,?,?,?,?,?)', [emp.id, type, from, to || from, v.days, note]);
    await audit('إجازة', 'leaves', r.lastInsertRowId, `${emp.name} ${type} ${v.days}`);
    setBal(await leaveBalance(emp, Number(from.slice(0, 4))));
    Alert.alert('تم', `تم تسجيل إجازة ${type} لمدة ${v.days} يوم`);
    if (print) await quickPdf({ title: 'استمارة طلب إجازة', meta: [['الاسم', emp.name], ['الوظيفة', emp.specialty], ['نوع الإجازة', type], ['من', from], ['إلى', to || from], ['عدد الأيام', v.days],
      ['رصيد الاعتيادية المتبقي', (v as any).bal.annualLeft - v.days]], paragraphs: [note], signatures: ['مقدم الطلب', 'شؤون العاملين', 'مدير المدرسة'] });
  };
  return (<Screen>
    <Card><RefPicker label="الموظف" table="employees" labelCol="name" value={empId} onChange={setEmpId} />
      {bal && <Text style={s.t}>الاستحقاق السنوي {bal.entitlement} | اعتيادية {bal.usedAnnual} | عارضة {bal.usedCasual}/7 | مرضية {bal.usedSick} | المتبقي {bal.annualLeft}</Text>}</Card>
    <Card><Text style={s.m}>نوع الإجازة</Text><Chips options={['اعتيادية', 'عارضة', 'مرضية', 'بدون أجر', 'أخرى']} value={type} onChange={setType} />
      <Input label="من (YYYY-MM-DD)" value={from} onChangeText={setFrom} /><Input label="إلى (YYYY-MM-DD)" value={to} onChangeText={setTo} /><Input label="ملاحظات" value={note} onChangeText={setNote} />
      {errs.map(e => <Text key={e} style={{ color: C.danger, textAlign: 'right' }}>• {e}</Text>)}
      <Btn title="حفظ" onPress={() => submit(false)} /><Btn title="حفظ وطباعة الاستمارة PDF" outline onPress={() => submit(true)} /></Card>
  </Screen>);
}
