import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getSetting } from '../db';

export const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const money = (n: any) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const today = () => new Date().toISOString().slice(0, 10);

export type DocOpts = {
  title: string; subtitle?: string; meta?: [string, any][]; columns?: string[]; rows?: any[][];
  paragraphs?: string[]; footerRows?: any[][]; signatures?: string[]; images?: { label: string; src: string }[];
};

// ترويسة رسمية + A4 + خانات التوقيع والاعتماد
export async function buildDoc(o: DocOpts) {
  const school = await getSetting('school_name'), dir = await getSetting('directorate'), year = await getSetting('school_year');
  const sigs = o.signatures ?? ['المختص', 'المراجع', 'مدير المدرسة'];
  return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/>
<style>
@page{size:A4;margin:12mm}
body{font-family:Tahoma,Arial,sans-serif;direction:rtl;font-size:12.5px;color:#000}
.hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #000;padding-bottom:6px}
.hd div{line-height:1.7;font-weight:bold}.c{text-align:center}
h1{text-align:center;font-size:18px;margin:14px 0 4px;text-decoration:underline}
.sub{text-align:center;margin-bottom:8px}
.meta{display:flex;flex-wrap:wrap;margin:8px 0}.meta span{width:50%;padding:2px 0}
table{width:100%;border-collapse:collapse;margin-top:8px}
th,td{border:1px solid #000;padding:4px 5px;text-align:center}th{background:#e8e8e8}
p{line-height:2;text-align:justify}
.sig{display:flex;justify-content:space-around;margin-top:40px;text-align:center}
.sig div{min-width:90px}.sig i{display:block;margin-top:34px;border-top:1px dotted #000}
img.s{height:50px}
</style></head><body>
<div class="hd"><div>وزارة التربية والتعليم والتعليم الفني<br/>${esc(dir)}</div><div class="c">${esc(school)}<br/>العام الدراسي ${esc(year)}</div><div>التاريخ: ${today()}</div></div>
<h1>${esc(o.title)}</h1>${o.subtitle ? `<div class="sub">${esc(o.subtitle)}</div>` : ''}
${o.meta?.length ? `<div class="meta">${o.meta.map(([k, v]) => `<span><b>${esc(k)}:</b> ${esc(v)}</span>`).join('')}</div>` : ''}
${(o.paragraphs ?? []).map(p => `<p>${esc(p)}</p>`).join('')}
${o.columns ? `<table><thead><tr>${o.columns.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>
${(o.rows ?? []).map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}
${(o.footerRows ?? []).map(r => `<tr style="font-weight:bold;background:#f3f3f3">${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : ''}
${(o.images ?? []).map(i => `<div class="c">${esc(i.label)}<br/><img class="s" src="${i.src}"/></div>`).join('')}
<div class="sig">${sigs.map(s => `<div>${esc(s)}<i></i></div>`).join('')}</div>
</body></html>`;
}

export async function exportPdf(html: string) {
  const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'طباعة / مشاركة (واتساب)', UTI: 'com.adobe.pdf' });
  return uri;
}
export const printNow = (html: string) => Print.printAsync({ html });
export async function quickPdf(o: DocOpts) { return exportPdf(await buildDoc(o)); }
