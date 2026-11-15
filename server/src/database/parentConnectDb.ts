/**
 * Parent Connect: local SQLite database for voice calling.
 * Used as the sole backend when Neon PostgreSQL is offline, and also as a
 * real-time signal relay (the pc_signals table) even when Postgres is up.
 *
 * The SQLite file lives beside the server at Main_ERP/server/parent_connect.sqlite.
 */
import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.join(__dirname, '..', '..', 'parent_connect.sqlite');
export const pcDb = new Database(DB_PATH);

// WAL mode for concurrent reads while writing
pcDb.pragma('journal_mode = WAL');
pcDb.pragma('busy_timeout = 3000');

// ─── Schema ──────────────────────────────────────────────────────────────────
pcDb.exec(`
  CREATE TABLE IF NOT EXISTS pc_users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'STUDENT',
    email         TEXT,
    phone         TEXT,
    avatar_url    TEXT,
    roll_number   TEXT,
    class_label   TEXT,
    gender        TEXT,
    dob           TEXT,
    branch_id     TEXT DEFAULT 'branch-smg',
    is_active     INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS pc_contacts (
    id                  TEXT PRIMARY KEY,
    student_profile_id  TEXT NOT NULL,
    relationship        TEXT NOT NULL DEFAULT 'Father',
    name                TEXT NOT NULL,
    phone               TEXT,
    user_id             TEXT,
    is_authorized       INTEGER NOT NULL DEFAULT 1,
    created_at          TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pc_student_parents (
    student_user_id  TEXT NOT NULL,
    parent_user_id   TEXT NOT NULL,
    PRIMARY KEY (student_user_id, parent_user_id)
  );

  CREATE TABLE IF NOT EXISTS pc_schedule (
    day_of_week          INTEGER PRIMARY KEY CHECK (day_of_week BETWEEN 0 AND 6),
    start_time           TEXT NOT NULL DEFAULT '06:00',
    end_time             TEXT NOT NULL DEFAULT '22:00',
    max_duration_minutes INTEGER NOT NULL DEFAULT 15,
    is_active            INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS pc_calls (
    id               TEXT PRIMARY KEY,
    student_user_id  TEXT NOT NULL,
    parent_user_id   TEXT NOT NULL,
    caller_user_id   TEXT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'ringing',
    initiated_at     TEXT NOT NULL DEFAULT (datetime('now')),
    started_at       TEXT,
    ended_at         TEXT,
    duration_seconds INTEGER DEFAULT 0,
    end_reason       TEXT
  );

  CREATE TABLE IF NOT EXISTS pc_signals (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    call_id     TEXT NOT NULL,
    to_user_id  TEXT NOT NULL,
    type        TEXT NOT NULL,
    payload     TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pc_blocked (
    student_user_id TEXT PRIMARY KEY,
    reason          TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_pc_contacts_sp   ON pc_contacts(student_profile_id);
  CREATE INDEX IF NOT EXISTS idx_pc_signals_to     ON pc_signals(to_user_id, id);
  CREATE INDEX IF NOT EXISTS idx_pc_calls_stu      ON pc_calls(student_user_id);
  CREATE INDEX IF NOT EXISTS idx_pc_calls_par      ON pc_calls(parent_user_id);
`);

// ─── Seed default schedule (all 7 days, 06:00 → 22:00) ──────────────────────
const schedCount = (pcDb.prepare('SELECT COUNT(*) AS c FROM pc_schedule').get() as any).c;
if (schedCount === 0) {
  const ins = pcDb.prepare('INSERT OR IGNORE INTO pc_schedule (day_of_week) VALUES (?)');
  for (let d = 0; d < 7; d++) ins.run(d);
}

