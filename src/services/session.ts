export const session: { user: { id: number; name: string; role: string } | null } = { user: null };
export const ROLES: Record<string, { label: string; modules: string[] }> = {
  manager: { label: 'مدير المدرسة', modules: ['hr', 'students', 'stores', 'finance', 'payroll', 'production'] },
  hr: { label: 'مسؤول شؤون عاملين', modules: ['hr', 'students'] },
  finance: { label: 'سكرتير مالي', modules: ['finance', 'payroll', 'production', 'students'] },
  store: { label: 'أمين توريدات', modules: ['stores'] },
};
export const canAccess = (m: string) => !!session.user && ROLES[session.user.role]?.modules.includes(m);
export const isManager = () => session.user?.role === 'manager';
