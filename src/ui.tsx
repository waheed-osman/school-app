import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Modal, FlatList } from 'react-native';
import { q } from './db';

export const C = { primary: '#0B5D4B', bg: '#F3F6F5', card: '#FFFFFF', text: '#1B2B27', muted: '#6B7A75', danger: '#C0392B', warn: '#E69B00', border: '#DDE3E0' };
export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg }, pad: { padding: 14 },
  card: { backgroundColor: C.card, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  h: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 6, textAlign: 'right' },
  t: { fontSize: 14, color: C.text, textAlign: 'right' }, m: { fontSize: 12, color: C.muted, textAlign: 'right' },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 10, backgroundColor: '#fff', textAlign: 'right', marginBottom: 8, fontSize: 14 },
  btn: { backgroundColor: C.primary, borderRadius: 10, padding: 12, alignItems: 'center', marginVertical: 4 },
  btnT: { color: '#fff', fontWeight: '700', fontSize: 15 }, row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: C.border, marginEnd: 6, marginBottom: 6, backgroundColor: '#fff' },
});
export const Screen = ({ children }: any) => <ScrollView style={s.screen} contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">{children}</ScrollView>;
export const Card = ({ children, style }: any) => <View style={[s.card, style]}>{children}</View>;
export const Btn = ({ title, onPress, color = C.primary, outline }: any) => (
  <TouchableOpacity onPress={onPress} style={[s.btn, { backgroundColor: outline ? '#fff' : color, borderWidth: outline ? 1 : 0, borderColor: color }]}><Text style={[s.btnT, outline && { color }]}>{title}</Text></TouchableOpacity>);
export const Input = ({ label, ...p }: any) => (<View>{label ? <Text style={s.m}>{label}</Text> : null}<TextInput style={[s.input, p.multiline && { height: 90 }]} placeholderTextColor="#9AA6A1" {...p} /></View>);
export function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return <View style={s.row}>{options.map(o => (
    <TouchableOpacity key={o} onPress={() => onChange(o)} style={[s.chip, value === o && { backgroundColor: C.primary, borderColor: C.primary }]}><Text style={{ color: value === o ? '#fff' : C.text }}>{o || '— بدون —'}</Text></TouchableOpacity>))}</View>;
}
// منتقي سجل مرتبط (موظف / طالب / صنف ...)
export function RefPicker({ label, table, labelCol, value, onChange, where = '' }: any) {
  const [open, setOpen] = useState(false), [rows, setRows] = useState<any[]>([]), [search, setSearch] = useState(''), [name, setName] = useState('');
  useEffect(() => { if (value) q(`SELECT ${labelCol} AS l FROM ${table} WHERE id=?`, [value]).then(r => setName(r[0]?.l ?? '')); else setName(''); }, [value]);
  useEffect(() => { if (open) q(`SELECT id, ${labelCol} AS l FROM ${table} ${where} ORDER BY ${labelCol} LIMIT 500`).then(setRows); }, [open]);
  return (<View>
    {label ? <Text style={s.m}>{label}</Text> : null}
    <TouchableOpacity style={s.input} onPress={() => setOpen(true)}><Text style={{ textAlign: 'right', color: name ? C.text : '#9AA6A1' }}>{name || 'اضغط للاختيار'}</Text></TouchableOpacity>
    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
      <View style={[s.screen, { padding: 14, paddingTop: 40 }]}>
        <TextInput style={s.input} placeholder="بحث..." value={search} onChangeText={setSearch} />
        <FlatList data={rows.filter(r => String(r.l ?? '').includes(search))} keyExtractor={r => String(r.id)} renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => { onChange(item.id); setOpen(false); }}><Text style={s.t}>{item.l}</Text></TouchableOpacity>)} />
        <Btn title="إغلاق" outline onPress={() => setOpen(false)} />
      </View></Modal></View>);
}
