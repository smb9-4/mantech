import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { pcDb } from '../database/parentConnectDb';

/**
 * Parent Connect: private student ↔ parent internet voice calls.
 * This version uses the local SQLite database so it works offline
 * without Neon PostgreSQL. Signalling is HTTP polling — no sockets
 * needed. WebRTC audio is peer-to-peer between the two browsers.
 */
export const parentConnectRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'sirmv_super_secret_jwt_key_2026';
const ADMIN_ROLES = ['ADMIN', 'PRINCIPAL', 'HEAD_WARDEN', 'WARDEN'];
const RING_SECONDS = 45;
const isAdmin = (role: string) => ADMIN_ROLES.includes(role);

// ---------- lightweight auth that works without Postgres ----------
interface PcUser { id: string; name: string; role: string; email?: string; phone?: string; branch_id?: string; avatar_url?: string; student_id?: string; }

function getUserFromReq(req: Request): PcUser {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('Unauthorized');
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return { id: decoded.id, name: decoded.name, role: decoded.role, email: decoded.email, phone: decoded.phone, branch_id: decoded.branch_id, avatar_url: decoded.avatar_url, student_id: decoded.student_id };
  } catch {
    throw new Error('Invalid or expired token');
  }
}

// ---------- helpers ----------
const clean = (n?: string | null) => (n || '').replace(/\s*\((Student|Parent)\)\s*$/i, '').trim();

const nowInKolkata = () => {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '';
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, hhmm: `${get('hour')}:${get('minute')}` };
};

function availability() {
  const { day, hhmm } = nowInKolkata();
  const row = pcDb.prepare('SELECT * FROM pc_schedule WHERE day_of_week = ?').get(day) as any;
  if (!row || !row.is_active) return { isAllowed: false, reason: 'Calling is switched off today by the hostel.', schedule: row };
  if (hhmm < row.start_time || hhmm > row.end_time) return { isAllowed: false, reason: `Calls are allowed between ${row.start_time} and ${row.end_time}.`, schedule: row };
  return { isAllowed: true, reason: null, schedule: row };
}

function housekeeping() {
  pcDb.prepare(`UPDATE pc_calls SET status = 'missed', ended_at = datetime('now'), end_reason = 'no_answer'
    WHERE status = 'ringing' AND datetime(initiated_at, '+' || ? || ' seconds') < datetime('now')`).run(RING_SECONDS);

  // End calls exceeding max duration
  const maxMins = (pcDb.prepare('SELECT max_duration_minutes FROM pc_schedule LIMIT 1').get() as any)?.max_duration_minutes || 15;
  const overCalls = pcDb.prepare(`SELECT id FROM pc_calls WHERE status = 'connected' AND datetime(started_at, '+' || ? || ' minutes') < datetime('now')`).all(maxMins) as any[];
  for (const c of overCalls) endCall(c.id, 'max_duration_exceeded');
}

function endCall(id: string, reason: string) {
  const call = pcDb.prepare('SELECT * FROM pc_calls WHERE id = ?').get(id) as any;
  if (!call || !['ringing', 'connected'].includes(call.status)) return;

  const durSec = call.started_at ? Math.max(0, Math.round((Date.now() - new Date(call.started_at + 'Z').getTime()) / 1000)) : 0;
  const newStatus = call.status === 'connected' ? 'ended' : (reason === 'rejected' ? 'rejected' : 'missed');

  pcDb.prepare(`UPDATE pc_calls SET status = ?, ended_at = datetime('now'), duration_seconds = ?, end_reason = ? WHERE id = ?`)
    .run(newStatus, durSec, reason, id);
}

const shapeCall = (c: any, meId: string) => c && ({
  id: c.id, status: c.status, startedAt: c.started_at, initiatedAt: c.initiated_at, endReason: c.end_reason, durationSeconds: c.duration_seconds,
  isIncoming: c.caller_user_id !== meId,
  peerUserId: c.student_user_id === meId ? c.parent_user_id : c.student_user_id,
});

