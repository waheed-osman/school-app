import React, { useEffect, useState } from 'react';
import { Text, ScrollView, View } from 'react-native';
import { Screen, Card, Btn, s } from '../ui';
import { REPORTS } from '../config/reports';
import { quickPdf } from '../services/pdf';

export default function Report({ route, navigation }: any) {
  const r = REPORTS[route.params.r]; navigation.setOptions({ title: r.title });
  const [rows, setRows] = useState<any[][]>([]);
  useEffect(() => { r.rows().then(setRows); }, []);
  const footer = r.footer?.(rows);
  return (<Screen>
    <Btn title="🖨 PDF (A4) — طباعة / واتساب" onPress={() => quickPdf({ title: r.title, columns: r.columns, rows, footerRows: footer })} />
    <ScrollView horizontal><View>
      <View style={[s.row, { backgroundColor: '#E8EFEC' }]}>{r.columns.map(c => <Text key={c} style={[s.t, { width: 110, padding: 6, fontWeight: '700' }]}>{c}</Text>)}</View>
      {rows.map((row, i) => <View key={i} style={s.row}>{row.map((c, j) => <Text key={j} style={[s.t, { width: 110, padding: 6 }]}>{String(c)}</Text>)}</View>)}
    </View></ScrollView>
    {!rows.length && <Card><Text style={s.m}>لا توجد بيانات</Text></Card>}
  </Screen>);
}
