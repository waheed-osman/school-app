import React, { useEffect, useState } from 'react';
import { I18nManager, ActivityIndicator, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';
import { initDb } from './src/db';
import { C } from './src/ui';
import Login from './src/screens/Login'; import Home from './src/screens/Home'; import Module from './src/screens/Module'; import Entity from './src/screens/Entity';
import Leave from './src/screens/Leave'; import Forms from './src/screens/Forms'; import Report from './src/screens/Report'; import Textbooks from './src/screens/Textbooks';
import Payroll from './src/screens/Payroll'; import Production from './src/screens/Production'; import Settings from './src/screens/Settings';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }) });
const Stack = createNativeStackNavigator();
const T = (title: string) => ({ title });

export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => { (async () => {
    if (!I18nManager.isRTL) { I18nManager.allowRTL(true); I18nManager.forceRTL(true); try { await Updates.reloadAsync(); } catch {} }
    await initDb(); try { await Notifications.requestPermissionsAsync(); } catch {}
    setReady(true);
  })(); }, []);
  if (!ready) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" color={C.primary} /><Text style={{ textAlign: 'center', marginTop: 10 }}>جارٍ التهيئة... (قد يلزم إعادة فتح التطبيق مرة واحدة لتفعيل الاتجاه من اليمين)</Text></View>;
  return (<NavigationContainer>
    <StatusBar style="light" />
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: C.primary }, headerTintColor: '#fff', headerTitleAlign: 'center' }}>
      <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
      <Stack.Screen name="Home" component={Home} options={{ title: 'الرئيسية', headerBackVisible: false }} />
      <Stack.Screen name="Module" component={Module} /><Stack.Screen name="Entity" component={Entity} />
      <Stack.Screen name="Leave" component={Leave} options={T('محرك الإجازات')} /><Stack.Screen name="Forms" component={Forms} options={T('النماذج الرسمية')} />
      <Stack.Screen name="Report" component={Report} /><Stack.Screen name="Textbooks" component={Textbooks} options={T('تسليم الكتب المدرسية')} />
      <Stack.Screen name="Payroll" component={Payroll} options={T('الماهيات')} /><Stack.Screen name="Production" component={Production} options={T('الحساب الختامي')} />
      <Stack.Screen name="Settings" component={Settings} options={T('الإعدادات')} />
    </Stack.Navigator></NavigationContainer>);
}
