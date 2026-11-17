import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { q, getDb, audit } from '../db';

const tables = async () => (await q(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'android_%'`)).map(r => r.name as string);

export async function exportBackup() {
  const dump: Record<string, any[]> = {};
  for (const t of await tables()) dump[t] = await q(`SELECT * FROM ${t}`);
  const path = FileSystem.cacheDirectory + `school-backup-${new Date().toISOString().slice(0, 10)}.json`;
  await FileSystem.writeAsStringAsync(path, JSON.stringify({ v: 1, dump }));
  await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'حفظ النسخة الاحتياطية (ذاكرة الهاتف / Google Drive)' });
  await audit('backup-export', 'all', null);
}

export async function importBackup() {
  const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (res.canceled) return false;
  const { dump } = JSON.parse(await FileSystem.readAsStringAsync(res.assets[0].uri));
  const db = await getDb();
  const valid = await tables();
  await db.execAsync('PRAGMA foreign_keys = OFF;');
  await db.withTransactionAsync(async () => {
    for (const t of valid) {
      if (!dump[t]) continue;
      await db.runAsync(`DELETE FROM ${t}`);
      for (const row of dump[t]) {
        const cols = Object.keys(row);
        await db.runAsync(`INSERT INTO ${t}(${cols.join(',')}) VALUES(${cols.map(() => '?').join(',')})`, cols.map(c => row[c]));
      }
    }
  });
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await audit('backup-import', 'all', null);
  return true;
}