// ─── Seed demo students + parents (Shivamogga campus) ────────────────────────
function seedDemoData() {
  const hasUsers = (pcDb.prepare('SELECT COUNT(*) AS c FROM pc_users').get() as any).c;
  if (hasUsers > 0) return;

  const students = [
    { id: 'stu-smg-001', name: 'Bhoomika Naik', roll: '2026PUCSMG001', gender: 'Female', dob: '2008-07-15', class: 'II PU · A' },
    { id: 'stu-smg-002', name: 'Rahul Sharma', roll: '24CSE042', gender: 'Male', dob: '2008-03-22', class: 'I PU · B' },
    { id: 'stu-smg-003', name: 'Ananya Rao', roll: '2026PUCSMG003', gender: 'Female', dob: '2009-01-10', class: 'I PU · A' },
    { id: 'stu-smg-004', name: 'Karthik Gowda', roll: '2026PUCSMG004', gender: 'Male', dob: '2008-11-05', class: 'II PU · B' },
    { id: 'stu-smg-005', name: 'Priya Hegde', roll: '2026PUCSMG005', gender: 'Female', dob: '2009-06-18', class: 'I PU · A' },
  ];

  const parents = [
    { id: 'par-smg-001', name: 'Mr. Naveen Naik', email: 'naveen.naik@parent.sirmv.edu.in', phone: '9876543210', gender: 'Male' },
    { id: 'par-smg-002', name: 'Mr. Ramesh Sharma', email: 'ramesh.sharma@parent.sirmv.edu.in', phone: '9876543211', gender: 'Male' },
    { id: 'par-smg-003', name: 'Mrs. Lakshmi Rao', email: 'lakshmi.rao@parent.sirmv.edu.in', phone: '9876543212', gender: 'Female' },
    { id: 'par-smg-004', name: 'Mr. Suresh Gowda', email: 'suresh.gowda@parent.sirmv.edu.in', phone: '9876543213', gender: 'Male' },
    { id: 'par-smg-005', name: 'Mrs. Savitri Hegde', email: 'savitri.hegde@parent.sirmv.edu.in', phone: '9876543214', gender: 'Female' },
  ];

  const admin = { id: 'adm-smg-001', name: 'Campus Admin', email: 'admin@sirmv.edu.in', role: 'ADMIN' };

  const insUser = pcDb.prepare(`INSERT OR IGNORE INTO pc_users (id, name, role, email, phone, roll_number, class_label, gender, dob)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insLink = pcDb.prepare('INSERT OR IGNORE INTO pc_student_parents (student_user_id, parent_user_id) VALUES (?, ?)');
  const insCont = pcDb.prepare(`INSERT OR IGNORE INTO pc_contacts (id, student_profile_id, relationship, name, phone, user_id)
    VALUES (?, ?, ?, ?, ?, ?)`);

  const batch = pcDb.transaction(() => {
    // Admin
    insUser.run(admin.id, admin.name, 'ADMIN', admin.email, null, null, null, null, null);

    for (let i = 0; i < students.length; i++) {
      const s = students[i], p = parents[i];
      insUser.run(s.id, s.name, 'STUDENT', null, null, s.roll, s.class, s.gender, s.dob);
      insUser.run(p.id, p.name, 'PARENT', p.email, p.phone, null, null, p.gender, null);
      insLink.run(s.id, p.id);
      const rel = p.name.startsWith('Mrs') ? 'Mother' : 'Father';
      insCont.run(crypto.randomUUID(), s.id, rel, p.name, p.phone, p.id);
    }

    // Seed some recent call history for Bhoomika ↔ Naveen
    const callData = [
      { status: 'ended', duration: 18, reason: 'hangup', minsAgo: 180, caller: 'par-smg-001' },
      { status: 'ended', duration: 18, reason: 'hangup', minsAgo: 178, caller: 'stu-smg-001' },
      { status: 'missed', duration: 0, reason: 'no_answer', minsAgo: 173, caller: 'stu-smg-001' },
      { status: 'ended', duration: 9, reason: 'hangup', minsAgo: 152, caller: 'stu-smg-001' },
      { status: 'missed', duration: 0, reason: 'no_answer', minsAgo: 94, caller: 'stu-smg-001' },
      { status: 'missed', duration: 0, reason: 'no_answer', minsAgo: 60, caller: 'par-smg-001' },
      { status: 'missed', duration: 0, reason: 'no_answer', minsAgo: 58, caller: 'stu-smg-001' },
      { status: 'missed', duration: 0, reason: 'no_answer', minsAgo: 30, caller: 'stu-smg-001' },
      { status: 'missed', duration: 0, reason: 'no_answer', minsAgo: 10, caller: 'par-smg-001' },
      { status: 'missed', duration: 0, reason: 'no_answer', minsAgo: 2, caller: 'stu-smg-001' },
    ];
    const insCall = pcDb.prepare(`INSERT INTO pc_calls (id, student_user_id, parent_user_id, caller_user_id, status, initiated_at, started_at, duration_seconds, end_reason)
      VALUES (?, 'stu-smg-001', 'par-smg-001', ?, ?, datetime('now', ? || ' minutes'), CASE WHEN ? > 0 THEN datetime('now', ? || ' minutes') ELSE NULL END, ?, ?)`);
    for (const c of callData) {
      insCall.run(crypto.randomUUID(), c.caller, c.status, String(-c.minsAgo), c.duration, String(-c.minsAgo + 1), c.duration, c.reason);
    }
  });
  batch();

  console.log(`📞 Parent Connect SQLite seeded: ${students.length} students, ${parents.length} parents, ${admin.name}`);
}

seedDemoData();
console.log(`📞 Parent Connect database ready: ${DB_PATH}`);

