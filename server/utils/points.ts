import { db } from '../db/database.ts';

export interface UserLevelInfo {
  level: number;
  title: string;
  currentPoints: number;
  nextLevelPoints: number;
  progressPercent: number;
}

export function getUserLevel(points: number): UserLevelInfo {
  const tiers = [
    { level: 1, title: 'Campus Newcomer', min: 0, max: 50 },
    { level: 2, title: 'Peer Explorer', min: 50, max: 150 },
    { level: 3, title: 'Active Exchanger', min: 150, max: 300 },
    { level: 4, title: 'Campus Mentor', min: 300, max: 500 },
    { level: 5, title: 'Master Educator', min: 500, max: 1000 },
  ];

  let current = tiers[0];
  for (const tier of tiers) {
    if (points >= tier.min) {
      current = tier;
    }
  }

  const span = Math.max(1, current.max - current.min);
  const progressPercent = Math.min(100, Math.round(((points - current.min) / span) * 100));

  return {
    level: current.level,
    title: current.title,
    currentPoints: points,
    nextLevelPoints: current.max,
    progressPercent,
  };
}

export function awardPointsOnce(
  userId: number,
  actionType: string,
  referenceId: string | number,
  points: number,
  description: string
): boolean {
  const ref = String(referenceId);
  try {
    const existing = db
      .prepare('SELECT id FROM points_transactions WHERE user_id = ? AND action_type = ? AND reference_id = ?')
      .get(userId, actionType, ref);
    if (existing) {
      return false;
    }

    const insertTx = db.prepare(
      'INSERT INTO points_transactions (user_id, action_type, reference_id, points, description) VALUES (?, ?, ?, ?, ?)'
    );
    const updateUser = db.prepare('UPDATE users SET points = points + ?, updated_at = datetime(\'now\') WHERE id = ?');

    const runTx = db.transaction(() => {
      insertTx.run(userId, actionType, ref, points, description);
      updateUser.run(points, userId);
    });
    runTx();

    recomputeUserAchievements(userId);
    return true;
  } catch {
    return false;
  }
}

export function unlockAchievementOnce(
  userId: number,
  badgeKey: string,
  badgeName: string,
  badgeDescription: string,
  icon: string
): boolean {
  const existing = db
    .prepare('SELECT id FROM achievements WHERE user_id = ? AND badge_key = ?')
    .get(userId, badgeKey);
  if (existing) return false;

  db.prepare(
    'INSERT INTO achievements (user_id, badge_key, badge_name, badge_description, icon) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, badgeKey, badgeName, badgeDescription, icon);

  db.prepare(
    'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)'
  ).run(
    userId,
    'achievement',
    `Badge Unlocked: ${badgeName}`,
    badgeDescription,
    '/rewards'
  );
  return true;
}

export function recomputeUserAchievements(userId: number): void {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as
    | { points: number; total_sessions: number; rating_avg: number; rating_count: number; bio: string; location: string; availability: string }
    | undefined;
  if (!user) return;

  const teachCountRow = db
    .prepare("SELECT COUNT(*) as count FROM skills WHERE user_id = ? AND direction = 'teach'")
    .get(userId) as { count: number };
  const learnCountRow = db
    .prepare("SELECT COUNT(*) as count FROM skills WHERE user_id = ? AND direction = 'learn'")
    .get(userId) as { count: number };

  if (teachCountRow.count >= 1 && learnCountRow.count >= 1) {
    unlockAchievementOnce(
      userId,
      'reciprocal_ready',
      'Reciprocal Ready',
      'Added both a teachable skill and a learning goal.',
      'sync_alt'
    );
  }

  if (user.bio.trim().length > 10 && user.location.trim().length > 0 && user.availability.trim().length > 0 && teachCountRow.count >= 1) {
    unlockAchievementOnce(
      userId,
      'profile_pro',
      'Verified Profile',
      'Completed your campus profile and skill availability.',
      'verified'
    );
  }

  if (user.total_sessions >= 1) {
    unlockAchievementOnce(
      userId,
      'first_swap',
      'First Skill Swap',
      'Completed your first 1-for-1 learning session.',
      'handshake'
    );
  }

  if (user.total_sessions >= 5) {
    unlockAchievementOnce(
      userId,
      'campus_mentor',
      'Campus Mentor',
      'Completed 5 or more peer exchange sessions.',
      'school'
    );
  }

  if (user.rating_count >= 1 && user.rating_avg >= 4.5) {
    unlockAchievementOnce(
      userId,
      'top_rated',
      'Top-Rated Peer',
      'Maintained a 4.5+ star peer review rating.',
      'stars'
    );
  }

  if (user.points >= 100) {
    unlockAchievementOnce(
      userId,
      'century_club',
      'Century Scholar',
      'Earned 100+ reciprocal contribution points.',
      'workspace_premium'
    );
  }
}

export function computeProfileCompletion(
  user: { full_name?: string; bio?: string; location?: string; major?: string; year?: string; availability?: string },
  teachCount: number,
  learnCount: number
): number {
  let score = 0;
  if (user.full_name && user.full_name.trim().length > 1) score += 15;
  if (user.bio && user.bio.trim().length > 10) score += 20;
  if (user.location && user.location.trim().length > 2) score += 15;
  if (user.major && user.major.trim().length > 1) score += 10;
  if (user.availability && user.availability.trim().length > 2) score += 10;
  if (teachCount > 0) score += 15;
  if (learnCount > 0) score += 15;
  return Math.min(100, score);
}
