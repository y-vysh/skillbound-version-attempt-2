import type { Response } from 'express';
import { db } from '../db/database.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { awardPointsOnce, recomputeUserAchievements } from '../utils/points.ts';

export function submitReview(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { sessionId, rating, tags, comment } = req.body as {
    sessionId?: number;
    rating?: number;
    tags?: string[];
    comment?: string;
  };

  const sid = Number(sessionId);
  const stars = Number(rating);

  if (!Number.isFinite(sid)) {
    res.status(400).json({ error: 'Valid sessionId is required.' });
    return;
  }
  if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
    res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
    return;
  }

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sid) as
    | { id: number; teacher_id: number; learner_id: number; status: string; title: string }
    | undefined;

  if (!session) {
    res.status(404).json({ error: 'Session not found.' });
    return;
  }
  if (session.teacher_id !== req.user.id && session.learner_id !== req.user.id) {
    res.status(403).json({ error: 'Only session participants can submit a review.' });
    return;
  }
  if (session.status !== 'Completed') {
    res.status(400).json({ error: 'You can only review a completed session.' });
    return;
  }

  const duplicate = db
    .prepare('SELECT id FROM reviews WHERE session_id = ? AND reviewer_id = ?')
    .get(sid, req.user.id);
  if (duplicate) {
    res.status(409).json({ error: 'You have already submitted a review for this session.' });
    return;
  }

  const revieweeId = session.teacher_id === req.user.id ? session.learner_id : session.teacher_id;
  const cleanTags = Array.isArray(tags) ? JSON.stringify(tags.slice(0, 6)) : '[]';
  const cleanComment = (comment || '').trim().slice(0, 500);

  const info = db
    .prepare(
      'INSERT INTO reviews (session_id, reviewer_id, reviewee_id, rating, tags_json, comment) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(sid, req.user.id, revieweeId, stars, cleanTags, cleanComment);

  // Recompute reviewee rating aggregate
  const stats = db
    .prepare('SELECT COUNT(*) as cnt, COALESCE(AVG(rating), 0) as avg_rating FROM reviews WHERE reviewee_id = ?')
    .get(revieweeId) as { cnt: number; avg_rating: number };

  db.prepare("UPDATE users SET rating_avg = ?, rating_count = ?, updated_at = datetime('now') WHERE id = ?").run(
    Math.round(stats.avg_rating * 10) / 10,
    stats.cnt,
    revieweeId
  );

  // Award +10 points for positive review (rating >= 4)
  if (stars >= 4) {
    awardPointsOnce(
      revieweeId,
      'positive_review',
      sid,
      10,
      `Received ${stars}-star peer review for "${session.title}"`
    );
  }
  recomputeUserAchievements(revieweeId);

  db.prepare(
    'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)'
  ).run(
    revieweeId,
    'review',
    'New Peer Review Received',
    `${req.user.full_name} rated your "${session.title}" session ${stars}/5 stars.`,
    '/profile'
  );

  const created = db.prepare('SELECT * FROM reviews WHERE id = ?').get(Number(info.lastInsertRowid));
  res.status(201).json({ review: created });
}

export function getUserReviews(req: AuthenticatedRequest, res: Response): void {
  const userId = Number(req.params.userId);
  if (!Number.isFinite(userId)) {
    res.status(400).json({ error: 'Invalid user ID.' });
    return;
  }
  const reviews = db
    .prepare(
      `SELECT r.*, u.full_name as reviewer_name, u.major as reviewer_major, u.avatar_url as reviewer_avatar,
              s.title as session_title
       FROM reviews r
       JOIN users u ON u.id = r.reviewer_id
       JOIN sessions s ON s.id = r.session_id
       WHERE r.reviewee_id = ?
       ORDER BY r.created_at DESC`
    )
    .all(userId);
  res.json({ reviews });
}
