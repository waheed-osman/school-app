export const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, username TEXT UNIQUE NOT NULL, pin_hash TEXT NOT NULL, role TEXT NOT NULL, active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS audit_log(id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT DEFAULT CURRENT_TIMESTAMP, user_name TEXT, action TEXT, tbl TEXT, row_id INTEGER, detail TEXT);
CREATE TABLE IF NOT EXISTS laws(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, number TEXT, body TEXT);

CREATE TABLE IF NOT EXISTS employees(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, national_id TEXT UNIQUE, code TEXT, hire_date TEXT, birth_date TEXT, grade TEXT, specialty TEXT, status TEXT DEFAULT 'على رأس العمل', union_member TEXT DEFAULT 'لا',
  basic_salary REAL DEFAULT 0, supp_salary REAL DEFAULT 0, incentive REAL DEFAULT 0, teacher_allowance REAL DEFAULT 0, approval_allowance REAL DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS attendance(id INTEGER PRIMARY KEY AUTOINCREMENT, employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE, date TEXT NOT NULL, status TEXT DEFAULT 'حاضر', in_time TEXT, out_time TEXT, late_minutes INTEGER DEFAULT 0, note TEXT);
CREATE TABLE IF NOT EXISTS missions(id INTEGER PRIMARY KEY AUTOINCREMENT, employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE, date TEXT, destination TEXT, purpose TEXT, route TEXT);
CREATE TABLE IF NOT EXISTS leaves(id INTEGER PRIMARY KEY AUTOINCREMENT, employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE, type TEXT NOT NULL, from_date TEXT NOT NULL, to_date TEXT NOT NULL, days INTEGER NOT NULL, note TEXT);
CREATE TABLE IF NOT EXISTS penalties(id INTEGER PRIMARY KEY AUTOINCREMENT, employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE, date TEXT NOT NULL, type TEXT, reason TEXT, deduction_days REAL DEFAULT 0, erase_date TEXT);

CREATE TABLE IF NOT EXISTS students(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, national_id TEXT, grade TEXT, class_name TEXT, enroll_status TEXT DEFAULT 'مستجد', exempt_type TEXT DEFAULT '', fee REAL, guardian_phone TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS absences(id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE, date TEXT, reason TEXT, warning_no INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS transfers(id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER REFERENCES students(id) ON DELETE SET NULL, direction TEXT, other_school TEXT, date TEXT, status TEXT DEFAULT 'قيد الإجراء', note TEXT);

CREATE TABLE IF NOT EXISTS items(id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT, name TEXT NOT NULL, kind TEXT DEFAULT 'مستهلك', unit TEXT, qty REAL DEFAULT 0, unit_price REAL DEFAULT 0, location TEXT);
CREATE TABLE IF NOT EXISTS vouchers(id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, no TEXT, date TEXT, item_id INTEGER NOT NULL REFERENCES items(id), qty REAL NOT NULL, party TEXT, note TEXT);
CREATE TABLE IF NOT EXISTS stock_docs(id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT, date TEXT, item_id INTEGER REFERENCES items(id), qty REAL, committee TEXT, note TEXT);
CREATE TABLE IF NOT EXISTS textbook_stock(id INTEGER PRIMARY KEY AUTOINCREMENT, grade TEXT NOT NULL, date TEXT, received INTEGER NOT NULL, note TEXT);
CREATE TABLE IF NOT EXISTS textbook_deliveries(id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT, kind TEXT, student_id INTEGER REFERENCES students(id), grade TEXT, class_name TEXT, qty INTEGER NOT NULL, voucher_no TEXT, receiver TEXT, signature TEXT, user_name TEXT);

CREATE TABLE IF NOT EXISTS receipts(id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL REFERENCES students(id), no TEXT, date TEXT, amount REAL NOT NULL, term TEXT, note TEXT);
CREATE TABLE IF NOT EXISTS advances(id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT, date TEXT, amount REAL, spent REAL DEFAULT 0, purpose TEXT, note TEXT);
CREATE TABLE IF NOT EXISTS payment_orders(id INTEGER PRIMARY KEY AUTOINCREMENT, no TEXT, date TEXT, beneficiary TEXT, clause TEXT, amount REAL, note TEXT);
CREATE TABLE IF NOT EXISTS support_groups(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, subject TEXT, teacher_id INTEGER REFERENCES employees(id), fee REAL DEFAULT 0, term TEXT);
CREATE TABLE IF NOT EXISTS support_subs(id INTEGER PRIMARY KEY AUTOINCREMENT, group_id INTEGER NOT NULL REFERENCES support_groups(id) ON DELETE CASCADE, student_id INTEGER NOT NULL REFERENCES students(id), date TEXT, paid REAL DEFAULT 0);

CREATE TABLE IF NOT EXISTS bonuses(id INTEGER PRIMARY KEY AUTOINCREMENT, employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE, month TEXT, kind TEXT, qty REAL DEFAULT 1, rate REAL DEFAULT 0, amount REAL DEFAULT 0);

CREATE TABLE IF NOT EXISTS projects(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, supervisor_id INTEGER REFERENCES employees(id), capital REAL DEFAULT 0, start_date TEXT, end_date TEXT, status TEXT DEFAULT 'جاري');
CREATE TABLE IF NOT EXISTS project_txns(id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE, date TEXT, kind TEXT NOT NULL, doc_no TEXT, description TEXT, amount REAL NOT NULL);

CREATE VIEW IF NOT EXISTS v_student_fees AS
SELECT s.id, s.name, s.grade, s.class_name, s.exempt_type,
  CASE WHEN s.exempt_type IS NOT NULL AND s.exempt_type<>'' THEN 0
       ELSE COALESCE(s.fee,(SELECT CAST(value AS REAL) FROM settings WHERE key='tuition_fee'),0) END AS due_fee,
  COALESCE((SELECT SUM(amount) FROM receipts r WHERE r.student_id=s.id),0) AS paid
FROM students s;
`;

export const DEFAULT_SETTINGS: Record<string, string> = {
  school_name: 'مدرسة ........', directorate: 'مديرية التربية والتعليم بـ ........', school_year: '2026 / 2027',
  grades: 'الصف الأول,الصف الثاني,الصف الثالث', tuition_fee: '0',
  // قيم افتراضية قابلة للتعديل — راجعها مع القرارات الوزارية والقوانين السارية
  annual_first: '15', annual_after1: '21', annual_after10_or_50: '30', annual_60: '45',
  casual_max_year: '7', casual_max_per_time: '2',
  insurance_pct: '11', union_fee: '0', tax_personal_exemption: '20000',
  tax_brackets: JSON.stringify([[40000, 0], [55000, 10], [70000, 15], [200000, 20], [400000, 22.5], [1200000, 25], [null, 27.5]]),
  profit_split: JSON.stringify([
    { key: 'students', label: 'الطلاب المشاركون', pct: 0 },
    { key: 'supervisors', label: 'المشرفون', pct: 0 },
    { key: 'school', label: 'إدارة المدرسة', pct: 0 },
    { key: 'fund', label: 'صندوق الوحدة بالإدارة/المديرية', pct: 0 },
  ]),
  support_split: JSON.stringify([
    { key: 'teacher', label: 'المعلم', pct: 0 }, { key: 'admin', label: 'الإدارة', pct: 0 }, { key: 'fund', label: 'صندوق المدرسة', pct: 0 },
  ]),
  penalty_erase_months: JSON.stringify({ 'لفت نظر': 0, 'إنذار': 6, 'خصم من 1 إلى 5 أيام': 12, 'خصم من 6 إلى 15 يوم': 24 }),
};

export const SEED_LAWS = [
  ['قانون الخدمة المدنية', '81 لسنة 2016', 'أدخل الملخص أو المواد المطلوبة هنا.'],
  ['قانون التعليم', '155 لسنة 2007 وتعديلاته', 'أدخل الملخص أو المواد المطلوبة هنا.'],
  ['قانون التعاقدات العامة', '182 لسنة 2018', 'أدخل الملخص أو المواد المطلوبة هنا.'],
];
