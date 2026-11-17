import React, { useCallback, useState } from 'react';
import { View, Text, Modal, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Signature from 'react-native-signature-canvas';
import { Screen, Card, Btn, Input, Chips, RefPicker, s, C } from '../ui';
import { q, one, run, audit, getSetting } from '../db';
import { quickPdf, today } from '../services/pdf';
import { session } from '../services/session';

type Mode = null | 'in' | 'student' | 'class';
export default function Textbooks() {
  const [grades, setGrades] = useState<string[]>([]), [sum, setSum] = useState<any[]>([]), [mode, setMode] = useState<Mode>(null);
  const [grade, setGrade] = useState(''), [qty, setQty] = useState('1'), [stuId, setStuId] = useState<number | null>(null), [cls, setCls] = useState(''), [receiver, setReceiver] = useState(''), [vno, setVno] = useState(''), [sigOpen, setSigOpen] = useState(false);

  const load = useCallback(async () => {
    const g = (await getSetting('grades')).split(',').map(x => x.trim()); setGrades(g); if (!grade) setGrade(g[0]);
    const out = [];
    for (const name of g) {
      const rec = (await one(`SELECT COALESCE(SUM(received),0) v FROM textbook_stock WHERE grade=?`, [name]))!.v;
      const del = (await one(`SELECT COALESCE(SUM(qty),0) v FROM textbook_deliveries WHERE grade=?`, [name]))!.v;
      const cnt = (await one(`SELECT COUNT(*) v FROM students WHERE grade=?`, [name]))!.v;
      out.push({ grade: name, rec, del, bal: rec - del, cnt, diff: rec - cnt }); // الفرق: سالب = عجز، موجب = زيادة
    }
    setSum(out);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, []));

  const addIn = async () => {
    await run('INSERT INTO textbook_stock(grade,date,received) VALUES(?,?,?)', [grade, today(), Number(qty)]); await audit('وارد كتب', 'textbook_stock', null, `${grade} ${qty}`);
    setMode(null); load();
  };
  const deliverStudent = async () => {
    if (!stuId) return Alert.alert('اختر الطالب');
    const st = await one('SELECT * FROM v_student_fees WHERE id=?', [stuId]);
    const cleared = st.exempt_type || st.due_fee - st.paid <= 0;
    if (!cleared) return Alert.alert('لا يمكن التسليم', `الطالب عليه متبقي ${st.due_fee - st.paid} جنيه ولم يُعفَ من المصروفات`);
    if ((await one('SELECT id FROM textbook_deliveries WHERE student_id=?', [stuId]))) return Alert.alert('تنبيه', 'سبق تسليم هذا الطالب');
    const g = st.grade, bal = sum.find(x => x.grade === g)?.bal ?? 0;
    if (bal < Number(qty)) return Alert.alert('رصيد غير كافٍ', `رصيد كتب ${g}: ${bal}`);
    await run('INSERT INTO textbook_deliveries(date,kind,student_id,grade,class_name,qty,user_name) VALUES(?,?,?,?,?,?,?)', [today(), 'طالب', stuId, g, st.class_name, Number(qty), session.user?.name]);
    await audit('تسليم كتب', 'textbook_deliveries', null, `${st.name}`); setMode(null); setStuId(null); load();
  };
  const deliverClass = async (sig: string) => {
    setSigOpen(false);
    const bal = sum.find(x => x.grade === grade)?.bal ?? 0;
    if (bal < Number(qty)) return Alert.alert('رصيد غير كافٍ', `رصيد كتب ${grade}: ${bal}`);
    await run('INSERT INTO textbook_deliveries(date,kind,grade,class_name,qty,voucher_no,receiver,signature,user_name) VALUES(?,?,?,?,?,?,?,?,?)', [today(), 'رائد فصل', grade, cls, Number(qty), vno, receiver, sig, session.user?.name]);
    await audit('تسليم عهدة كتب (2 ع.ح)', 'textbook_deliveries', null, `${grade} ${cls} ${qty}`);
    await quickPdf({ title: 'إذن صرف عهدة كتب مدرسية (2 ع.ح)', meta: [['الصف', grade], ['الفصل', cls], ['عدد الحزم/الكتب', qty], ['رقم الإذن', vno], ['المستلم (رائد الفصل)', receiver]], images: [{ label: 'توقيع المستلم', src: sig }], signatures: ['أمين التوريدات', 'مدير المدرسة'] });
    setMode(null); load();
  };
  const printSheet = async () => {
    const rows = await q(`SELECT d.date, d.kind, COALESCE(s.name, d.receiver) who, d.grade, d.class_name, d.qty FROM textbook_deliveries d LEFT JOIN students s ON s.id=d.student_id ORDER BY d.grade, d.class_name, d.id`);
    await quickPdf({ title: 'كشف استلام الكتب المدرسية', columns: ['م', 'المستلم', 'النوع', 'الصف', 'الفصل', 'العدد', 'التاريخ', 'التوقيع'], rows: rows.map((r, i) => [i + 1, r.who, r.kind, r.grade, r.class_name ?? '', r.qty, r.date, '']),
      footerRows: [['', 'الإجمالي', '', '', '', rows.reduce((a, r) => a + r.qty, 0), '', '']] });
  };

  return (<Screen>
    {sum.map(x => (<Card key={x.grade}><Text style={s.h}>{x.grade}</Text>
      <Text style={s.t}>الوارد {x.rec} | المسلّم {x.del} | الرصيد {x.bal}</Text>
      <Text style={s.t}>عدد الطلاب {x.cnt}</Text>
      <Text style={[s.t, { fontWeight: '700', color: x.diff < 0 ? C.danger : C.primary }]}>{x.diff < 0 ? `عجز ${-x.diff}` : x.diff > 0 ? `زيادة ${x.diff}` : 'متطابق'}</Text></Card>))}
    <Btn title="＋ تسجيل وارد من مخازن الإدارة" onPress={() => setMode('in')} />
    <Btn title="تسليم فردي لطالب" onPress={() => setMode('student')} />
    <Btn title="تسليم عهدة لرائد فصل (2 ع.ح + توقيع)" onPress={() => setMode('class')} />
    <Btn title="🖨 كشف الاستلام PDF" outline onPress={printSheet} />
    <Modal visible={!!mode} animationType="slide" onRequestClose={() => setMode(null)}>
      <Screen><View style={{ height: 30 }} />
        {mode !== 'student' && <><Text style={s.m}>الصف</Text><Chips options={grades} value={grade} onChange={setGrade} /></>}
        {mode === 'student' && <RefPicker label="الطالب" table="students" labelCol="name" value={stuId} onChange={setStuId} />}
        <Input label="العدد" value={qty} onChangeText={setQty} keyboardType="number-pad" />
        {mode === 'class' && <><Input label="الفصل" value={cls} onChangeText={setCls} /><Input label="رائد الفصل (المستلم)" value={receiver} onChangeText={setReceiver} /><Input label="رقم إذن الصرف" value={vno} onChangeText={setVno} /></>}
        <Btn title={mode === 'class' ? 'التوقيع والحفظ' : 'حفظ'} onPress={() => mode === 'in' ? addIn() : mode === 'student' ? deliverStudent() : setSigOpen(true)} />
        <Btn title="إلغاء" outline onPress={() => setMode(null)} />
      </Screen>
      <Modal visible={sigOpen} onRequestClose={() => setSigOpen(false)}><View style={{ flex: 1 }}>
        <Signature onOK={deliverClass} onEmpty={() => Alert.alert('الرجاء التوقيع')} descriptionText="وقّع بإصبعك" clearText="مسح" confirmText="اعتماد" /></View></Modal>
    </Modal></Screen>);
}
