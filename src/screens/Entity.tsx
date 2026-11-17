import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert, ScrollView, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Card, Btn, Input, Chips, RefPicker, s, C } from '../ui';
import { ENTITIES, Field } from '../config/entities';
import { q, run, audit, getSetting, getJson } from '../db';
import { quickPdf } from '../services/pdf';
import { isManager } from '../services/session';

export default function EntityScreen({ route, navigation }: any) {
  const e = ENTITIES[route.params.e];
  navigation.setOptions({ title: e.title });
  const refs = e.fields.filter(f => f.t === 'ref');
  const [rows, setRows] = useState<any[]>([]), [search, setSearch] = useState(''), [form, setForm] = useState<any | null>(null), [opts, setOpts] = useState<Record<string, string[]>>({});

  const load = useCallback(async () => {
    const joins = refs.map((f, i) => `LEFT JOIN ${f.ref!.table} r${i} ON r${i}.id=m.${f.k}`).join(' ');
    const sel = ['m.*', ...refs.map((f, i) => `r${i}.${f.ref!.label} AS ${f.k}__l`)].join(',');
    setRows(await q(`SELECT ${sel} FROM ${e.table} m ${joins} ORDER BY m.id DESC LIMIT 500`));
    const o: Record<string, string[]> = {};
    for (const f of e.fields) if (f.os === 'grades') o[f.k] = (await getSetting('grades')).split(',').map(x => x.trim());
    else if (f.os === 'penalty_types') o[f.k] = Object.keys(await getJson('penalty_erase_months', {}));
    setOpts(o);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, []));

  const show = (r: any, k: string) => { const f = e.fields.find(x => x.k === k)!; return f.t === 'ref' ? r[k + '__l'] : r[k]; };
  const filtered = rows.filter(r => !search || e.cols.some(c => String(show(r, c) ?? '').includes(search)));

  const save = async () => {
    try {
      const isNew = !form.id;
      for (const f of e.fields) if (f.req && !form[f.k]) throw new Error(`الحقل "${f.l}" مطلوب`);
      const old = isNew ? undefined : rows.find(r => r.id === form.id);
      const row = { ...form };
      if (e.beforeSave) await e.beforeSave(row, isNew, old);
      const keys = e.fields.map(f => f.k);
      let id = row.id;
      if (isNew) { const r = await run(`INSERT INTO ${e.table}(${keys.join(',')}) VALUES(${keys.map(() => '?').join(',')})`, keys.map(k => row[k] ?? null)); id = r.lastInsertRowId; }
      else await run(`UPDATE ${e.table} SET ${keys.map(k => k + '=?').join(',')} WHERE id=?`, [...keys.map(k => row[k] ?? null), id]);
      if (e.afterSave) await e.afterSave(row, id, isNew);
      await audit(isNew ? 'إضافة' : 'تعديل', e.table, id, JSON.stringify(row));
      setForm(null); load();
    } catch (err: any) { Alert.alert('تعذر الحفظ', err.message); }
  };
  const del = (r: any) => Alert.alert('حذف', 'تأكيد الحذف؟', [{ text: 'إلغاء' }, { text: 'حذف', style: 'destructive', onPress: async () => {
    try { await run(`DELETE FROM ${e.table} WHERE id=?`, [r.id]); if (e.afterDelete) await e.afterDelete(r); await audit('حذف', e.table, r.id, JSON.stringify(r)); load(); } catch (err: any) { Alert.alert('خطأ', err.message); } } }]);
  const printList = () => quickPdf({ title: e.title, columns: ['م', ...e.cols.map(c => e.fields.find(f => f.k === c)!.l)], rows: filtered.map((r, i) => [i + 1, ...e.cols.map(c => show(r, c) ?? '')]) });

  const input = (f: Field) => {
    const v = form[f.k], set = (x: any) => setForm({ ...form, [f.k]: x });
    if (f.t === 'ref') return <RefPicker key={f.k} label={f.l} table={f.ref!.table} labelCol={f.ref!.label} value={v} onChange={set} />;
    if (f.t === 'select') return <View key={f.k}><Text style={s.m}>{f.l}</Text><Chips options={f.o ?? opts[f.k] ?? []} value={v ?? ''} onChange={set} /></View>;
    return <Input key={f.k} label={f.l} value={v == null ? '' : String(v)} multiline={f.t === 'multiline'} keyboardType={f.t === 'number' ? 'decimal-pad' : 'default'} placeholder={f.t === 'date' ? 'YYYY-MM-DD' : ''}
      onChangeText={(t: string) => set(f.t === 'number' ? (t === '' ? null : Number(t.replace(',', '.')) || 0) : t)} />;
  };

  return (<View style={s.screen}>
    <View style={{ padding: 12 }}>
      <TextInput style={s.input} placeholder="بحث..." value={search} onChangeText={setSearch} />
      <View style={s.row}><View style={{ flex: 1 }}><Btn title="＋ إضافة" onPress={() => setForm({})} /></View><View style={{ width: 8 }} /><View style={{ flex: 1 }}><Btn title="🖨 طباعة القائمة PDF" outline onPress={printList} /></View></View>
    </View>
    <ScrollView contentContainerStyle={{ padding: 12, paddingTop: 0 }}>
      {filtered.map(r => (<Card key={r.id}>
        <TouchableOpacity disabled={e.noEdit} onPress={() => setForm({ ...r })}>
          {e.cols.map((c, i) => <Text key={c} style={i === 0 ? s.h : s.t}>{i > 0 ? e.fields.find(f => f.k === c)!.l + ': ' : ''}{String(show(r, c) ?? '-')}</Text>)}
        </TouchableOpacity>
        {(isManager() || !e.noEdit) && <TouchableOpacity onPress={() => del(r)}><Text style={{ color: C.danger, textAlign: 'left', marginTop: 4 }}>حذف</Text></TouchableOpacity>}
      </Card>))}
      {!filtered.length && <Text style={[s.m, { textAlign: 'center', marginTop: 30 }]}>لا توجد سجلات</Text>}
    </ScrollView>
    <Modal visible={!!form} animationType="slide" onRequestClose={() => setForm(null)}>
      <ScrollView style={s.screen} contentContainerStyle={{ padding: 14, paddingTop: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={s.h}>{form?.id ? 'تعديل' : 'إضافة'} — {e.title}</Text>
        {form && e.fields.map(input)}
        <Btn title="حفظ" onPress={save} /><Btn title="إلغاء" outline onPress={() => setForm(null)} />
      </ScrollView></Modal>
  </View>);
}
