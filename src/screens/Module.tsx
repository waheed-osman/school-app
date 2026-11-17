import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Screen, s, C } from '../ui';
import { MODULES } from '../config/modules';

export default function Module({ route, navigation }: any) {
  const m = MODULES.find(x => x.id === route.params.id)!;
  navigation.setOptions({ title: m.title });
  return (<Screen>{m.items.map(i => (
    <TouchableOpacity key={i.t} style={[s.card, { borderRightWidth: 5, borderRightColor: m.color }]} onPress={() => navigation.navigate(i.screen, i.p)}>
      <Text style={[s.t, { fontWeight: '600' }]}>{i.t}</Text></TouchableOpacity>))}</Screen>);
}