// ─── Contacts ────────────────────────────────────────────────────────────────
parentConnectRouter.get('/contacts', (req: Request, res: Response) => {
  try {
    const me = getUserFromReq(req);

    if (me.role === 'STUDENT') {
      // Student sees their linked parents
      const rows = pcDb.prepare(`
        SELECT sp.parent_user_id, pu.name AS parent_name, pu.avatar_url AS parent_avatar,
               sp.student_user_id, su.name AS student_name, su.avatar_url AS student_avatar,
               su.roll_number AS register_number, su.gender, su.dob AS date_of_birth,
               su.class_label, pc.relationship
        FROM pc_student_parents sp
        JOIN pc_users su ON su.id = sp.student_user_id
        JOIN pc_users pu ON pu.id = sp.parent_user_id
        LEFT JOIN pc_contacts pc ON pc.student_profile_id = sp.student_user_id AND pc.user_id = sp.parent_user_id
        WHERE sp.student_user_id = ?
      `).all(me.id) as any[];

      const contacts = rows.map((p) => ({
        pairKey: `${p.student_user_id}:${p.parent_user_id}`,
        userId: p.parent_user_id,
        name: clean(p.parent_name),
        role: 'PARENT' as const,
        gender: null,
        avatarUrl: p.parent_avatar,
        relationship: p.relationship || 'Parent',
        registerNumber: p.register_number || '',
        studentName: clean(p.student_name), parentName: clean(p.parent_name),
        studentUserId: p.student_user_id, parentUserId: p.parent_user_id,
        studentAvatar: p.student_avatar, parentAvatar: p.parent_avatar,
        studentGender: p.gender, dob: p.date_of_birth,
        classLabel: p.class_label || '', hostelite: true, blocked: false,
      }));
      return res.json({ contacts });
    }

    if (me.role === 'PARENT') {
      // Parent sees their linked students (wards)
      const rows = pcDb.prepare(`
        SELECT sp.student_user_id, su.name AS student_name, su.avatar_url AS student_avatar,
               su.roll_number AS register_number, su.gender, su.dob AS date_of_birth,
               su.class_label, sp.parent_user_id, pu.name AS parent_name, pu.avatar_url AS parent_avatar,
               pc.relationship
        FROM pc_student_parents sp
        JOIN pc_users su ON su.id = sp.student_user_id
        JOIN pc_users pu ON pu.id = sp.parent_user_id
        LEFT JOIN pc_contacts pc ON pc.student_profile_id = sp.student_user_id AND pc.user_id = sp.parent_user_id
        WHERE sp.parent_user_id = ?
      `).all(me.id) as any[];

      const contacts = rows.map((p) => ({
        pairKey: `${p.student_user_id}:${p.parent_user_id}`,
        userId: p.student_user_id,
        name: clean(p.student_name),
        role: 'STUDENT' as const,
        gender: p.gender,
        avatarUrl: p.student_avatar,
        relationship: 'Your ward',
        registerNumber: p.register_number || '',
        studentName: clean(p.student_name), parentName: clean(p.parent_name),
        studentUserId: p.student_user_id, parentUserId: p.parent_user_id,
        studentAvatar: p.student_avatar, parentAvatar: p.parent_avatar,
        studentGender: p.gender, dob: p.date_of_birth,
        classLabel: p.class_label || '', hostelite: true, blocked: false,
      }));
      return res.json({ contacts });
    }

    // Admin: all pairs
    if (isAdmin(me.role)) {
      const rows = pcDb.prepare(`
        SELECT sp.student_user_id, sp.parent_user_id, su.name AS student_name, pu.name AS parent_name,
               su.roll_number AS register_number, su.gender, su.dob AS date_of_birth,
               su.avatar_url AS student_avatar, pu.avatar_url AS parent_avatar, su.class_label
        FROM pc_student_parents sp
        JOIN pc_users su ON su.id = sp.student_user_id
        JOIN pc_users pu ON pu.id = sp.parent_user_id
        ORDER BY su.name
      `).all() as any[];

      const contacts = rows.map((p) => ({
        pairKey: `${p.student_user_id}:${p.parent_user_id}`,
        userId: p.student_user_id,
        name: clean(p.student_name),
        role: 'STUDENT' as const, gender: p.gender, avatarUrl: p.student_avatar, relationship: 'Student',
        registerNumber: p.register_number || '', studentName: clean(p.student_name), parentName: clean(p.parent_name),
        studentUserId: p.student_user_id, parentUserId: p.parent_user_id,
        studentAvatar: p.student_avatar, parentAvatar: p.parent_avatar,
        studentGender: p.gender, dob: p.date_of_birth, classLabel: p.class_label || '', hostelite: true, blocked: false,
      }));
      return res.json({ contacts });
    }

    return res.json({ contacts: [] });
  } catch (e: any) { return res.status(e.message === 'Unauthorized' ? 401 : 500).json({ error: e.message }); }
});

