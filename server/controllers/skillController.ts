import type { Response } from 'express';
import { db } from '../db/database.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { computePeerMatch, type PeerUserRecord, type SkillRecord } from '../utils/matching.ts';
import { awardPointsOnce, computeProfileCompletion, recomputeUserAchievements } from '../utils/points.ts';

export const SKILL_CATEGORIES = [
  'Programming',
  'Web Development',
  'Graphic Design',
  'Photography',
  'Communication',
  'Marketing',
  'Business',
  'Music',
  'Languages',
  'Personal Development',
];

export function getMySkills(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const skills = db
    .prepare('SELECT * FROM skills WHERE user_id = ? ORDER BY created_at DESC, id DESC')
    .all(req.user.id) as SkillRecord[];

  const teachSkills = skills.filter((s) => s.direction === 'teach');
  const learnSkills = skills.filter((s) => s.direction === 'learn');

  res.json({ teachSkills, learnSkills, categories: SKILL_CATEGORIES });
}

export function createSkill(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { name, category, direction, proficiency, description } = req.body as {
    name?: string;
    category?: string;
    direction?: 'teach' | 'learn';
    proficiency?: string;
    description?: string;
  };

  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Skill name is required.' });
    return;
  }
  if (direction !== 'teach' && direction !== 'learn') {
    res.status(400).json({ error: 'Direction must be either teach or learn.' });
    return;
  }
  const cleanCat = (category || 'Programming').trim();
  const cleanProf = (proficiency || 'Intermediate').trim();
  const cleanDesc = (description || '').trim();

  const info = db
    .prepare(
      `INSERT INTO skills (user_id, name, category, direction, proficiency, description)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(req.user.id, name.trim(), cleanCat, direction, cleanProf, cleanDesc);

  const created = db.prepare('SELECT * FROM skills WHERE id = ?').get(Number(info.lastInsertRowid));

  // Check if profile completion bonus qualifies now
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id) as {
    full_name: string;
    bio: string;
    location: string;
    major: string;
    year: string;
    availability: string;
  };
  const teachCount = (
    db.prepare("SELECT COUNT(*) as c FROM skills WHERE user_id = ? AND direction = 'teach'").get(req.user.id) as { c: number }
  ).c;
  const learnCount = (
    db.prepare("SELECT COUNT(*) as c FROM skills WHERE user_id = ? AND direction = 'learn'").get(req.user.id) as { c: number }
  ).c;
  if (computeProfileCompletion(user, teachCount, learnCount) >= 85) {
    awardPointsOnce(req.user.id, 'profile_complete', 'initial', 20, 'Completed campus profile');
  }
  recomputeUserAchievements(req.user.id);

  res.status(201).json({ skill: created });
}

export function updateSkill(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const skillId = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM skills WHERE id = ?').get(skillId) as SkillRecord | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Skill not found.' });
    return;
  }
  if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: 'You can only edit your own skills.' });
    return;
  }

  const { name, category, direction, proficiency, description } = req.body as {
    name?: string;
    category?: string;
    direction?: 'teach' | 'learn';
    proficiency?: string;
    description?: string;
  };

  const nextName = name !== undefined ? name.trim() : existing.name;
  if (!nextName) {
    res.status(400).json({ error: 'Skill name cannot be empty.' });
    return;
  }

  const nextDir = direction === 'teach' || direction === 'learn' ? direction : existing.direction;
  const nextCat = category !== undefined ? category.trim() : existing.category;
  const nextProf = proficiency !== undefined ? proficiency.trim() : existing.proficiency;
  const nextDesc = description !== undefined ? description.trim() : existing.description;

  db.prepare(
    `UPDATE skills SET name = ?, category = ?, direction = ?, proficiency = ?, description = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(nextName, nextCat, nextDir, nextProf, nextDesc, skillId);

  const updated = db.prepare('SELECT * FROM skills WHERE id = ?').get(skillId);
  res.json({ skill: updated });
}

export function deleteSkill(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const skillId = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM skills WHERE id = ?').get(skillId) as SkillRecord | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Skill not found.' });
    return;
  }
  if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: 'You can only delete your own skills.' });
    return;
  }

  db.prepare('DELETE FROM skills WHERE id = ?').run(skillId);
  res.json({ deletedId: skillId });
}

export function discoverPeers(req: AuthenticatedRequest, res: Response): void {
  const search = String(req.query.q || '').trim().toLowerCase();
  const category = String(req.query.category || '').trim();
  const level = String(req.query.level || '').trim();
  const location = String(req.query.location || '').trim();
  const mutualOnly = String(req.query.mutualOnly || '') === 'true';

  const currentUserId = req.user ? req.user.id : -1;

  const peers = db
    .prepare(
      `SELECT id, full_name, email, bio, location, major, year, experience_level, availability,
              avatar_url, points, total_sessions, rating_avg, rating_count
       FROM users
       WHERE id != ? AND role = 'student' AND is_active = 1`
    )
    .all(currentUserId) as PeerUserRecord[];

  const allSkills = db.prepare('SELECT * FROM skills').all() as SkillRecord[];
  const skillsByUser = new Map<number, { teach: SkillRecord[]; learn: SkillRecord[] }>();
  for (const sk of allSkills) {
    const entry = skillsByUser.get(sk.user_id) || { teach: [], learn: [] };
    if (sk.direction === 'teach') entry.teach.push(sk);
    else entry.learn.push(sk);
    skillsByUser.set(sk.user_id, entry);
  }

  const mySkills = currentUserId > 0 ? skillsByUser.get(currentUserId) || { teach: [], learn: [] } : { teach: [], learn: [] };

  let results = peers.map((peer) => {
    const pSkills = skillsByUser.get(peer.id) || { teach: [], learn: [] };
    return computePeerMatch(mySkills.teach, mySkills.learn, peer, pSkills.teach, pSkills.learn);
  });

  if (search) {
    results = results.filter((r) => {
      const hay = [
        r.peer.full_name,
        r.peer.bio,
        r.peer.major,
        r.peer.location,
        ...r.teachSkills.map((s) => `${s.name} ${s.category} ${s.description}`),
        ...r.learnSkills.map((s) => `${s.name} ${s.category}`),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(search);
    });
  }

  if (category && category !== 'All') {
    results = results.filter((r) => r.teachSkills.some((s) => s.category === category));
  }

  if (level && level !== 'All') {
    results = results.filter(
      (r) =>
        r.peer.experience_level.toLowerCase() === level.toLowerCase() ||
        r.teachSkills.some((s) => s.proficiency.toLowerCase() === level.toLowerCase())
    );
  }

  if (location && location !== 'All') {
    results = results.filter((r) => r.peer.location.toLowerCase().includes(location.toLowerCase()));
  }

  if (mutualOnly) {
    results = results.filter((r) => r.isMutualMatch);
  }

  results.sort((a, b) => {
    if (a.isMutualMatch !== b.isMutualMatch) return a.isMutualMatch ? -1 : 1;
    return b.matchPercentage - a.matchPercentage;
  });

  const locations = Array.from(new Set(peers.map((p) => p.location).filter(Boolean)));

  res.json({
    matches: results,
    categories: SKILL_CATEGORIES,
    locations,
  });
}
