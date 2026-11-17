import React, { useEffect, useState } from 'react';
import { Text, Alert } from 'react-native';
import * as LocalAuth from 'expo-local-authentication';
import { Screen, Card, Input, Btn, s, C } from '../ui';
import { one, sha } from '../db';
import { session } from '../services/session';

export default function Login({ navigation }: any) {
  const [user, setUser] = useState('admin'), [pin, setPin] = useState('');
  const enter = (u: any) => { session.user = { id: u.id, name: u.name, role: u.role }; navigation.replace('Home'); };
  const login = async () => {
    const u = await one('SELECT * FROM users WHERE username=? AND active=1', [user.trim()]);
    if (!u || u.pin_hash !== (await sha(pin))) return Alert.alert('خطأ', 'اسم المستخدم أو الرقم السري غير صحيح');
    enter(u);
  };
  const bio = async () => {
    const ok = await LocalAuth.hasHardwareAsync() && await LocalAuth.isEnrolledAsync();
    if (!ok) return Alert.alert('البصمة غير متاحة', 'فعّل بصمة الهاتف أو استخدم الرقم السري');
    const r = await LocalAuth.authenticateAsync({ promptMessage: 'الدخول بالبصمة' });
    if (!r.success) return;
    const u = await one('SELECT * FROM users WHERE username=? AND active=1', [user.trim()]);
    if (u) enter(u);
  };
  return (<Screen>
    <Text style={[s.h, { fontSize: 24, textAlign: 'center', marginTop: 60, color: C.primary }]}>نظام إدارة المدرسة</Text>
    <Card>
      <Input label="اسم المستخدم" value={user} onChangeText={setUser} autoCapitalize="none" />
      <Input label="الرقم السري" value={pin} onChangeText={setPin} secureTextEntry keyboardType="number-pad" />
      <Btn title="دخول" onPress={login} /><Btn title="الدخول بالبصمة (بعد إدخال اسم المستخدم)" outline onPress={bio} />
      <Text style={s.m}>أول تشغيل: المستخدم admin والرقم 1234 — غيّره فوراً من الإعدادات.</Text>
    </Card></Screen>);
}