// ─── Availability ────────────────────────────────────────────────────────────
parentConnectRouter.get('/availability', (req: Request, res: Response) => {
  try { getUserFromReq(req); return res.json(availability()); }
  catch (e: any) { return res.status(401).json({ error: e.message }); }
});

// ─── History ─────────────────────────────────────────────────────────────────
parentConnectRouter.get('/history', (req: Request, res: Response) => {
  try {
    const me = getUserFromReq(req);
    let rows: any[];
    if (me.role === 'STUDENT') {
      rows = pcDb.prepare(`SELECT c.*, su.name AS student_name, pu.name AS parent_name
        FROM pc_calls c JOIN pc_users su ON su.id = c.student_user_id JOIN pc_users pu ON pu.id = c.parent_user_id
        WHERE c.student_user_id = ? ORDER BY c.initiated_at DESC LIMIT 100`).all(me.id) as any[];
    } else if (me.role === 'PARENT') {
      rows = pcDb.prepare(`SELECT c.*, su.name AS student_name, pu.name AS parent_name
        FROM pc_calls c JOIN pc_users su ON su.id = c.student_user_id JOIN pc_users pu ON pu.id = c.parent_user_id
        WHERE c.parent_user_id = ? ORDER BY c.initiated_at DESC LIMIT 100`).all(me.id) as any[];
    } else if (isAdmin(me.role)) {
      rows = pcDb.prepare(`SELECT c.*, su.name AS student_name, pu.name AS parent_name
        FROM pc_calls c JOIN pc_users su ON su.id = c.student_user_id JOIN pc_users pu ON pu.id = c.parent_user_id
        ORDER BY c.initiated_at DESC LIMIT 100`).all() as any[];
    } else {
      rows = [];
    }
    return res.json({ history: rows.map((r) => ({ ...r, student_name: clean(r.student_name), parent_name: clean(r.parent_name), direction: r.caller_user_id === me.id ? 'out' : 'in' })) });
  } catch (e: any) { return res.status(401).json({ error: e.message }); }
});

// ─── Call lifecycle ──────────────────────────────────────────────────────────
parentConnectRouter.post('/calls', (req: Request, res: Response) => {
  try {
    const me = getUserFromReq(req);
    if (!['STUDENT', 'PARENT'].includes(me.role)) return res.status(403).json({ error: 'Only students and parents can make calls.' });
    const { to_user_id } = req.body || {};
    if (!to_user_id) return res.status(400).json({ error: 'to_user_id is required.' });

    const studentId = me.role === 'STUDENT' ? me.id : to_user_id;
    const parentId = me.role === 'PARENT' ? me.id : to_user_id;

    // Verify link
    const link = pcDb.prepare('SELECT 1 FROM pc_student_parents WHERE student_user_id = ? AND parent_user_id = ?').get(studentId, parentId);
    if (!link) return res.status(400).json({ error: 'Unauthorized call: this student and parent are not linked.' });

    // Check blocked
    if (pcDb.prepare('SELECT 1 FROM pc_blocked WHERE student_user_id = ?').get(studentId))
      return res.status(403).json({ error: 'Calling is switched off for this student by the hostel.' });

    // Check availability
    const av = availability();
    if (!av.isAllowed) return res.status(403).json({ error: av.reason });

    housekeeping();

    // Check busy
    const busy = pcDb.prepare(`SELECT 1 FROM pc_calls WHERE status IN ('ringing','connected') AND (student_user_id IN (?,?) OR parent_user_id IN (?,?))`).get(studentId, parentId, studentId, parentId);
    if (busy) return res.status(409).json({ error: 'One of you is already on a call. Try again in a moment.' });

    const id = crypto.randomUUID();
    pcDb.prepare(`INSERT INTO pc_calls (id, student_user_id, parent_user_id, caller_user_id) VALUES (?,?,?,?)`).run(id, studentId, parentId, me.id);

    return res.json({ callId: id, maxDurationMinutes: av.schedule?.max_duration_minutes ?? 15 });
  } catch (e: any) { return res.status(e.message === 'Unauthorized' ? 401 : 500).json({ error: e.message }); }
});

