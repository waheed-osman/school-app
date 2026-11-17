import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { SCHEMA, DEFAULT_SETTINGS, SEED_LAWS } from './schema';
import { session } from '../services/session';

let db: SQLite.SQLiteDatabase;
export async function getDb() { if (!db) db = await SQLite.openDatabaseAsync('school.db'); return db; }
export const sha = (s: string) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, 'school::' + s);
export async function q<T = any>(sql: string, p: any[] = []): Promise<T[]> { return (await getDb()).getAllAsync<T>(sql, p); }
export async function one<T = any>(sql: string, p: any[] = []): Promise<T | null> { return (await getDb()).getFirstAsync<T>(sql, p); }
export async function run(sql: string, p: any[] = []) { return (await getDb()).runAsync(sql, p); }
export async function getSetting(k: string, d = ''): Promise<string> { const r = await one('SELECT value FROM settings WHERE key=?', [k]); return r ? r.value : d; }
export async function setSetting(k: string, v: any) { await run('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', [k, String(v)]); }
export async function getJson<T = any>(k: string, d: T): Promise<T> { try { return JSON.parse(await getSetting(k, '')) as T; } catch { return d; } }
export async function audit(action: string, tbl: string, rowId: number | null, detail = '') {
  await run('INSERT INTO audit_log(user_name,action,tbl,row_id,detail) VALUES(?,?,?,?,?)', [session.user?.name ?? '-', action, tbl, rowId, detail.slice(0, 500)]);
}
export async function initDb() {
  const d = await getDb();
  await d.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await d.execAsync(SCHEMA);
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) await run('INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)', [k, v]);
  if (!(await one('SELECT id FROM users LIMIT 1'))) await run('INSERT INTO users(name,username,pin_hash,role) VALUES(?,?,?,?)', ['مدير المدرسة', 'admin', await sha('1234'), 'manager']);
  if (!(await one('SELECT id FROM laws LIMIT 1'))) for (const l of SEED_LAWS) await run('INSERT INTO laws(title,number,body) VALUES(?,?,?)', l);
}
