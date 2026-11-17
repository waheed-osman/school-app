import React, { useCallback, useState } from 'react';
import { Text, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Card, Btn, Input, Chips, s } from '../ui';
import { q, run, getSetting, setSetting, getJson, sha, audit } from '../db';
import { exportBackup, importBackup } from '../services/backup';
import { isManager, ROLES } from '../services/session';
import { ENTITIES } from '../config/entities';

const SIMPLE: [string, string][] = [['school_name', 'اسم المدرسة'], ['directorate', 'الإدارة / المديرية'], ['school_year', 'العام الدراسي'], ['grades', 'الصفوف (مفصولة بفاصلة)'], ['tuition_fee', 'قيمة المصروفات الدراسية'],
  ['annual_first', 'الاعتيادية — أول سنة (أيام)'], ['annual_after1', 'الاعتيادية — بعد سنة'], ['annual_after10_or_50', 'الاعتيادية — بعد 10 سنوات أو سن 50'], ['annual_60', 'الاعتيادية — فوق 60'],
  ['casual_max_year', 'حد العارضة السنوي'], ['casual_max_per_time', 'حد العارضة في المرة'], ['insurance_pct', 'نسبة التأمينات % (على الأساسي+المكمل)'], ['union_fee', 'اشتراك النقابة (شهري)'], ['tax_personal_exemption', 'الإعفاء الشخصي السنوي للضريبة']];
const JSONS: [string, string][] = [['tax_brackets', 'شرائح الضريبة السنوية [[الحد الأعلى, النسبة%]...]'], ['penalty_erase_months', 'أشهر محو الجزاءات {"نوع": شهور}']];
const SPLITS: [string, string][] = [['profit_split', 'نسب توزيع أرباح الوحدة المنتجة'], ['support_split', 'نسب توزيع مجموعات الدعم']];

export default function Settings({ navigation }: any) {
  const [v, setV] = useState<Record<string, string>>({}), [splits, setSplits] = useState<Record<string, any[]>>({}), [users, setUsers] = useState<any[]>([]), [nu, setNu] = useState<any>({ role: 'hr' }), [log, setLog] = useState<any[]>([]);
  const load = useCallback(async () => {
    const o: any = {}; for (const [k] of [...SIMPLE, ...JSONS]) o[k] = await getSetting(k); setV(o);
    const sp: any = {}; for (const [k] of SPLITS) sp[k] = await getJson(k, []); setSplits(sp);
    setUsers(await q('SELECT id,name,username,role,active FROM users')); setLog(await q('SELECT * FROM audit_log ORDER BY id DESC LIMIT 25'));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, []));
  if (!isManager()) return <Screen><Text style={s.t}>الإعدادات متاحة لمدير المدرسة فقط.</Text></Screen>;

  const save = async () => {
    try {
      for (const [k] of JSONS) JSON.parse(v[k]);
      for (const [k] of [...SIMPLE, ...JSONS]) await setSetting(k, v[k]);
      for (const [k] of SPLITS) await setSetting(k, JSON.stringify(splits[k]));
      await audit('تعديل إعدادات', 'settings', null); Alert.alert('تم الحفظ');
    } catch { Alert.alert('خطأ', 'صيغة JSON غير صحيحة'); }
  };
  const addUser = async () => {
    if (!nu.name || !nu.username || !nu.pin) return Alert.alert('أكمل البيانات');
    try { await run('INSERT INTO users(name,username,pin_hash,role) VALUES(?,?,?,?)', [nu.name, nu.username, await sha(nu.pin), nu.role]); setNu({ role: 'hr' }); load(); await audit('إضافة مستخدم', 'users', null, nu.username); }
    catch { Alert.alert('خطأ', 'اسم المستخدم مستخدم من قبل'); }
  };
  const changePin = async (u: any) => { if (!nu.pin) return Alert.alert('اكتب الرقم السري الجديد في خانة الرقم السري بالأسفل ثم اضغط على المستخدم'); await run('UPDATE users SET pin_hash=? WHERE id=?', [await sha(nu.pin), u.id]); Alert.alert('تم تغيير الرقم السري'); await audit('تغيير رقم سري', 'users', u.id); };

  return (<Screen>
    <Card><Text style={s.h}>القواعد والنسب (محرك القواعد المرن)</Text>
      {SIMPLE.map(([k, l]) => <Input key={k} label={l} value={v[k] ?? ''} onChangeText={(t: string) => setV({ ...v, [k]: t })} />)}
      {JSONS.map(([k, l]) => <Input key={k} label={l} value={v[k] ?? ''} multiline onChangeText={(t: string) => setV({ ...v, [k]: t })} />)}
      {SPLITS.map(([k, l]) => (<React.Fragment key={k}><Text style={s.h}>{l}</Text>
        {(splits[k] ?? []).map((r, i) => <Input key={r.key} label={r.label + ' %'} keyboardType="decimal-pad" value={String(r.pct)} onChangeText={(t: string) => { const c = [...splits[k]]; c[i] = { ...r, pct: Number(t) || 0 }; setSplits({ ...splits, [k]: c }); }} />)}
        <Text style={s.m}>المجموع: {(splits[k] ?? []).reduce((a, r) => a + Number(r.pct), 0)}%</Text></React.Fragment>))}
      <Btn title="حفظ الإعدادات" onPress={save} /></Card>
    <Card><Text style={s.h}>المستخدمون والصلاحيات</Text>
      {users.map(u => <Text key={u.id} style={s.t} onPress={() => changePin(u)}>• {u.name} ({u.username}) — {ROLES[u.role]?.label}</Text>)}
      <Input label="الاسم" value={nu.name ?? ''} onChangeText={(t: string) => setNu({ ...nu, name: t })} /><Input label="اسم المستخدم" autoCapitalize="none" value={nu.username ?? ''} onChangeText={(t: string) => setNu({ ...nu, username: t })} />
      <Input label="الرقم السري" secureTextEntry keyboardType="number-pad" value={nu.pin ?? ''} onChangeText={(t: string) => setNu({ ...nu, pin: t })} />
      <Chips options={Object.keys(ROLES).map(r => ROLES[r].label)} value={ROLES[nu.role].label} onChange={l => setNu({ ...nu, role: Object.keys(ROLES).find(r => ROLES[r].label === l) })} />
      <Btn title="إضافة مستخدم" onPress={addUser} /></Card>
    <Card><Text style={s.h}>النسخ الاحتياطي</Text>
      <Btn title="تصدير نسخة احتياطية (ذاكرة الهاتف / Google Drive)" onPress={exportBackup} />
      <Btn title="استيراد نسخة احتياطية (يستبدل البيانات الحالية)" outline onPress={() => Alert.alert('تأكيد', 'سيتم استبدال كل البيانات الحالية', [{ text: 'إلغاء' }, { text: 'استيراد', style: 'destructive', onPress: async () => { if (await importBackup()) { Alert.alert('تم الاستيراد'); load(); } } }])} /></Card>
    <Card><Text style={s.h}>سجل الحركات (آخر 25)</Text>{log.map(l => <Text key={l.id} style={s.m}>{l.ts} — {l.user_name}: {l.action} ({l.tbl})</Text>)}</Card>
  </Screen>);
}
void ENTITIES;