parentConnectRouter.post('/calls/:id/accept', (req: Request, res: Response) => {
  try {
    const me = getUserFromReq(req);
    const call = pcDb.prepare('SELECT * FROM pc_calls WHERE id = ?').get(req.params.id) as any;
    if (!call || (call.student_user_id !== me.id && call.parent_user_id !== me.id && !isAdmin(me.role)))
      return res.status(404).json({ error: 'Call not found.' });
    if (call.caller_user_id === me.id) return res.status(400).json({ error: 'You cannot answer your own call.' });

    const n = pcDb.prepare(`UPDATE pc_calls SET status = 'connected', started_at = datetime('now') WHERE id = ? AND status = 'ringing'`).run(req.params.id);
    if (n.changes === 0) return res.status(409).json({ error: 'This call is no longer ringing.' });

    // Signal the caller that it was accepted
    pcDb.prepare(`INSERT INTO pc_signals (call_id, to_user_id, type, payload) VALUES (?,?,'accepted',NULL)`).run(call.id, call.caller_user_id);
    return res.json({ success: true });
  } catch (e: any) { return res.status(e.message === 'Unauthorized' ? 401 : 500).json({ error: e.message }); }
});

parentConnectRouter.post('/calls/:id/reject', (req: Request, res: Response) => {
  try {
    const me = getUserFromReq(req);
    const call = pcDb.prepare('SELECT * FROM pc_calls WHERE id = ?').get(req.params.id) as any;
    if (!call || (call.student_user_id !== me.id && call.parent_user_id !== me.id && !isAdmin(me.role)))
      return res.status(404).json({ error: 'Call not found.' });
    endCall(call.id, 'rejected');
    return res.json({ success: true });
  } catch (e: any) { return res.status(e.message === 'Unauthorized' ? 401 : 500).json({ error: e.message }); }
});

parentConnectRouter.post('/calls/:id/end', (req: Request, res: Response) => {
  try {
    const me = getUserFromReq(req);
    const call = pcDb.prepare('SELECT * FROM pc_calls WHERE id = ?').get(req.params.id) as any;
    if (!call || (call.student_user_id !== me.id && call.parent_user_id !== me.id && !isAdmin(me.role)))
      return res.status(404).json({ error: 'Call not found.' });
    const reason = isAdmin(me.role) && call.student_user_id !== me.id && call.parent_user_id !== me.id
      ? 'ended_by_admin'
      : (call.status === 'ringing' && call.caller_user_id === me.id ? 'cancelled' : 'hangup');
    endCall(call.id, reason);
    return res.json({ success: true });
  } catch (e: any) { return res.status(e.message === 'Unauthorized' ? 401 : 500).json({ error: e.message }); }
});

parentConnectRouter.post('/calls/:id/signal', (req: Request, res: Response) => {
  try {
    const me = getUserFromReq(req);
    const call = pcDb.prepare('SELECT * FROM pc_calls WHERE id = ?').get(req.params.id) as any;
    if (!call || (call.student_user_id !== me.id && call.parent_user_id !== me.id))
      return res.status(403).json({ error: 'Not your call.' });
    const { type, payload } = req.body || {};
    if (!['offer', 'answer', 'ice'].includes(type)) return res.status(400).json({ error: 'Bad signal type.' });
    if (!['ringing', 'connected'].includes(call.status)) return res.status(409).json({ error: 'Call is over.' });

    const to = call.student_user_id === me.id ? call.parent_user_id : call.student_user_id;
    pcDb.prepare(`INSERT INTO pc_signals (call_id, to_user_id, type, payload) VALUES (?,?,?,?)`).run(call.id, to, type, JSON.stringify(payload ?? null));
    return res.json({ success: true });
  } catch (e: any) { return res.status(e.message === 'Unauthorized' ? 401 : 500).json({ error: e.message }); }
});

