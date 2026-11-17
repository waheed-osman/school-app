export type MItem = { t: string; screen: string; p?: any };
export const MODULES: { id: string; title: string; icon: string; color: string; items: MItem[] }[] = [
  { id: 'hr', title: 'شؤون العاملين', icon: '👥', color: '#2E7D32', items: [
    { t: 'قاعدة بيانات العاملين', screen: 'Entity', p: { e: 'employees' } }, { t: 'الحضور والانصراف (68)', screen: 'Entity', p: { e: 'attendance' } },
    { t: 'المأموريات وخطوط السير', screen: 'Entity', p: { e: 'missions' } }, { t: 'محرك الإجازات', screen: 'Leave' }, { t: 'سجل الإجازات', screen: 'Entity', p: { e: 'leaves' } },
    { t: 'الجزاءات', screen: 'Entity', p: { e: 'penalties' } }, { t: 'المحاضر والنماذج الرسمية', screen: 'Forms', p: { kind: 'hr' } },
    { t: 'كشف التوقيع اليومي', screen: 'Report', p: { r: 'daily_sign' } }, { t: 'سجل 68 اليوم', screen: 'Report', p: { r: 'register68' } },
    { t: 'أرصدة الإجازات', screen: 'Report', p: { r: 'leave_balances' } }, { t: 'مواعيد محو الجزاءات', screen: 'Report', p: { r: 'penalties_due' } } ] },
  { id: 'students', title: 'شؤون الطلبة', icon: '🎓', color: '#1565C0', items: [
    { t: 'سجلات القيد', screen: 'Entity', p: { e: 'students' } }, { t: 'الغياب', screen: 'Entity', p: { e: 'absences' } }, { t: 'التحويلات', screen: 'Entity', p: { e: 'transfers' } },
    { t: 'إفادات القيد وإنذارات الغياب', screen: 'Forms', p: { kind: 'student' } }, { t: 'حصر الفئات المعفاة', screen: 'Report', p: { r: 'exempt_list' } } ] },
  { id: 'stores', title: 'التوريدات والمخازن', icon: '📦', color: '#EF6C00', items: [
    { t: 'الأصناف والعهد', screen: 'Entity', p: { e: 'items' } }, { t: 'الدفاتر المخزنية (1/2/118/112)', screen: 'Entity', p: { e: 'vouchers' } },
    { t: 'تسليم الكتب المدرسية', screen: 'Textbooks' }, { t: 'محاضر الفحص والجرد والتكهين', screen: 'Entity', p: { e: 'stock_docs' } },
    { t: 'كشف أرصدة المخازن', screen: 'Report', p: { r: 'stock_balance' } }, { t: 'كشف الجرد السنوي', screen: 'Report', p: { r: 'annual_stocktake' } } ] },
  { id: 'finance', title: 'الماليات', icon: '💰', color: '#6A1B9A', items: [
    { t: 'قسائم التحصيل (123)', screen: 'Entity', p: { e: 'receipts' } }, { t: 'المتأخرون عن السداد', screen: 'Report', p: { r: 'arrears' } },
    { t: 'السلف', screen: 'Entity', p: { e: 'advances' } }, { t: 'أوامر الدفع', screen: 'Entity', p: { e: 'payment_orders' } },
    { t: 'مجموعات الدعم', screen: 'Entity', p: { e: 'support_groups' } }, { t: 'اشتراكات الدعم', screen: 'Entity', p: { e: 'support_subs' } },
    { t: 'توزيع حصيلة الدعم', screen: 'Report', p: { r: 'support_dist' } }, { t: 'كشف التحصيل الشهري', screen: 'Report', p: { r: 'fees_month' } }, { t: 'كشف التسوية الشهرية', screen: 'Report', p: { r: 'settlement' } } ] },
  { id: 'payroll', title: 'الماهيات', icon: '🧾', color: '#00838F', items: [
    { t: 'مفردات المرتب والاستقطاعات', screen: 'Payroll' }, { t: 'المكافآت الإضافية', screen: 'Entity', p: { e: 'bonuses' } } ] },
  { id: 'production', title: 'الوحدة المنتجة', icon: '🏭', color: '#AD1457', items: [
    { t: 'المشروعات', screen: 'Entity', p: { e: 'projects' } }, { t: 'الإيرادات والمصروفات', screen: 'Entity', p: { e: 'project_txns' } }, { t: 'الحساب الختامي وتوزيع الأرباح', screen: 'Production' } ] },
];
