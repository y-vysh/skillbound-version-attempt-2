import type { Response } from 'express';
import { db } from '../db/database.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';

export function getAdminOverview(_req: AuthenticatedRequest, res: Response): void {
  const totalUsers = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'student'").get() as { c: number }).c;
  const totalSessions = (db.prepare('SELECT COUNT(*) as c FROM sessions').get() as { c: number }).c;
  const completedSessions = (
    db.prepare("SELECT COUNT(*) as c FROM sessions WHERE status = 'Completed'").get() as { c: number }
  ).c;
  const totalRequests = (db.prepare('SELECT COUNT(*) as c FROM learning_requests').get() as { c: number }).c;
  const reportedUsersCount = (db.prepare('SELECT COUNT(*) as c FROM users WHERE is_reported = 1').get() as { c: number }).c;
  const totalSkills = (db.prepare('SELECT COUNT(*) as c FROM skills').get() as { c: number }).c;

  const users = db
    .prepare(
      `SELECT id, full_name, email, role, major, year, location, points, total_sessions,
              rating_avg, is_active, is_reported, report_reason, created_at
       FROM users
       ORDER BY is_reported DESC, created_at DESC`
    )
    .all();

  const recentSessions = db
    .prepare(
      `SELECT s.id, s.title, s.status, s.date_str, s.location,
              t.full_name as teacher_name, l.full_name as learner_name
       FROM sessions s
       JOIN users t ON t.id = s.teacher_id
       JOIN users l ON l.id = s.learner_id
       ORDER BY s.updated_at DESC, s.id DESC
       LIMIT 10`
    )
    .all();

  const recentRequests = db
    .prepare(
      `SELECT lr.id, lr.teach_skill_name, lr.learn_skill_name, lr.status, lr.created_at,
              s.full_name as sender_name, r.full_name as receiver_name
       FROM learning_requests lr
       JOIN users s ON s.id = lr.sender_id
       JOIN users r ON r.id = lr.receiver_id
       ORDER BY lr.created_at DESC, lr.id DESC
       LIMIT 10`
    )
    .all();

  res.json({
    stats: {
      totalUsers,
      totalSessions,
      completedSessions,
      totalRequests,
      reportedUsersCount,
      totalSkills,
    },
    users,
    recentSessions,
    recentRequests,
  });
}

export function manageUser(req: AuthenticatedRequest, res: Response): void {
  const targetId = Number(req.params.id);
  const { action } = req.body as { action?: 'suspend' | 'activate' | 'clear_report' };

  if (!Number.isFinite(targetId)) {
    res.status(400).json({ error: 'Invalid user ID.' });
    return;
  }
  if (req.user && targetId === req.user.id) {
    res.status(400).json({ error: 'Administrators cannot suspend their own account.' });
    return;
  }

  const target = db.prepare('SELECT id, role FROM users WHERE id = ?').get(targetId) as
    | { id: number; role: string }
    | undefined;
  if (!target) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  if (action === 'suspend') {
    db.prepare("UPDATE users SET is_active = 0, updated_at = datetime('now') WHERE id = ?").run(targetId);
  } else if (action === 'activate') {
    db.prepare("UPDATE users SET is_active = 1, updated_at = datetime('now') WHERE id = ?").run(targetId);
  } else if (action === 'clear_report') {
    db.prepare("UPDATE users SET is_reported = 0, report_reason = '', updated_at = datetime('now') WHERE id = ?").run(
      targetId
    );
  } else {
    res.status(400).json({ error: 'Invalid action.' });
    return;
  }

  const updated = db
    .prepare(
      `SELECT id, full_name, email, role, major, year, location, points, total_sessions,
              rating_avg, is_active, is_reported, report_reason, created_at
       FROM users WHERE id = ?`
    )
    .get(targetId);

  res.json({ user: updated });
}

export function deleteUserAdmin(req: AuthenticatedRequest, res: Response): void {
  const targetId = Number(req.params.id);
  if (!Number.isFinite(targetId)) {
    res.status(400).json({ error: 'Invalid user ID.' });
    return;
  }
  if (req.user && targetId === req.user.id) {
    res.status(400).json({ error: 'Cannot delete the active admin account.' });
    return;
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(targetId);
  res.json({ deletedId: targetId });
}