// ─── Polling ─────────────────────────────────────────────────────────────────
parentConnectRouter.get('/poll', (req: Request, res: Response) => {
  try {
    const me = getUserFromReq(req);
    if (!['STUDENT', 'PARENT'].includes(me.role)) return res.json({ call: null, signals: [], known: null });

    housekeeping();
    const after = Number(req.query.after || 0);

    const live = pcDb.prepare(`SELECT * FROM pc_calls WHERE status IN ('ringing','connected') AND (student_user_id = ? OR parent_user_id = ?) ORDER BY initiated_at DESC LIMIT 1`).get(me.id, me.id) as any;

    let known: any = null;
    if (req.query.call_id) {
      known = pcDb.prepare('SELECT * FROM pc_calls WHERE id = ? AND (student_user_id = ? OR parent_user_id = ?)').get(String(req.query.call_id), me.id, me.id) as any;
    }

    const signals = pcDb.prepare('SELECT id, call_id, type, payload FROM pc_signals WHERE to_user_id = ? AND id > ? ORDER BY id LIMIT 200').all(me.id, after) as any[];

    // Tidy old signals (probabilistic)
    if (Math.random() < 0.05) pcDb.prepare(`DELETE FROM pc_signals WHERE created_at < datetime('now', '-1 hour')`).run();

    return res.json({
      call: shapeCall(live, me.id),
      known: shapeCall(known, me.id),
      signals: signals.map((s) => ({ id: Number(s.id), callId: s.call_id, type: s.type, payload: s.payload ? JSON.parse(s.payload) : null })),
    });
  } catch (e: any) { return res.status(e.message === 'Unauthorized' ? 401 : 500).json({ error: e.message }); }
});

// ─── Admin: Schedule ─────────────────────────────────────────────────────────
parentConnectRouter.get('/schedule', (req: Request, res: Response) => {
  try { getUserFromReq(req); return res.json({ schedule: pcDb.prepare('SELECT * FROM pc_schedule ORDER BY day_of_week').all() }); }
  catch (e: any) { return res.status(401).json({ error: e.message }); }
});

parentConnectRouter.put('/schedule', (req: Request, res: Response) => {
  try {
    const me = getUserFromReq(req);
    if (!isAdmin(me.role)) return res.status(403).json({ error: 'Admin only.' });
    const rows: any[] = Array.isArray(req.body?.schedule) ? req.body.schedule : [];
    const ok = /^([01]\d|2[0-3]):[0-5]\d$/;
    for (const r of rows) {
      if (!ok.test(r.start_time) || !ok.test(r.end_time) || r.end_time <= r.start_time) return res.status(400).json({ error: 'Invalid schedule times.' });
      const max = Number(r.max_duration_minutes);
      if (!(max >= 1 && max <= 120)) return res.status(400).json({ error: 'Max call length must be 1–120 minutes.' });
      pcDb.prepare('UPDATE pc_schedule SET start_time=?, end_time=?, max_duration_minutes=?, is_active=? WHERE day_of_week=?')
        .run(r.start_time, r.end_time, max, r.is_active ? 1 : 0, Number(r.day_of_week));
    }
    return res.json({ success: true });
  } catch (e: any) { return res.status(e.message === 'Unauthorized' ? 401 : 500).json({ error: e.message }); }
});

