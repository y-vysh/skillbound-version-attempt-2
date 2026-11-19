import type { Response } from 'express';
import { db } from '../db/database.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { awardPointsOnce, recomputeUserAchievements } from '../utils/points.ts';

export function listSessions(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const sessions = db
    .prepare(
      `SELECT s.*,
              t.full_name as teacher_name, t.major as teacher_major, t.year as teacher_year, t.avatar_url as teacher_avatar,
              l.full_name as learner_name, l.major as learner_major, l.year as learner_year, l.avatar_url as learner_avatar,
              EXISTS(SELECT 1 FROM reviews r WHERE r.session_id = s.id AND r.reviewer_id = ?) as has_reviewed
       FROM sessions s
       JOIN users t ON t.id = s.teacher_id
       JOIN users l ON l.id = s.learner_id
       WHERE s.teacher_id = ? OR s.learner_id = ?
       ORDER BY s.date_str ASC, s.id DESC`
    )
    .all(req.user.id, req.user.id, req.user.id);

  // Also return accepted requests & connected peers so user can schedule easily
  const acceptedConnections = db
    .prepare(
      `SELECT lr.id as request_id, lr.sender_id, lr.receiver_id, lr.teach_skill_name, lr.learn_skill_name,
              lr.proposed_slot, lr.proposed_location,
              CASE WHEN lr.sender_id = ? THEN r.id ELSE s.id END as peer_id,
              CASE WHEN lr.sender_id = ? THEN r.full_name ELSE s.full_name END as peer_name,
              CASE WHEN lr.sender_id = ? THEN r.major ELSE s.major END as peer_major
       FROM learning_requests lr
       JOIN users s ON s.id = lr.sender_id
       JOIN users r ON r.id = lr.receiver_id
       WHERE (lr.sender_id = ? OR lr.receiver_id = ?) AND lr.status = 'Accepted'
       ORDER BY lr.updated_at DESC`
    )
    .all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);

  res.json({ sessions, acceptedConnections });
}

export function createSession(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { requestId, partnerId, title, teachSkillName, learnSkillName, dateStr, timeStr, location, description, role } =
    req.body as {
      requestId?: number;
      partnerId?: number;
      title?: string;
      teachSkillName?: string;
      learnSkillName?: string;
      dateStr?: string;
      timeStr?: string;
      location?: string;
      description?: string;
      role?: 'teacher' | 'learner';
    };

  if (!title || !title.trim() || !dateStr || !timeStr) {
    res.status(400).json({ error: 'Session title, date, and time are required.' });
    return;
  }

  let teacherId = req.user.id;
  let learnerId = Number(partnerId);
  let resolvedTeach = (teachSkillName || 'Skill Exchange').trim();
  let resolvedLearn = (learnSkillName || '').trim();
  let linkedRequestId: number | null = null;

  if (requestId) {
    const lr = db.prepare('SELECT * FROM learning_requests WHERE id = ?').get(Number(requestId)) as
      | {
          id: number;
          sender_id: number;
          receiver_id: number;
          teach_skill_name: string;
          learn_skill_name: string;
          status: string;
        }
      | undefined;

    if (!lr) {
      res.status(404).json({ error: 'Learning request not found.' });
      return;
    }
    if (lr.sender_id !== req.user.id && lr.receiver_id !== req.user.id) {
      res.status(403).json({ error: 'Not authorized for this learning request.' });
      return;
    }
    if (lr.status !== 'Accepted') {
      res.status(400).json({ error: 'You can only schedule a session for an accepted request.' });
      return;
    }

    linkedRequestId = lr.id;
    // Receiver teaches learn_skill_name to sender, sender teaches teach_skill_name
    teacherId = lr.receiver_id;
    learnerId = lr.sender_id;
    resolvedTeach = teachSkillName?.trim() || lr.learn_skill_name;
    resolvedLearn = learnSkillName?.trim() || lr.teach_skill_name;
  } else {
    if (!Number.isFinite(learnerId) || learnerId === req.user.id) {
      res.status(400).json({ error: 'Please select a valid learning partner.' });
      return;
    }
    if (role === 'learner') {
      teacherId = learnerId;
      learnerId = req.user.id;
    }
  }

  const info = db
    .prepare(
      `INSERT INTO sessions (request_id, teacher_id, learner_id, title, teach_skill_name, learn_skill_name, date_str, time_str, location, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Upcoming')`
    )
    .run(
      linkedRequestId,
      teacherId,
      learnerId,
      title.trim(),
      resolvedTeach,
      resolvedLearn,
      dateStr.trim(),
      timeStr.trim(),
      (location || 'Butler Library, Room 301').trim(),
      (description || '').trim()
    );

  const sessionId = Number(info.lastInsertRowid);
  const notifyUserId = teacherId === req.user.id ? learnerId : teacherId;

  db.prepare(
    'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)'
  ).run(
    notifyUserId,
    'session',
    'New Session Scheduled',
    `${req.user.full_name} scheduled "${title.trim()}" on ${dateStr} at ${timeStr}.`,
    '/sessions'
  );

  const created = db
    .prepare(
      `SELECT s.*,
              t.full_name as teacher_name, t.major as teacher_major, t.year as teacher_year, t.avatar_url as teacher_avatar,
              l.full_name as learner_name, l.major as learner_major, l.year as learner_year, l.avatar_url as learner_avatar,
              0 as has_reviewed
       FROM sessions s
       JOIN users t ON t.id = s.teacher_id
       JOIN users l ON l.id = s.learner_id
       WHERE s.id = ?`
    )
    .get(sessionId);

  res.status(201).json({ session: created });
}

