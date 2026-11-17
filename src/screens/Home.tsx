import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Screen, Card, s, C } from '../ui';
import { MODULES } from '../config/modules';
import { getAlerts } from '../services/alerts';
import { getSetting } from '../db';
import { session, canAccess, ROLES } from '../services/session';

export default function Home({ navigation }: any) {
  const [school, setSchool] = useState(''), [year, setYear] = useState(''), [alerts, setAlerts] = useState<any[]>([]);
  useFocusEffect(useCallback(() => { (async () => {
    setSchool(await getSetting('school_name')); setYear(await getSetting('school_year'));
    const a = await getAlerts(); setAlerts(a);
    if (a.length) { try { await Notifications.scheduleNotificationAsync({ content: { title: 'تنبيهات المدرسة', body: `${a.length} تنبيه يحتاج متابعة` }, trigger: null }); } catch {} }
  })(); }, []));
  return (<Screen>
    <Card style={{ backgroundColor: C.primary }}>
      <Text style={[s.h, { color: '#fff', fontSize: 19 }]}>{school}</Text>
      <Text style={{ color: '#D7EFE8', textAlign: 'right' }}>العام الدراسي {year}</Text>
      <Text style={{ color: '#D7EFE8', textAlign: 'right' }}>{session.user?.name} — {ROLES[session.user!.role].label}</Text>
      <View style={[s.row, { marginTop: 8 }]}>
        <TouchableOpacity onPress={() => navigation.navigate('Entity', { e: 'laws' })} style={[s.chip, { backgroundColor: '#fff' }]}><Text>📚 القوانين واللوائح</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={[s.chip, { backgroundColor: '#fff' }]}><Text>⚙️ الإعدادات</Text></TouchableOpacity>
      </View></Card>
    {alerts.length > 0 && <Card style={{ borderColor: C.warn }}><Text style={s.h}>🔔 التنبيهات الذكية</Text>
      {alerts.slice(0, 6).map((a, i) => <Text key={i} style={[s.t, { color: a.level === 'danger' ? C.danger : C.text, marginBottom: 3 }]}>• {a.text}</Text>)}</Card>}
    <View style={[s.row, { justifyContent: 'space-between' }]}>
      {MODULES.map(m => (
        <TouchableOpacity key={m.id} disabled={!canAccess(m.id)} onPress={() => navigation.navigate('Module', { id: m.id })}
          style={{ width: '48.5%', backgroundColor: m.color, borderRadius: 14, padding: 16, marginBottom: 10, opacity: canAccess(m.id) ? 1 : 0.35, minHeight: 110, justifyContent: 'center' }}>
          <Text style={{ fontSize: 32, textAlign: 'center' }}>{m.icon}</Text>
          <Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center', marginTop: 6 }}>{m.title}</Text>
        </TouchableOpacity>))}
    </View></Screen>);
}
