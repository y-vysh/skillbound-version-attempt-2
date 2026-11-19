import type { Response } from 'express';
import { db } from '../db/database.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';

export function listRequests(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const received = db
    .prepare(
      `SELECT lr.*, u.full_name as peer_name, u.major as peer_major, u.year as peer_year,
              u.location as peer_location, u.avatar_url as peer_avatar, u.rating_avg as peer_rating
       FROM learning_requests lr
       JOIN users u ON u.id = lr.sender_id
       WHERE lr.receiver_id = ?
       ORDER BY lr.created_at DESC, lr.id DESC`
    )
    .all(req.user.id);

  const sent = db
    .prepare(
      `SELECT lr.*, u.full_name as peer_name, u.major as peer_major, u.year as peer_year,
              u.location as peer_location, u.avatar_url as peer_avatar, u.rating_avg as peer_rating
       FROM learning_requests lr
       JOIN users u ON u.id = lr.receiver_id
       WHERE lr.sender_id = ?
       ORDER BY lr.created_at DESC, lr.id DESC`
    )
    .all(req.user.id);

  res.json({ received, sent });
}

export function createRequest(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { receiverId, teachSkillName, learnSkillName, proposedSlot, proposedLocation, message } = req.body as {
    receiverId?: number;
    teachSkillName?: string;
    learnSkillName?: string;
    proposedSlot?: string;
    proposedLocation?: string;
    message?: string;
  };

  const targetId = Number(receiverId);
  if (!Number.isFinite(targetId) || targetId === req.user.id) {
    res.status(400).json({ error: 'Please select a valid peer.' });
    return;
  }
  if (!learnSkillName || !learnSkillName.trim()) {
    res.status(400).json({ error: 'Please specify the skill you want to learn.' });
    return;
  }

  const receiver = db.prepare('SELECT id, full_name FROM users WHERE id = ? AND is_active = 1').get(targetId) as
    | { id: number; full_name: string }
    | undefined;
  if (!receiver) {
    res.status(404).json({ error: 'Peer user not found.' });
    return;
  }

  // Prevent duplicate active pending request to the same user for the same skill
  const dup = db
    .prepare(
      `SELECT id FROM learning_requests
       WHERE sender_id = ? AND receiver_id = ? AND status = 'Pending' AND LOWER(learn_skill_name) = LOWER(?)`
    )
    .get(req.user.id, targetId, learnSkillName.trim());
  if (dup) {
    res.status(409).json({ error: 'You already have a pending request with this peer for this skill.' });
    return;
  }

  const teachLabel = (teachSkillName || 'Peer Skill Exchange').trim();
  const learnLabel = learnSkillName.trim();
  const slotLabel = (proposedSlot || 'Flexible this week').trim();
  const locLabel = (proposedLocation || 'Campus Library').trim();
  const msgText = (message || `Hi ${receiver.full_name}! Would love to swap ${teachLabel} for ${learnLabel}.`).trim();

  const info = db
    .prepare(
      `INSERT INTO learning_requests
       (sender_id, receiver_id, teach_skill_name, learn_skill_name, proposed_slot, proposed_location, message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`
    )
    .run(req.user.id, targetId, teachLabel, learnLabel, slotLabel, locLabel, msgText);

  const reqId = Number(info.lastInsertRowid);

  // Notify receiver
  db.prepare(
    'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)'
  ).run(
    targetId,
    'request',
    'New Learning Request',
    `${req.user.full_name} wants to learn ${learnLabel} and offers ${teachLabel}.`,
    '/requests'
  );

  // Ensure a conversation exists between sender and receiver
  const p1 = Math.min(req.user.id, targetId);
  const p2 = Math.max(req.user.id, targetId);
  db.prepare('INSERT OR IGNORE INTO conversations (participant1_id, participant2_id) VALUES (?, ?)').run(p1, p2);

  const created = db.prepare('SELECT * FROM learning_requests WHERE id = ?').get(reqId);
  res.status(201).json({ request: created });
}

export function updateRequestStatus(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const reqId = Number(req.params.id);
  const { status } = req.body as { status?: string };

  const existing = db.prepare('SELECT * FROM learning_requests WHERE id = ?').get(reqId) as
    | {
        id: number;
        sender_id: number;
        receiver_id: number;
        teach_skill_name: string;
        learn_skill_name: string;
        status: string;
      }
    | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Learning request not found.' });
    return;
  }

  if (status === 'Accepted' || status === 'Rejected') {
    if (existing.receiver_id !== req.user.id) {
      res.status(403).json({ error: 'Only the recipient can accept or decline this request.' });
      return;
    }
    if (existing.status !== 'Pending') {
      res.status(400).json({ error: `Cannot change a request that is already ${existing.status}.` });
      return;
    }
  } else if (status === 'Cancelled') {
    if (existing.sender_id !== req.user.id) {
      res.status(403).json({ error: 'Only the sender can cancel this request.' });
      return;
    }
    if (existing.status !== 'Pending') {
      res.status(400).json({ error: 'Only pending requests can be cancelled.' });
      return;
    }
  } else {
    res.status(400).json({ error: 'Invalid status transition.' });
    return;
  }

  db.prepare("UPDATE learning_requests SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, reqId);

  if (status === 'Accepted' || status === 'Rejected') {
    db.prepare(
      'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)'
    ).run(
      existing.sender_id,
      'request',
      `Request ${status}`,
      `${req.user.full_name} ${status.toLowerCase()} your skill exchange request for ${existing.learn_skill_name}.`,
      '/requests'
    );
  }

  if (status === 'Accepted') {
    const p1 = Math.min(existing.sender_id, existing.receiver_id);
    const p2 = Math.max(existing.sender_id, existing.receiver_id);
    db.prepare('INSERT OR IGNORE INTO conversations (participant1_id, participant2_id) VALUES (?, ?)').run(p1, p2);
  }

  const updated = db.prepare('SELECT * FROM learning_requests WHERE id = ?').get(reqId);
  res.json({ request: updated });
}