export function updateSession(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const sessionId = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as
    | {
        id: number;
        request_id: number | null;
        teacher_id: number;
        learner_id: number;
        title: string;
        teach_skill_name: string;
        date_str: string;
        time_str: string;
        location: string;
        description: string;
        status: string;
      }
    | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Session not found.' });
    return;
  }
  if (existing.teacher_id !== req.user.id && existing.learner_id !== req.user.id) {
    res.status(403).json({ error: 'Only session participants can modify this session.' });
    return;
  }

  const { status, dateStr, timeStr, location, description, title } = req.body as {
    status?: 'Upcoming' | 'Completed' | 'Cancelled';
    dateStr?: string;
    timeStr?: string;
    location?: string;
    description?: string;
    title?: string;
  };

  if (status && status !== existing.status) {
    if (existing.status !== 'Upcoming') {
      res.status(400).json({ error: `Cannot change status of a session that is already ${existing.status}.` });
      return;
    }

    if (status === 'Completed') {
      const tx = db.transaction(() => {
        db.prepare("UPDATE sessions SET status = 'Completed', updated_at = datetime('now') WHERE id = ?").run(
          sessionId
        );
        db.prepare("UPDATE users SET total_sessions = total_sessions + 1, updated_at = datetime('now') WHERE id IN (?, ?)").run(
          existing.teacher_id,
          existing.learner_id
        );
        if (existing.request_id) {
          db.prepare("UPDATE learning_requests SET status = 'Completed', updated_at = datetime('now') WHERE id = ?").run(
            existing.request_id
          );
        }
      });
      tx();

      // Award points once per participant
      awardPointsOnce(
        existing.learner_id,
        'session_learn',
        sessionId,
        50,
        `Completed learning session: ${existing.title}`
      );
      awardPointsOnce(
        existing.teacher_id,
        'session_teach',
        sessionId,
        30,
        `Taught skill session: ${existing.teach_skill_name}`
      );
      recomputeUserAchievements(existing.teacher_id);
      recomputeUserAchievements(existing.learner_id);

      const otherId = existing.teacher_id === req.user.id ? existing.learner_id : existing.teacher_id;
      db.prepare(
        'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)'
      ).run(
        otherId,
        'session',
        'Session Marked Completed',
        `"${existing.title}" is completed! Leave a peer review to earn bonus points.`,
        `/feedback/${sessionId}`
      );
    } else if (status === 'Cancelled') {
      db.prepare("UPDATE sessions SET status = 'Cancelled', updated_at = datetime('now') WHERE id = ?").run(sessionId);
      const otherId = existing.teacher_id === req.user.id ? existing.learner_id : existing.teacher_id;
      db.prepare(
        'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)'
      ).run(
        otherId,
        'session',
        'Session Cancelled',
        `${req.user.full_name} cancelled the session "${existing.title}".`,
        '/sessions'
      );
    }
  } else {
    // Reschedule / edit details
    db.prepare(
      `UPDATE sessions
       SET title = ?, date_str = ?, time_str = ?, location = ?, description = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      title !== undefined ? title.trim() : existing.title,
      dateStr !== undefined ? dateStr.trim() : existing.date_str,
      timeStr !== undefined ? timeStr.trim() : existing.time_str,
      location !== undefined ? location.trim() : existing.location,
      description !== undefined ? description.trim() : existing.description,
      sessionId
    );
  }

  const updated = db
    .prepare(
      `SELECT s.*,
              t.full_name as teacher_name, t.major as teacher_major, t.year as teacher_year, t.avatar_url as teacher_avatar,
              l.full_name as learner_name, l.major as learner_major, l.year as learner_year, l.avatar_url as learner_avatar,
              EXISTS(SELECT 1 FROM reviews r WHERE r.session_id = s.id AND r.reviewer_id = ?) as has_reviewed
       FROM sessions s
       JOIN users t ON t.id = s.teacher_id
       JOIN users l ON l.id = s.learner_id
       WHERE s.id = ?`
    )
    .get(req.user.id, sessionId);

  res.json({ session: updated });
}
