import React, { useState } from 'react';
import { Screen, Card, Btn, Input, Chips, RefPicker, s } from '../ui';
import { one } from '../db';
import { FORMS, makeForm } from '../services/forms';
import { exportPdf, today } from '../services/pdf';
import { Alert } from 'react-native';

export default function Forms({ route }: any) {
  const kind: 'hr' | 'student' = route.params.kind, list = FORMS[kind];
  const [id, setId] = useState<number | null>(null), [form, setForm] = useState(list[0].id), [date, setDate] = useState(today()), [extra, setExtra] = useState('');
  const go = async () => {
    if (!id) return Alert.alert('اختر السجل');
    const r = await one(`SELECT * FROM ${kind === 'hr' ? 'employees' : 'students'} WHERE id=?`, [id]);
    await exportPdf(await makeForm(form, r, date, extra));
  };
  const f = list.find(x => x.id === form)!;
  return (<Screen><Card>
    <RefPicker label={kind === 'hr' ? 'الموظف' : 'الطالب'} table={kind === 'hr' ? 'employees' : 'students'} labelCol="name" value={id} onChange={setId} />
    <Chips options={list.map(x => x.title)} value={f.title} onChange={t => setForm(list.find(x => x.title === t)!.id)} />
    <Input label="التاريخ" value={date} onChangeText={setDate} /><Input label="تاريخ بداية الانقطاع / ملاحظات إضافية" value={extra} onChangeText={setExtra} />
    <Btn title="توليد PDF ومشاركة" onPress={go} /></Card></Screen>);
}