// ─── Admin: Live calls ───────────────────────────────────────────────────────
parentConnectRouter.get('/live', (req: Request, res: Response) => {
  try {
    const me = getUserFromReq(req);
    if (!isAdmin(me.role)) return res.status(403).json({ error: 'Admin only.' });
    housekeeping();
    const live = pcDb.prepare(`SELECT c.*, su.name AS student_name, pu.name AS parent_name
      FROM pc_calls c JOIN pc_users su ON su.id = c.student_user_id JOIN pc_users pu ON pu.id = c.parent_user_id
      WHERE c.status IN ('ringing','connected') ORDER BY c.initiated_at DESC`).all() as any[];

    const stats = pcDb.prepare(`SELECT
      COUNT(*) AS calls_24h,
      SUM(CASE WHEN status = 'ended' THEN 1 ELSE 0 END) AS completed_24h,
      SUM(CASE WHEN status IN ('missed','rejected') THEN 1 ELSE 0 END) AS missed_24h,
      COALESCE(SUM(duration_seconds), 0) AS seconds_24h
      FROM pc_calls WHERE initiated_at > datetime('now', '-24 hours')`).get() as any;

    return res.json({
      live: live.map((r) => ({ ...r, student_name: clean(r.student_name), parent_name: clean(r.parent_name) })),
      stats: { calls24h: Number(stats?.calls_24h || 0), completed24h: Number(stats?.completed_24h || 0), missed24h: Number(stats?.missed_24h || 0), seconds24h: Number(stats?.seconds_24h || 0) }
    });
  } catch (e: any) { return res.status(e.message === 'Unauthorized' ? 401 : 500).json({ error: e.message }); }
});

// ─── Admin: Block/Unblock ────────────────────────────────────────────────────
parentConnectRouter.post('/students/:studentUserId/block', (req: Request, res: Response) => {
  try {
    const me = getUserFromReq(req);
    if (!isAdmin(me.role)) return res.status(403).json({ error: 'Admin only.' });
    const blocked = !!req.body?.blocked;
    if (blocked) pcDb.prepare('INSERT OR REPLACE INTO pc_blocked (student_user_id, reason) VALUES (?,?)').run(req.params.studentUserId, req.body?.reason || null);
    else pcDb.prepare('DELETE FROM pc_blocked WHERE student_user_id = ?').run(req.params.studentUserId);
    return res.json({ success: true });
  } catch (e: any) { return res.status(e.message === 'Unauthorized' ? 401 : 500).json({ error: e.message }); }
});

// ─── Admin: Student register ─────────────────────────────────────────────────
const pucLevel = (cls?: string | null): 'I PU' | 'II PU' | '' => {
  const n = (cls || '').toLowerCase();
  if (/(2|ii|12|2nd|second)|12th|2\s?puc|ii\s?pu/i.test(n)) return 'II PU';
  if (/(1|i|11|1st|first)|11th|1\s?puc|i\s?pu/i.test(n)) return 'I PU';
  return '';
};

parentConnectRouter.get('/register', (req: Request, res: Response) => {
  try {
    const me = getUserFromReq(req);
    if (!isAdmin(me.role)) return res.status(403).json({ error: 'Admin only.' });

    const rows = pcDb.prepare(`
      SELECT u.id, u.id AS user_id, u.name, u.roll_number AS register_number, u.gender, u.dob AS date_of_birth, u.avatar_url AS photo, u.class_label,
        COALESCE((SELECT SUM(duration_seconds) FROM pc_calls k WHERE k.student_user_id = u.id), 0) AS talk_seconds,
        (SELECT COUNT(*) FROM pc_calls k WHERE k.student_user_id = u.id AND k.status <> 'ringing') AS call_count,
        EXISTS (SELECT 1 FROM pc_blocked b WHERE b.student_user_id = u.id) AS blocked,
        (SELECT COUNT(*) FROM pc_contacts pc WHERE pc.student_profile_id = u.id AND pc.is_authorized = 1) AS allowed_contacts
      FROM pc_users u WHERE u.role = 'STUDENT' AND u.is_active = 1 ORDER BY u.roll_number, u.id
    `).all() as any[];

    return res.json({ students: rows.map((r, i) => ({
      id: r.id, userId: r.user_id, name: clean(r.name), registerNumber: r.register_number || '', gender: r.gender, dob: r.date_of_birth, photo: r.photo,
      classLabel: r.class_label || '', level: pucLevel(r.class_label),
      tab: `TAB-${String(i + 1).padStart(3, '0')}`, talkSeconds: Number(r.talk_seconds), callCount: Number(r.call_count),
      enabled: !r.blocked, allowedContacts: Number(r.allowed_contacts),
    })) });
  } catch (e: any) { return res.status(e.message === 'Unauthorized' ? 401 : 500).json({ error: e.message }); }
});

