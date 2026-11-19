import type { Response } from 'express';
import { db } from '../db/database.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import {
  awardPointsOnce,
  computeProfileCompletion,
  getUserLevel,
  recomputeUserAchievements,
} from '../utils/points.ts';
import { computePeerMatch, type PeerUserRecord, type SkillRecord } from '../utils/matching.ts';

function sanitizeUser(userRow: Record<string, unknown>) {
  const { password_hash: _ph, ...safe } = userRow;
  return safe;
}

export function updateProfile(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { full_name, bio, location, major, year, experience_level, availability } = req.body as {
    full_name?: string;
    bio?: string;
    location?: string;
    major?: string;
    year?: string;
    experience_level?: string;
    availability?: string;
  };

  if (full_name !== undefined && !full_name.trim()) {
    res.status(400).json({ error: 'Full name cannot be empty.' });
    return;
  }

  const current = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id) as Record<string, unknown>;
  if (!current) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  const nextName = full_name !== undefined ? full_name.trim() : String(current.full_name);
  const nextBio = bio !== undefined ? bio.trim() : String(current.bio);
  const nextLocation = location !== undefined ? location.trim() : String(current.location);
  const nextMajor = major !== undefined ? major.trim() : String(current.major);
  const nextYear = year !== undefined ? year.trim() : String(current.year);
  const nextExp = experience_level !== undefined ? experience_level.trim() : String(current.experience_level);
  const nextAvail = availability !== undefined ? availability.trim() : String(current.availability);

  db.prepare(
    `UPDATE users
     SET full_name = ?, bio = ?, location = ?, major = ?, year = ?, experience_level = ?, availability = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(nextName, nextBio, nextLocation, nextMajor, nextYear, nextExp, nextAvail, req.user.id);

  const teachSkills = db
    .prepare("SELECT * FROM skills WHERE user_id = ? AND direction = 'teach'")
    .all(req.user.id);
  const learnSkills = db
    .prepare("SELECT * FROM skills WHERE user_id = ? AND direction = 'learn'")
    .all(req.user.id);

  const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id) as Record<string, unknown> & {
    full_name: string;
    bio: string;
    location: string;
    major: string;
    year: string;
    availability: string;
    points: number;
  };

  const completion = computeProfileCompletion(updatedUser, teachSkills.length, learnSkills.length);
  let awardedProfileBonus = false;
  if (completion >= 85) {
    awardedProfileBonus = awardPointsOnce(
      req.user.id,
      'profile_complete',
      'initial',
      20,
      'Completed personal profile'
    );
  }
  recomputeUserAchievements(req.user.id);

  const finalUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id) as Record<string, unknown> & {
    points: number;
  };

  res.json({
    user: sanitizeUser(finalUser),
    profileCompletion: completion,
    awardedProfileBonus,
    levelInfo: getUserLevel(finalUser.points),
  });
}

export function uploadAvatar(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: 'Please upload an image file.' });
    return;
  }

  const avatarUrl = `/uploads/${req.file.filename}`;
  db.prepare("UPDATE users SET avatar_url = ?, updated_at = datetime('now') WHERE id = ?").run(
    avatarUrl,
    req.user.id
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id) as Record<string, unknown>;
  res.json({ avatar_url: avatarUrl, user: sanitizeUser(updated) });
}

export function getPeerProfile(req: AuthenticatedRequest, res: Response): void {
  const peerId = Number(req.params.id);
  if (!Number.isFinite(peerId)) {
    res.status(400).json({ error: 'Invalid user ID.' });
    return;
  }

  const peer = db
    .prepare(
      `SELECT id, full_name, email, bio, location, major, year, experience_level, availability,
              avatar_url, points, total_sessions, rating_avg, rating_count, created_at
       FROM users WHERE id = ? AND is_active = 1 AND role = 'student'`
    )
    .get(peerId) as PeerUserRecord | undefined;

  if (!peer) {
    res.status(404).json({ error: 'Student profile not found.' });
    return;
  }

  const peerTeach = db
    .prepare("SELECT * FROM skills WHERE user_id = ? AND direction = 'teach' ORDER BY id DESC")
    .all(peerId) as SkillRecord[];
  const peerLearn = db
    .prepare("SELECT * FROM skills WHERE user_id = ? AND direction = 'learn' ORDER BY id DESC")
    .all(peerId) as SkillRecord[];

  const reviews = db
    .prepare(
      `SELECT r.*, u.full_name as reviewer_name, u.major as reviewer_major, u.avatar_url as reviewer_avatar
       FROM reviews r
       JOIN users u ON u.id = r.reviewer_id
       WHERE r.reviewee_id = ?
       ORDER BY r.created_at DESC`
    )
    .all(peerId);

  const achievements = db
    .prepare('SELECT * FROM achievements WHERE user_id = ? ORDER BY unlocked_at DESC')
    .all(peerId);

  let matchInfo = null;
  if (req.user && req.user.id !== peerId) {
    const myTeach = db
      .prepare("SELECT * FROM skills WHERE user_id = ? AND direction = 'teach'")
      .all(req.user.id) as SkillRecord[];
    const myLearn = db
      .prepare("SELECT * FROM skills WHERE user_id = ? AND direction = 'learn'")
      .all(req.user.id) as SkillRecord[];
    matchInfo = computePeerMatch(myTeach, myLearn, peer, peerTeach, peerLearn);
  }

  res.json({
    peer,
    teachSkills: peerTeach,
    learnSkills: peerLearn,
    reviews,
    achievements,
    levelInfo: getUserLevel(peer.points),
    matchInfo,
  });
}

export function reportUser(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const targetId = Number(req.params.id);
  const { reason } = req.body as { reason?: string };

  if (!Number.isFinite(targetId) || targetId === req.user.id) {
    res.status(400).json({ error: 'Invalid user to report.' });
    return;
  }

  const target = db.prepare('SELECT id, full_name FROM users WHERE id = ?').get(targetId) as
    | { id: number; full_name: string }
    | undefined;
  if (!target) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  const cleanReason = (reason || 'Reported by peer for review').trim().slice(0, 300);
  db.prepare("UPDATE users SET is_reported = 1, report_reason = ?, updated_at = datetime('now') WHERE id = ?").run(
    cleanReason,
    targetId
  );

  res.json({ message: `Report submitted for ${target.full_name}. Campus administrators will review it.` });
}

export function getDashboardData(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id) as Record<string, unknown> & {
    id: number;
    points: number;
    full_name: string;
    bio: string;
    location: string;
    major: string;
    year: string;
    availability: string;
  };

  const teachSkills = db
    .prepare("SELECT * FROM skills WHERE user_id = ? AND direction = 'teach' ORDER BY id DESC")
    .all(req.user.id) as SkillRecord[];
  const learnSkills = db
    .prepare("SELECT * FROM skills WHERE user_id = ? AND direction = 'learn' ORDER BY id DESC")
    .all(req.user.id) as SkillRecord[];

  const pendingReceivedCount = (
    db
      .prepare("SELECT COUNT(*) as count FROM learning_requests WHERE receiver_id = ? AND status = 'Pending'")
      .get(req.user.id) as { count: number }
  ).count;

  const pendingSentCount = (
    db
      .prepare("SELECT COUNT(*) as count FROM learning_requests WHERE sender_id = ? AND status = 'Pending'")
      .get(req.user.id) as { count: number }
  ).count;

  const upcomingSessions = db
    .prepare(
      `SELECT s.*,
              t.full_name as teacher_name, t.major as teacher_major, t.year as teacher_year, t.rating_avg as teacher_rating, t.total_sessions as teacher_sessions, t.avatar_url as teacher_avatar,
              l.full_name as learner_name, l.major as learner_major, l.year as learner_year, l.rating_avg as learner_rating, l.total_sessions as learner_sessions, l.avatar_url as learner_avatar
       FROM sessions s
       JOIN users t ON t.id = s.teacher_id
       JOIN users l ON l.id = s.learner_id
       WHERE (s.teacher_id = ? OR s.learner_id = ?) AND s.status = 'Upcoming'
       ORDER BY s.date_str ASC, s.id ASC`
    )
    .all(req.user.id, req.user.id);

  // Recommended matches using rule-based matching
  const otherPeers = db
    .prepare(
      `SELECT id, full_name, email, bio, location, major, year, experience_level, availability,
              avatar_url, points, total_sessions, rating_avg, rating_count
       FROM users
       WHERE id != ? AND role = 'student' AND is_active = 1`
    )
    .all(req.user.id) as PeerUserRecord[];

  const allSkills = db.prepare('SELECT * FROM skills').all() as SkillRecord[];
  const skillsByUser = new Map<number, { teach: SkillRecord[]; learn: SkillRecord[] }>();
  for (const sk of allSkills) {
    const entry = skillsByUser.get(sk.user_id) || { teach: [], learn: [] };
    if (sk.direction === 'teach') entry.teach.push(sk);
    else entry.learn.push(sk);
    skillsByUser.set(sk.user_id, entry);
  }

  const matches = otherPeers
    .map((peer) => {
      const pSkills = skillsByUser.get(peer.id) || { teach: [], learn: [] };
      return computePeerMatch(teachSkills, learnSkills, peer, pSkills.teach, pSkills.learn);
    })
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 4);

  const recentActivities = db
    .prepare('SELECT * FROM points_transactions WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 5')
    .all(req.user.id);

  const unreadMessagesCount = (
    db
      .prepare(
        `SELECT COUNT(*) as count
         FROM messages m
         JOIN conversations c ON c.id = m.conversation_id
         WHERE (c.participant1_id = ? OR c.participant2_id = ?) AND m.sender_id != ? AND m.is_read = 0`
      )
      .get(req.user.id, req.user.id, req.user.id) as { count: number }
  ).count;

  const notifications = db
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 10')
    .all(req.user.id);

  res.json({
    user: sanitizeUser(user),
    profileCompletion: computeProfileCompletion(user, teachSkills.length, learnSkills.length),
    levelInfo: getUserLevel(user.points),
    teachSkills,
    learnSkills,
    pendingReceivedCount,
    pendingSentCount,
    upcomingSessions,
    recommendedMatches: matches,
    recentActivities,
    unreadMessagesCount,
    notifications,
  });
}

export function getNotifications(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const notifications = db
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 25')
    .all(req.user.id);
  res.json({ notifications });
}

export function markNotificationsRead(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ ok: true });
}