parentConnectRouter.get('/register/:id', (req: Request, res: Response) => {
  try {
    const me = getUserFromReq(req);
    if (!isAdmin(me.role)) return res.status(403).json({ error: 'Admin only.' });

    const sp = pcDb.prepare('SELECT id FROM pc_users WHERE id = ? AND role = ?').get(req.params.id, 'STUDENT') as any;
    if (!sp) return res.status(404).json({ error: 'Student not found.' });

    const contacts = pcDb.prepare(`SELECT id, relationship, name, phone, is_authorized FROM pc_contacts WHERE student_profile_id = ?
      ORDER BY CASE relationship WHEN 'Father' THEN 0 WHEN 'Mother' THEN 1 ELSE 2 END, created_at`).all(sp.id) as any[];

    const calls = pcDb.prepare(`SELECT k.id, k.status, k.initiated_at AS at, k.duration_seconds AS seconds, k.end_reason, k.caller_user_id, k.parent_user_id,
        COALESCE(pc.name, pu.name) AS who, COALESCE(pc.relationship, 'Parent') AS relationship, COALESCE(pc.phone, pu.phone) AS phone
      FROM pc_calls k LEFT JOIN pc_users pu ON pu.id = k.parent_user_id
      LEFT JOIN pc_contacts pc ON pc.student_profile_id = ? AND pc.user_id = k.parent_user_id
      WHERE k.student_user_id = ? ORDER BY k.initiated_at DESC LIMIT 60`).all(sp.id, sp.id) as any[];

    return res.json({
      contacts: contacts.map((c) => ({ id: c.id, relationship: c.relationship, name: clean(c.name), phone: c.phone || '', authorized: c.is_authorized === 1 })),
      calls: calls.map((k) => ({ id: k.id, status: k.status, at: k.at, seconds: k.seconds || 0, direction: k.caller_user_id === sp.id ? 'outgoing' : 'incoming', name: clean(k.who), relationship: k.relationship, phone: k.phone || '' })),
    });
  } catch (e: any) { return res.status(e.message === 'Unauthorized' ? 401 : 500).json({ error: e.message }); }
});

parentConnectRouter.post('/register/:id/contacts', (req: Request, res: Response) => {
  try {
    const me = getUserFromReq(req);
    if (!isAdmin(me.role)) return res.status(403).json({ error: 'Admin only.' });
    const { relationship, name, phone } = req.body || {};
    if (!['Father', 'Mother', 'Guardian'].includes(relationship) || !String(name || '').trim()) return res.status(400).json({ error: 'Choose Father, Mother or Guardian and enter a name.' });
    const id = crypto.randomUUID();
    pcDb.prepare('INSERT INTO pc_contacts (id, student_profile_id, relationship, name, phone) VALUES (?,?,?,?,?)').run(id, req.params.id, relationship, String(name).trim(), phone ? String(phone).trim() : null);
    return res.json({ success: true, id });
  } catch (e: any) { return res.status(e.message === 'Unauthorized' ? 401 : 500).json({ error: e.message }); }
});

parentConnectRouter.put('/contacts/:id', (req: Request, res: Response) => {
  try {
    const me = getUserFromReq(req);
    if (!isAdmin(me.role)) return res.status(403).json({ error: 'Admin only.' });
    const { name, phone } = req.body || {};
    pcDb.prepare('UPDATE pc_contacts SET name = COALESCE(NULLIF(?,\'\'), name), phone = ? WHERE id = ?').run(name ? String(name).trim() : '', phone ? String(phone).trim() : null, req.params.id);
    return res.json({ success: true });
  } catch (e: any) { return res.status(e.message === 'Unauthorized' ? 401 : 500).json({ error: e.message }); }
});

parentConnectRouter.post('/contacts/:id/authorize', (req: Request, res: Response) => {
  try {
    const me = getUserFromReq(req);
    if (!isAdmin(me.role)) return res.status(403).json({ error: 'Admin only.' });
    const on = !!req.body?.authorized;
    pcDb.prepare('UPDATE pc_contacts SET is_authorized = ? WHERE id = ?').run(on ? 1 : 0, req.params.id);
    return res.json({ success: true });
  } catch (e: any) { return res.status(e.message === 'Unauthorized' ? 401 : 500).json({ error: e.message }); }
});
